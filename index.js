
require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');

// تسجيل أوامر السلاش تلقائياً عند تشغيل البوت
const { REST, Routes } = require('discord.js');
// ...existing code...
const commands = [];
const commandFiles = fs.readdirSync('./src/commands/violations').filter(file => file.endsWith('Slash.js'));
for (const file of commandFiles) {
  const command = require(`./src/commands/violations/${file}`);
  if (command.data) {
    commands.push(command.data.toJSON());
  }
}
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
rest.put(
  Routes.applicationCommands(process.env.CLIENT_ID),
  { body: commands }
).then(() => {
  console.log('✅ Slash commands registered!');
}).catch(console.error);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

require('./src/handlers/commandHandler')(client);

const events = fs.readdirSync('./src/events');
for (const file of events) {
  const event = require(`./src/events/${file}`);
  client.on(event.name, (...args) => event.execute(...args, client));
}
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ حدث خطأ',
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);
