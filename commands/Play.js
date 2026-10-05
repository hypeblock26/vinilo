const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinAndPlay } = require('../musicQueue');
const { spawn } = require('child_process');

async function searchSong(query) {
  const isUrl = /^https?:\/\//i.test(query);
  const searchQuery = isUrl ? query : `ytsearch1:${query}`;

  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', [
      '--no-playlist', '--dump-json', '--flat-playlist', searchQuery,
    ]);
    let out = '', err = '';
    proc.stdout.on('data', d => (out += d));
    proc.stderr.on('data', d => (err += d));
    proc.on('close', code => {
      if (code !== 0) return reject(new Error(err || 'yt-dlp error'));
      try {
        const info = JSON.parse(out.trim().split('\n')[0]);
        resolve({
          title: info.title || info.fulltitle || 'Desconocido',
          url: info.webpage_url || info.url || query,
          duration: info.duration ? formatDuration(info.duration) : '??:??',
          thumbnail: info.thumbnail || null,
        });
      } catch (e) {
        reject(new Error('No se pudo parsear info de la canción'));
      }
    });
  });
}

function formatDuration(seconds) {
  if (!seconds) return '??:??';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce una canción de YouTube')
    .addStringOption(opt =>
      opt.setName('cancion')
        .setDescription('Nombre o URL de la canción')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    if (!interaction.member.voice.channel) {
      return interaction.editReply('❌ Debes estar en un canal de voz.');
    }

    const query = interaction.options.getString('cancion');

    let song;
    try {
      song = await searchSong(query);
      song.requestedBy = interaction.user.username;
    } catch (err) {
      return interaction.editReply(`❌ No se encontró la canción: ${err.message}`);
    }

    const { queued, position } = await joinAndPlay(interaction, song);

    if (queued) {
      // position = queue.songs.length después del push
      // actual = #1, cola empieza en #2
      const displayPos = position + 1;
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('➕ Añadida a la cola')
        .setDescription(`**[${song.title}](${song.url})**`)
        .addFields(
          { name: 'Duración', value: song.duration, inline: true },
          { name: 'Posición', value: `#${displayPos}`, inline: true },
          { name: 'Solicitado por', value: song.requestedBy, inline: true }
        )
        .setThumbnail(song.thumbnail);
      return interaction.editReply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('<a:vinilo:1516963000492494948> Reproduciendo ahora')
        .setDescription(`**[${song.title}](${song.url})**`)
        .addFields(
          { name: 'Duración', value: song.duration, inline: true },
          { name: 'Posición', value: 'Actual (#1)', inline: true },
          { name: 'Solicitado por', value: song.requestedBy, inline: true }
        )
        .setThumbnail(song.thumbnail);
      return interaction.editReply({ embeds: [embed] });
    }
  },
};