const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../musicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Mezcla aleatoriamente la cola de canciones'),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: '❌ No hay canciones en la cola para mezclar.', ephemeral: true });
    }

    for (let i = queue.songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
    }

    return interaction.reply(`🔀 Cola mezclada — ${queue.songs.length} canciones reordenadas.`);
  },
};