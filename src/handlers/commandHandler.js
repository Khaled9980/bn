const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  client.commands = new Map();

  const commandFolders = fs.readdirSync('./src/commands');
  for (const folder of commandFolders) {
    const files = fs.readdirSync(`./src/commands/${folder}`);
    for (const file of files) {
      const command = require(`../commands/${folder}/${file}`);
      client.commands.set(command.name, command);
    }
  }
};
