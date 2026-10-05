const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue, playSong } = require('../musicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('previous')
    .setDescription('Reproduce la canción anterior'),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || queue.history.length === 0) {
      return interaction.reply({ content: '❌ No hay canción anterior en el historial.', ephemeral: true });
    }

    await interaction.deferReply();

    const prev = queue.history.pop();

    if (queue.current) queue.songs.unshift(queue.current);

    try { if (queue._ffmpegProc) queue._ffmpegProc.kill('SIGKILL'); } catch (e) {}
    queue.skipping = true;
    queue.player.stop(true);
    await new Promise(res => setTimeout(res, 500));
    queue.skipping = false;

    await playSong(queue, prev);
    await new Promise(res => setTimeout(res, 1500));

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('⏮️ Canción anterior')
      .setDescription(`**[${prev.title}](${prev.url})**`)
      .addFields(
        { name: 'Duración', value: prev.duration, inline: true },
        { name: 'Solicitado por', value: prev.requestedBy, inline: true },
        { name: 'En cola', value: `${queue.songs.length} canción(es)`, inline: true },
      )
      .setThumbnail(prev.thumbnail)

    return interaction.editReply({ embeds: [embed] });
  },
};