const { EmbedBuilder } = require('discord.js');
const { loadDB, saveDB, getUser } = require('../../utils/database');

module.exports = {
  name: 'سحب',
  description: 'سحب مبلغ من البنك',
  execute(message, args) {
    const db = loadDB();
    const user = getUser(db, message.author.id);
    const amount = parseInt(args[0]);
    if (!amount || amount <= 0 || amount > user.bank)
      return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ مبلغ غير صالح أو غير كافٍ في البنك')] });

    user.bank -= amount;
    user.wallet += amount;
    saveDB(db);
    const embed = new EmbedBuilder()
      .setTitle(' سحب من البنك')
      .setColor('Green')
      .setDescription(`تم سحب **${amount}** ريال من البنك بنجاح!`)
      .addFields(
        { name: 'رصيد البنك', value: `${user.bank} ريال`, inline: true },
        { name: 'الكاش', value: `${user.wallet} ريال`, inline: true }
      );
    message.reply({ embeds: [embed] });
  }
};
