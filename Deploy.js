
require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; 

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data) commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Registrando ${commands.length} comandos...`);

    if (guildId) {
      
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`✅ Comandos registrados en el server ${guildId}`);
    } else {
      
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('✅ Comandos registrados globalmente');
    }
  } catch (err) {
    console.error('❌ Error al registrar comandos:', err);
  }
})();