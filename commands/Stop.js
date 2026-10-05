const { SlashCommandBuilder } = require('discord.js');
const { getQueue, deleteQueue } = require('../musicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Detiene la música y desconecta el bot'),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue) {
      return interaction.reply({ content: '❌ No hay nada reproduciéndose.', ephemeral: true });
    }

    queue.songs = [];
    queue.current = null;
    queue.playing = false;

    try { if (queue._ffmpegProc) queue._ffmpegProc.kill('SIGKILL'); } catch (e) {}
    try { if (queue.player) queue.player.stop(true); } catch (e) {}
    try { if (queue.connection) queue.connection.destroy(); } catch (e) {}

    deleteQueue(interaction.guildId);

    return interaction.reply('⏹️ Música detenida. ¡Hasta luego!');
  },
};