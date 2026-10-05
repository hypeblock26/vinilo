const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../musicQueue');
const { spawn } = require('child_process');

async function searchSong(query) {
  const isUrl = /^https?:\/\//i.test(query);
  const searchQuery = isUrl ? query : `ytsearch1:${query}`;

  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', ['--no-playlist', '--dump-json', '--flat-playlist', searchQuery]);
    let out = '', err = '';
    proc.stdout.on('data', d => (out += d));
    proc.stderr.on('data', d => (err += d));
    proc.on('close', code => {
      if (code !== 0) return reject(new Error(err || 'yt-dlp error'));
      try {
        const info = JSON.parse(out.trim().split('\n')[0]);
        const m = info.duration ? Math.floor(info.duration / 60) : 0;
        const s = info.duration ? Math.floor(info.duration % 60) : 0;
        resolve({
          title: info.title || 'Desconocido',
          url: info.webpage_url || info.url || query,
          duration: `${m}:${s.toString().padStart(2, '0')}`,
          thumbnail: info.thumbnail || null,
        });
      } catch (e) {
        reject(new Error('No se pudo parsear info de la canción'));
      }
    });
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('insert')
    .setDescription('Inserta una canción en una posición específica de la cola')
    .addStringOption(opt =>
      opt.setName('cancion')
        .setDescription('Nombre o URL de la canción')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('posicion')
        .setDescription('Posición donde insertar (#2 = justo después de la actual)')
        .setRequired(true)
        .setMinValue(2)
    ),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || !queue.playing) {
      return interaction.reply({ content: '❌ No hay música reproduciéndose.', ephemeral: true });
    }

    await interaction.deferReply();

    const query = interaction.options.getString('cancion');
    const pos = interaction.options.getInteger('posicion');

    let song;
    try {
      song = await searchSong(query);
      song.requestedBy = interaction.user.username;
    } catch (err) {
      return interaction.editReply(`❌ No se encontró la canción: ${err.message}`);
    }

    // #1 = actual, #2 = primera en cola (index 0), #3 = segunda (index 1), etc.
    const insertIndex = Math.min(pos - 2, queue.songs.length);
    queue.songs.splice(insertIndex, 0, song);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📌 Canción insertada')
      .setDescription(`**[${song.title}](${song.url})**`)
      .addFields(
        { name: 'Duración', value: song.duration, inline: true },
        { name: 'Posición', value: `#${insertIndex + 2}`, inline: true },
        { name: 'Solicitado por', value: song.requestedBy, inline: true },
      )
      .setImage(song.thumbnail);

    return interaction.editReply({ embeds: [embed] });
  },
};