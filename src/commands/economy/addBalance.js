const { loadDB, saveDB, getUser } = require('../../utils/database');
const path = require('path');

module.exports = {
  name: 'اضافه',
  description: 'اضافة رصيد لأي مستخدم (ادمن فقط)',
  adminOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has('Administrator'))
      return message.reply('❌ هذا الأمر للادمن فقط');

    const db = loadDB();
    const amount = parseInt(args[1]) || parseInt(args[0]);
    if (!amount || amount <= 0)
      return message.reply('❌ استخدم: -اضافه @المستخدم/الرتبة المبلغ');

    const mentionedRoles = message.mentions.roles;
    const mentionedUsers = message.mentions.users;

    if (mentionedRoles.size > 0) {
      // إضافة لكل أعضاء الرتبة
      let found = false;
      for (const [roleId, role] of mentionedRoles) {
        const members = message.guild.members.cache.filter(m => m.roles.cache.has(roleId) && !m.user.bot);
        if (members.size > 0) {
          found = true;
          members.forEach(member => {
            const user = getUser(db, member.user.id);
            user.bank = (user.bank || 0) + amount;
          });
          saveDB(db);
          return message.reply(`✅ تم إضافة ${amount} لرصيد البنك لجميع أعضاء رتبة "${role.name}"`);
        }
      }
      if (!found)
        return message.reply('❌ لم يتم العثور على أعضاء في الرتبة أو كلهم بوتات.');
    } else if (mentionedUsers.size > 0) {
      // إضافة لشخص واحد
      const userMention = mentionedUsers.first();
      const user = getUser(db, userMention.id);
      user.bank = (user.bank || 0) + amount;
      saveDB(db);
      return message.reply(`✅ تم إضافة ${amount} لرصيد البنك لـ <@${userMention.id}>`);
    } else {
      return message.reply('❌ استخدم: -اضافه @المستخدم/الرتبة المبلغ');
    }
  }
};
