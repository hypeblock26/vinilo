const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../musicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Elimina una canción de la cola')
    .addIntegerOption(opt =>
      opt.setName('posicion')
        .setDescription('Posición de la canción (usa /queue para verla, mínimo #2)')
        .setRequired(true)
        .setMinValue(2)
    ),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: '❌ La cola está vacía.', ephemeral: true });
    }

    const pos = interaction.options.getInteger('posicion');
    const queueIndex = pos - 2;

    if (queueIndex < 0 || queueIndex >= queue.songs.length) {
      return interaction.reply({ content: `❌ Posición inválida. Hay **${queue.songs.length}** canción(es) en cola (posiciones #2 - #${queue.songs.length + 1}).`, ephemeral: true });
    }

    const removed = queue.songs.splice(queueIndex, 1)[0];
    return interaction.reply(`🗑️ Eliminada: **${removed.title}** (posición #${pos})`);
  },
};