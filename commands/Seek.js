const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../musicQueue');
const { spawn } = require('child_process');
const { createAudioResource, StreamType } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Salta a un momento específico de la canción')
    .addStringOption(opt =>
      opt.setName('tiempo')
        .setDescription('Tiempo en formato mm:ss (ej: 1:30)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || !queue.current) {
      return interaction.reply({ content: '❌ No hay ninguna canción reproduciéndose.', ephemeral: true });
    }

    const tiempoStr = interaction.options.getString('tiempo');
    const partes = tiempoStr.split(':').map(Number);

    if (partes.some(isNaN) || partes.length < 2) {
      return interaction.reply({ content: '❌ Formato inválido. Usa mm:ss (ej: `1:30`)', ephemeral: true });
    }

    const segundos = partes.length === 3
      ? partes[0] * 3600 + partes[1] * 60 + partes[2]
      : partes[0] * 60 + partes[1];

    await interaction.deferReply();

    try {
      const { getStreamUrl, buildFFmpegArgs } = require('../musicQueue');

      const { spawn: spawnProc } = require('child_process');
      const urlProc = spawnProc('yt-dlp', ['--no-playlist', '-f', 'bestaudio/best', '--get-url', queue.current.url]);
      let streamUrl = '';
      urlProc.stdout.on('data', d => (streamUrl += d));
      await new Promise(res => urlProc.on('close', res));
      streamUrl = streamUrl.trim().split('\n')[0];

      if (queue._ffmpegProc) queue._ffmpegProc.kill('SIGKILL');

      const ffmpegArgs = [
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5',
        '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        '-ss', String(segundos),
        '-i', streamUrl,
        '-vn',
        ...(queue.filter ? ['-af', getFilterArg(queue.filter)] : []),
        '-f', 's16le', '-ar', '48000', '-ac', '2', 'pipe:1',
      ];

      const ffmpeg = spawnProc('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
      ffmpeg.stderr.on('data', d => {
        const msg = d.toString();
        if (msg.includes('Error')) console.error('FFMPEG SEEK ERROR:', msg);
      });

      const resource = createAudioResource(ffmpeg.stdout, { inputType: StreamType.Raw });
      queue.player.play(resource);
      queue._ffmpegProc = ffmpeg;

      return interaction.editReply(`⏩ Saltando a **${tiempoStr}**.`);
    } catch (err) {
      console.error('Seek error:', err);
      return interaction.editReply('❌ No se pudo saltar al tiempo indicado.');
    }
  },
};

function getFilterArg(filter) {
  const map = {
    bassboost: 'bass=g=20,dynaudnorm=f=200',
    '8d': 'apulsator=hz=0.08',
    nightcore: 'aresample=48000,asetrate=48000*1.25',
    karaoke: 'stereotools=mlev=0.1',
    vaporwave: 'aresample=48000,asetrate=48000*0.8',
    earrape: 'channelsplit,sidechaingate=level_in=64',
    soft: 'speechnorm=e=6.25:r=0.00001:l=1',
    speed: 'atempo=1.5',
  };
  return map[filter] || '';
}