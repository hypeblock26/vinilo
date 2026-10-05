const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../musicQueue');

const SONGS_PER_PAGE = 10;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra la cola de canciones')
    .addIntegerOption(opt =>
      opt.setName('pagina')
        .setDescription('Número de página')
        .setMinValue(1)
    ),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || (!queue.current && queue.songs.length === 0)) {
      return interaction.reply({ content: '❌ La cola está vacía.', ephemeral: true });
    }

    const page = interaction.options.getInteger('pagina') || 1;
    const totalPages = Math.ceil(queue.songs.length / SONGS_PER_PAGE) || 1;

    if (page > totalPages) {
      return interaction.reply({ content: `❌ Página inválida. Máximo: ${totalPages}`, ephemeral: true });
    }

    const start = (page - 1) * SONGS_PER_PAGE;
    const end = start + SONGS_PER_PAGE;
    const pageSongs = queue.songs.slice(start, end);

    const loopIcon = queue.loop === 'song' ? '🔂' : queue.loop === 'queue' ? '🔁' : '';

    const songsList = pageSongs.map((s, i) => {
      const globalPos = start + i + 2; 
      return `\`#${globalPos}\` [${s.title}](${s.url}) | \`${s.duration}\` | ${s.requestedBy}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`🎵 Cola de canciones ${loopIcon}`)
      .setDescription(
`\`#1\`[${queue.current.title}](${queue.current.url}) | \`${queue.current.duration}\` | ${queue.current.requestedBy}\n\n` +        (pageSongs.length > 0 ? songsList : 'No hay más canciones en cola.')
      )
      .setFooter({ text: `Página ${page}/${totalPages} • ${queue.songs.length} canciones en cola` });

    return interaction.reply({ embeds: [embed] });
  },
};
