const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { createViolation } = require('./addViolation');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addviolation')
    .setDescription('إضافة مخالفة جديدة')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('اسم المخالفة')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('fine')
        .setDescription('سعر المخالفة')
        .setRequired(true)
    ),

  async execute(interaction) {
    // تحقق من صلاحية Administrator
    if (!interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: '❌ هذا الأمر مخصص للأدمن فقط.',
        ephemeral: true
      });
    }

    const name = interaction.options.getString('name');
    const fine = interaction.options.getInteger('fine');

    // تحقق إضافي
    if (fine <= 0) {
      return interaction.reply({
        content: '❌ سعر المخالفة يجب أن يكون رقمًا أكبر من 0.',
        ephemeral: true
      });
    }

    try {
      const result = await createViolation(name, fine);

      if (!result) {
        return interaction.reply({
          content: '❌ فشل في إضافة المخالفة (قد يكون الاسم مكرر).',
          ephemeral: true
        });
      }

      return interaction.reply({
        content: `✅ تم إضافة المخالفة بنجاح:\n📌 الاسم: **${name}**\n💰 السعر: **${fine}**`,
        ephemeral: true
      });

    } catch (error) {
      console.error('AddViolation Error:', error);
      return interaction.reply({
        content: '❌ حصل خطأ أثناء تنفيذ الأمر.',
        ephemeral: true
      });
    }
  }
};
