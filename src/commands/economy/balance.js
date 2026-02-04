const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'رصيد',
  description: 'عرض رصيد المستخدم',
  execute(message, args, db, user) {
    try {
      const total = user.wallet + user.bank;

      const formatNumber = (num) => num.toLocaleString();

      const embed = new EmbedBuilder()
        .setTitle(` مرحبا بك في مصرف بلاك نايت ${message.author.username}`)
        .setColor('Blue')
        .addFields(
          { name: ' الكاش', value: `${formatNumber(user.wallet)} ريال`, inline: true },
          { name: ' البنك', value: `${formatNumber(user.bank)} ريال`, inline: true },
          { name: ' المجموع الكلي', value: `${formatNumber(total)} ريال`, inline: false }
        )


      message.reply({ embeds: [embed] });

    } catch (err) {
      console.error('⚠️ Error in رصيد command:', err);
      message.reply('❌ حدث خطأ أثناء جلب الرصيد.');
    }
  }
};

