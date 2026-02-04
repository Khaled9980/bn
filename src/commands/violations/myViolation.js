const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');

const { loadDB, getUser } = require('../../utils/database');

module.exports = {
  name: 'مخالفاتي',

  async execute(message) {
    const userId = message.author.id;
    const db = loadDB();
    const user = getUser(db, userId);

    if (!user.violations || user.violations.length === 0) {
      return message.reply(' ليس لديك أي مخالفات حالياً.');
    }

    // 🔹 إعداد خيارات Dropdown لكل مخالفة (العنوان + السعر)
    const options = user.violations.map((v, i) => ({
      label: v.type.length > 25 ? v.type.slice(0, 25) + '...' : v.type,
      description: `السعر: ${v.fine}`,
      value: i.toString()
    }));

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`myviolations_${userId}`)
      .setPlaceholder('اختر مخالفة لعرض التفاصيل')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(menu);

    await message.reply({
      content: '  مخالفاتك:',
      components: [row]
    });
  },

  async onSelect(interaction) {
    if (!interaction.customId.startsWith('myviolations_')) return;

    const userId = interaction.customId.split('_')[1];
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: '❌ هذا ليس حسابك', ephemeral: true });
    }

    const db = loadDB();
    const user = getUser(db, userId);

    const index = parseInt(interaction.values[0]);
    const v = user.violations[index];

    if (!v) return interaction.reply({ content: '❌ مخالفة غير موجودة', ephemeral: true });

    // 🔹 Embed نفس شكل "تم قيد المخالفة"
    const embed = new EmbedBuilder()
      .setTitle('✅ تم قيد مخالفة عسكرية')
      .setColor('Green')
      .addFields(
        { name: '👮 العسكري', value: `<@${interaction.user.id}>`, inline: true },
        { name: '🚓 المخالف', value: `<@${userId}>`, inline: true },
        { name: '📄 نوع المخالفة', value: v.type, inline: true },
        { name: '💰 الغرامة', value: `${v.fine}`, inline: true },
        {
          name: '📅 التاريخ',
          value: `<t:${Math.floor(v.date / 1000)}:f>`,
          inline: false
        }
      );

    // 🔹 تعطيل Dropdown بعد الاختيار
    const disabledMenu = new StringSelectMenuBuilder()
      .setCustomId('disabled')
      .setPlaceholder('تم اختيار المخالفة')
      .setDisabled(true)
      .addOptions([
        { label: v.type.length > 25 ? v.type.slice(0, 25) + '...' : v.type, value: 'done' }
      ]);

    const row = new ActionRowBuilder().addComponents(disabledMenu);

    await interaction.update({
      embeds: [embed],
      components: [row]
    });
  }
};

