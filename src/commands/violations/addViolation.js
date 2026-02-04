

const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const { loadDB, saveDB, getUser } = require('../../utils/database');

// مسار ملف المخالفات
const violationsPath = path.resolve(__dirname, '../../utils/violations.json');

// تحميل المخالفات من JSON في كل مرة
function loadViolations() {
  return JSON.parse(fs.readFileSync(violationsPath, 'utf8'));
}

// الرتب المسموح لها استخدام الأمر
const allowedRoleIds = [
  '1386689913411469343',
  '987654321098765432'
];
// رتبه ممنوع
const penaltyRoleId = '1468292358293684315';
module.exports = {
  name: 'مخالفة',
  adminOnly: false,

  // =============================
  // تنفيذ الأمر
  // =============================
  async execute(message) {
    const hasRole = message.member.roles.cache.some(r =>
      allowedRoleIds.includes(r.id)
    );
    if (!hasRole)
      return message.reply('❌ ليس لديك صلاحية استخدام هذا الأمر.');

    const target = message.mentions.users.first();
    if (!target)
      return message.reply('❌ منشن العضو');

    // تحميل المخالفات (محدثة دايمًا)
    const violations = loadViolations();

    // صورة مرفقة (إن وجدت)
    let imageUrl = null;
    if (message.attachments?.size > 0) {
      const img = message.attachments.find(a =>
        a.contentType?.startsWith('image/')
      );
      if (img) imageUrl = img.url;
    }

    const embed = new EmbedBuilder()
      .setTitle('🚨 تسجيل مخالفة')
      .setDescription(`اختر نوع المخالفة لـ <@${target.id}>`)
      .setColor('Red');

    if (imageUrl) embed.setImage(imageUrl);

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`mukhalafa_${target.id}`)
      .setPlaceholder('اختر المخالفة')
      .addOptions(
        violations.map(v => ({
          label: v.name,
          description: `الغرامة: ${v.fine}`,
          value: v.id
        }))
      );

    const row = new ActionRowBuilder().addComponents(menu);

    await message.reply({
      embeds: [embed],
      components: [row]
    });
  },

  // =============================
  // عند اختيار المخالفة
  // =============================
  async onSelect(interaction) {
    if (!interaction.customId.startsWith('mukhalafa_')) return;

    await interaction.deferUpdate();

    const userId = interaction.customId.split('_')[1];
    const typeId = interaction.values[0];

    // تحميل المخالفات مرة ثانية (أمان)
    const violations = loadViolations();

    const infType = violations.find(v => v.id === typeId);
    if (!infType) return;

    const db = loadDB();
    const user = getUser(db, userId);

    // جلب الصورة من الإيمبد
    let imageUrl = null;
    if (interaction.message.embeds?.[0]?.image) {
      imageUrl = interaction.message.embeds[0].image.url;
    }

    const note = 'وزارة الداخلية';

    // خصم الغرامة
    if (user.bank >= infType.fine) {
      user.bank -= infType.fine;
    }

    user.violations.push({
      type: infType.name,
      fine: infType.fine,
      by: interaction.user.tag,
      date: Date.now()
    });

    saveDB(db);

    // إضافة رتبة العقوبة عند 5 مخالفات
    try {
      if (user.violations.length >= 5 && penaltyRoleId) {
        const member = await interaction.guild.members
          .fetch(userId)
          .catch(() => null);

        if (member && !member.roles.cache.has(penaltyRoleId)) {
          await member.roles.add(penaltyRoleId).catch(() => {});
        }
      }
    } catch {}

    // تعطيل القائمة
    const disabledMenu = new StringSelectMenuBuilder()
      .setCustomId('disabled')
      .setPlaceholder('تم تسجيل المخالفة')
      .setDisabled(true)
      .addOptions([{ label: infType.name, value: 'done' }]);

    const row = new ActionRowBuilder().addComponents(disabledMenu);

    const embed = new EmbedBuilder()
      .setTitle('🚨 تم قيد مخالفة عسكرية')
      .setColor('Red')
      .addFields(
        { name: '👮 العسكري', value: `<@${interaction.user.id}>`, inline: true },
        { name: '👤 المواطن', value: `<@${userId}>`, inline: true },
        { name: '📄 نوع المخالفة', value: infType.name, inline: true },
        { name: '💰 سعر المخالفة', value: `${infType.fine}`, inline: true },
        {
          name: '📅 التاريخ',
          value: `<t:${Math.floor(Date.now() / 1000)}:f>`
        }
      )
      .setFooter({ text: note });

    if (imageUrl) embed.setImage(imageUrl);

    await interaction.editReply({
      embeds: [embed],
      components: [row]
    });

    // إرسال DM
    try {
      const dmEmbed = EmbedBuilder.from(embed).setTitle('🚨 إشعار مخالفة');
      await interaction.client.users.send(userId, {
        embeds: [dmEmbed]
      });
    } catch {}
  }
};
