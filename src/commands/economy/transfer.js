const { EmbedBuilder } = require('discord.js');
const { loadDB, saveDB, getUser } = require('../../utils/database');

module.exports = {
  name: 'تحويل',
  description: 'تحويل مبلغ من البنك إلى مستخدم آخر',
  async execute(message, args, db, sender) {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);
    if (!target || isNaN(amount) || amount <= 0)
      return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ استخدم: -تحويل @المستخدم المبلغ')] });
    if (amount > sender.bank)
      return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ لا يوجد رصيد كافٍ في البنك')] });
    if (target.id === message.author.id)
      return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ لا يمكنك تحويل لنفسك')] });

    const receiver = getUser(db, target.id);
    sender.bank -= amount;
    receiver.bank += amount;
    const embed = new EmbedBuilder()
      .setTitle(' تحويل بنكي')
      .setColor('Green')
      .setDescription(`تم تحويل **${amount}** ريال إلى <@${target.id}> بنجاح!`)
      .addFields(
        { name: 'رصيدك بعد التحويل', value: `${sender.bank} ريال`, inline: true },
        { name: `رصيد <@${target.id}>`, value: `${receiver.bank} ريال`, inline: true }
      );
    message.reply({ embeds: [embed] });
  }
};
