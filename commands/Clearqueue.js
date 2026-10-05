const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../musicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription('Limpia todas las canciones de la cola'),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: '❌ La cola ya está vacía.', ephemeral: true });
    }

    const cantidad = queue.songs.length;
    queue.songs = [];

    return interaction.reply(`🗑️ Cola limpiada — **${cantidad}** canción(es) eliminadas.`);
  },
};