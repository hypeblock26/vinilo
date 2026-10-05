const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../musicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Reanuda la música pausada'),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue) {
      return interaction.reply({ content: '❌ No hay música en cola.', ephemeral: true });
    }

    const resumed = queue.player.unpause();
    if (resumed) {
      return interaction.reply('▶️ Música reanudada.');
    } else {
      return interaction.reply({ content: '❌ La música no estaba pausada.', ephemeral: true });
    }
  },
};