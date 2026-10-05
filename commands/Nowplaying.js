const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../musicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Muestra la canción que se está reproduciendo'),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || !queue.current) {
      return interaction.reply({ content: '❌ No hay ninguna canción reproduciéndose.', ephemeral: true });
    }

    const loopIcon = queue.loop === 'song' ? '🔂' : queue.loop === 'queue' ? '🔁' : '➡️';

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('▶️ Reproduciendo ahora')
      .setDescription(`**[${queue.current.title}](${queue.current.url})**`)
      .addFields(
        { name: 'Duración', value: queue.current.duration, inline: true },
        { name: 'Solicitado por', value: queue.current.requestedBy, inline: true },
        { name: 'Loop', value: loopIcon, inline: true },
        { name: 'Filtro', value: queue.filter ? `\`${queue.filter}\`` : '`ninguno`', inline: true },
        { name: 'Volumen', value: `${Math.round(queue.volume * 100)}%`, inline: true },
        { name: 'En cola', value: `${queue.songs.length} canción(es)`, inline: true },
      )
      .setImage(queue.current.thumbnail);

    return interaction.reply({ embeds: [embed] });
  },
};