const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../musicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausa la música'),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || !queue.playing) {
      return interaction.reply({ content: '❌ No hay nada reproduciéndose.', ephemeral: true });
    }

    const paused = queue.player.pause();
    if (paused) {
      return interaction.reply('⏸️ Música pausada.');
    } else {
      return interaction.reply({ content: '❌ No se pudo pausar.', ephemeral: true });
    }
  },
};