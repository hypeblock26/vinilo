const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../musicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta la canción actual'),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || !queue.playing) {
      return interaction.reply({ content: '❌ No hay nada reproduciéndose.', ephemeral: true });
    }

    await interaction.deferReply();

    const skipped = queue.current;
    queue.loop = queue.loop === 'song' ? 'none' : queue.loop;
    queue.player.stop();

    await new Promise(res => setTimeout(res, 2000));

    const next = queue.current;

    if (!next) {
      return interaction.editReply(`⏭️ Saltando **${skipped?.title}**... la cola quedó vacía.`);
    }

    const loopIcon = queue.loop === 'song' ? '🔂' : queue.loop === 'queue' ? '🔁' : '➡️';

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('▶️ Sonando ahora')
      .setDescription(`**[${next.title}](${next.url})**`)
      .addFields(
        { name: 'Duración', value: next.duration, inline: true },
        { name: 'Solicitado por', value: next.requestedBy, inline: true },
        { name: 'Loop', value: loopIcon, inline: true },
        { name: 'Filtro', value: queue.filter ? `\`${queue.filter}\`` : '`ninguno`', inline: true },
        { name: 'Volumen', value: `${Math.round(queue.volume * 100)}%`, inline: true },
        { name: 'En cola', value: `${queue.songs.length} canción(es)`, inline: true },
      )
      .setThumbnail(next.thumbnail)

    return interaction.editReply({ embeds: [embed] });
  },
};