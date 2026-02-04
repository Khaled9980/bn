const { loadDB, saveDB, getUser } = require('../../utils/database');

module.exports = {
  name: 'ازاله',
  description: 'ازالة رصيد من أي مستخدم (ادمن فقط)',
  adminOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has('Administrator'))
      return message.reply('❌ هذا الأمر للادمن فقط');

    const db = loadDB();
    const amount = parseInt(args[1]) || parseInt(args[0]);
    if (!amount || amount <= 0)
      return message.reply('❌ استخدم: -ازاله @المستخدم/الرتبة المبلغ');

    const mentionedRoles = message.mentions.roles;
    const mentionedUsers = message.mentions.users;
    let removed = [];

    if (mentionedRoles.size > 0) {
      // إزالة من كل أعضاء الرتبة
      for (const [roleId, role] of mentionedRoles) {
        const members = message.guild.members.cache.filter(m => m.roles.cache.has(roleId) && !m.user.bot);
        members.forEach(member => {
          const user = getUser(db, member.user.id);
          user.bank = Math.max(0, (user.bank || 0) - amount);
          removed.push(`<@${member.user.id}>`);
        });
      }
      saveDB(db);
      if (removed.length > 0)
        return message.reply(`✅ تم إزالة ${amount} من رصيد البنك لكل من: ${removed.join(", ")}`);
      else
        return message.reply('❌ لم يتم العثور على أعضاء في الرتبة أو كلهم بوتات.');
    } else if (mentionedUsers.size > 0) {
      // إزالة من شخص واحد
      const userMention = mentionedUsers.first();
      const user = getUser(db, userMention.id);
      user.bank = Math.max(0, (user.bank || 0) - amount);
      saveDB(db);
      return message.reply(`✅ تم إزالة ${amount} من رصيد البنك لـ <@${userMention.id}>`);
    } else {
      return message.reply('❌ استخدم: -ازاله @المستخدم/الرتبة المبلغ');
    }
  }
};
