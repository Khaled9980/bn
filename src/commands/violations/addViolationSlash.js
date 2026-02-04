const fs = require('fs');
const path = require('path');
const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

const violationsPath = path.resolve(__dirname, '../../utils/violations.json');

// ─────────────────────────────
// دوال المساعدة
// ─────────────────────────────
function loadViolations() {
  if (!fs.existsSync(violationsPath)) return [];
  return JSON.parse(fs.readFileSync(violationsPath, 'utf8'));
}

function saveViolations(data) {
  // فقط إضافة عنصر جديد بدون تغيير العناصر السابقة
  fs.writeFileSync(
    violationsPath,
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

function generateId(name) {
  // تبقي ID نفس الاسم أو يمكن تحويل الفراغات ل _
  return name.toLowerCase().replace(/\s+/g, '_');
}

// ─────────────────────────────
// أمر السلاش
// ─────────────────────────────
module.exports = {
  data: new SlashCommandBuilder()
    .setName('اضافة_مخالفة')
    .setDescription('إضافة مخالفة جديدة إلى النظام')
    .addStringOption(option =>
      option
        .setName('الاسم')
        .setDescription('اسم المخالفة')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('السعر')
        .setDescription('قيمة الغرامة')
        .setRequired(true)
        .setMinValue(1)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      console.log('ADD VIOLATION COMMAND FIRED');

      await interaction.deferReply({ flags: 64 });

      const name = interaction.options.getString('الاسم');
      const fine = interaction.options.getInteger('السعر');

      const violations = loadViolations();
      const id = generateId(name);

      // منع التكرار
      if (violations.some(v => v.id === id)) {
        return interaction.editReply(
          '❌ هذه المخالفة موجودة مسبقًا'
        );
      }

      // ➕ إضافة مخالفة جديدة فقط، العناصر السابقة تبقى كما هي
      violations.push({ id, name, fine });

      saveViolations(violations);

      await interaction.editReply(
        `✅ تم إضافة المخالفة بنجاح\n\n` +
        `📄 الاسم: **${name}**\n` +
        `💰 السعر: **${fine}**\n` +
        `🆔 المعرف: \`${id}\``
      );

    } catch (error) {
      console.error('ADD VIOLATION ERROR:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ حدث خطأ غير متوقع',
          flags: 64
        });
      } else {
        await interaction.editReply('❌ حدث خطأ غير متوقع');
      }
    }
  }
};
