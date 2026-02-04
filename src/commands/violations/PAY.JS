const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { loadDB, saveDB, getUser } = require('../../utils/database.js');

module.exports = {
  name: 'تسديد',
  description: 'تسديد مخالفة',

  async execute(message) {
    try {
      const userId = message.author.id;
      const db = loadDB();
      const user = getUser(db, userId);

      if (!user.violations || user.violations.length === 0)
        return message.reply('ليس لديك مخالفات لتسديدها.');

      const options = user.violations.map((v, i) => ({
        label: v.type,
        description: `الغرامة: ${v.fine}`,
        value: i.toString()
      }));

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`payviolations_${userId}`)
        .setPlaceholder('اختر مخالفة لتسديدها')
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(menu);

      await message.reply({
        content: '💳 اختر مخالفة لتسديدها:',
        components: [row]
      });
    } catch (err) {
      console.error('Execute Command Error:', err);
      message.reply('❌ حدث خطأ داخلي أثناء تنفيذ الأمر');
    }
  },

  async onSelect(interaction) {
    try {
      if (!interaction.isStringSelectMenu()) return;
      await interaction.deferUpdate();

      const userId = interaction.customId.split('_')[1];
      if (interaction.user.id !== userId) {
        return interaction.followUp({ content: '❌ هذا ليس حسابك', ephemeral: true });
      }

      const db = loadDB();
      const user = getUser(db, userId);
      const index = parseInt(interaction.values[0]);
      const v = user.violations[index];
      if (!v) return interaction.followUp({ content: '❌ مخالفة غير موجودة', ephemeral: true });

      // خصم من البنك فقط
      if (user.bank < v.fine) {
        return interaction.followUp({ content: '❌ لا يوجد رصيد كافي في البنك للتسديد', ephemeral: true });
      }
      user.bank -= v.fine;
      user.violations.splice(index, 1);
      saveDB(db);

      const embed = new EmbedBuilder()
        .setTitle('تم تسديد مخالفة')
        .setColor('Green')
        .addFields(
          { name: 'المخالف', value: `<@${userId}>`, inline: true },
          { name: 'نوع المخالفة', value: v.type, inline: true },
          { name: 'الغرامة', value: `${v.fine}`, inline: true },
          { name: 'التاريخ', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
        )
        .setFooter({ text: ' وزاره الداخلية' });

      const disabledMenu = new StringSelectMenuBuilder()
        .setCustomId('disabled')
        .setPlaceholder('تم اختيار المخالفة')
        .setDisabled(true)
        .addOptions([{ label: v.type, value: 'done' }]);

      const row = new ActionRowBuilder().addComponents(disabledMenu);

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      console.error('⚠️ Error in onSelect:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: `❌ حصل خطأ أثناء التسديد: ${err.message}`,
          ephemeral: true
        });
      }
    }
  }
};
