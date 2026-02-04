const { loadDB, saveDB, getUser } = require('../utils/database');

module.exports = {
  name: 'messageCreate',
  execute(message, client) {
    if (message.author.bot || !message.content.startsWith('-')) return;

    const args = message.content.slice(1).split(' ');
    const cmdName = args.shift();

    const command = client.commands.get(cmdName);
    if (!command) return;

    if (command.adminOnly &&
        !message.member.permissions.has('Administrator'))
      return message.reply('❌ ما عندك صلاحية');

    const db = loadDB();
    const user = getUser(db, message.author.id);

    command.execute(message, args, db, user);
    saveDB(db);
  }
};
