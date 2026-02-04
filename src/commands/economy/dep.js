const { EmbedBuilder } = require('discord.js');
const { loadDB, saveDB, getUser } = require('../../utils/database');

module.exports = {
  name: 'ايداع',
  description: 'إيداع مبلغ في البنك',
  execute(message, args, db, user) {
    const amount = parseInt(args[0]);
    if (!amount || amount <= 0 || amount > user.wallet)
      return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ مبلغ غير صالح أو غير كافٍ في المحفظة')] });

    user.wallet -= amount;
    user.bank += amount;
    const embed = new EmbedBuilder()
      .setTitle(' إيداع بنكي')
      .setColor('Green')
      .setDescription(`تم إيداع **${amount}** ريال في البنك بنجاح!`)
      .addFields(
        { name: 'رصيد البنك', value: `${user.bank} ريال`, inline: true },
        { name: 'الكاش', value: `${user.wallet} ريال`, inline: true }
      );
    message.reply({ embeds: [embed] });
  }
};
