module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    if (!interaction.isStringSelectMenu()) return;

    // إذا كان الدروبداون خاص بالمخالفات
    if (interaction.customId.startsWith('mukhalafa_')) {
      const command = client.commands.get('مخالفة');
      if (!command || typeof command.onSelect !== 'function') return;
      try {
        await command.onSelect(interaction);
      } catch (err) {
        console.error(err);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '❌ حصل خطأ أثناء تنفيذ المخالفة',
            ephemeral: true
          });
        }
      }
    }
    // إذا كان الدروبداون خاص بالتسديد
    else if (interaction.customId.startsWith('payviolations_')) {
      const command = client.commands.get('تسديد');
      if (!command || typeof command.onSelect !== 'function') return;
      try {
        await command.onSelect(interaction);
      } catch (err) {
        console.error(err);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '❌ حصل خطأ أثناء تنفيذ التسديد',
            ephemeral: true
          });
        }
      }
    }
  }
};
