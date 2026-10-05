const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
} = require('@discordjs/voice');
const { spawn } = require('child_process');
const path = require('path');

const queues = new Map();

class GuildQueue {
  constructor(guildId, voiceChannel, textChannel) {
    this.resource = null;
    this.playStart = null;
    this.guildId = guildId;
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;
    this.songs = [];
    this.current = null;
    this.loop = 'none';
    this.volume = 1.0;
    this.filter = null;
    this.connection = null;
    this.player = null;
    this.playing = false;
    this.history = [];
    this.skipping = false;
  }
}

function getQueue(guildId) {
  return queues.get(guildId) || null;
}

function createQueue(guildId, voiceChannel, textChannel) {
  const q = new GuildQueue(guildId, voiceChannel, textChannel);
  queues.set(guildId, q);
  return q;
}

function deleteQueue(guildId) {
  queues.delete(guildId);
}

function buildFFmpegArgs(url, filter, volume, seekSeconds = 0) {
  const baseArgs = [
    '-reconnect', '1',
    '-reconnect_streamed', '1',
    '-reconnect_delay_max', '5',
    '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ...(seekSeconds > 0 ? ['-ss', String(seekSeconds)] : []),
    '-i', url,
    '-vn',
  ];

  const filters = [];

  if (volume !== 1.0) filters.push(`volume=${volume}`);

  if (filter) {
    switch (filter) {
      case 'bassboost':   filters.push('bass=g=20,dynaudnorm=f=200'); break;
      case '8d':          filters.push('apulsator=hz=0.08'); break;
      case 'nightcore':   filters.push('aresample=48000,asetrate=48000*1.25'); break;
      case 'karaoke':     filters.push('stereotools=mlev=0.1'); break;
      case 'vaporwave':   filters.push('aresample=48000,asetrate=48000*0.8'); break;
      case 'earrape':     filters.push('channelsplit,sidechaingate=level_in=64'); break;
      case 'soft':        filters.push('speechnorm=e=6.25:r=0.00001:l=1'); break;
      case 'speed':       filters.push('atempo=1.5'); break;
      case 'tremolo':     filters.push('tremolo=f=5:d=0.5'); break;
      case 'treblebass':  filters.push('firequalizer=gain_entry=\'entry(0,0);entry(200,4);entry(400,0);entry(1000,-4);entry(4000,0);entry(8000,4);entry(20000,4)\''); break;
      case 'vibrato':     filters.push('vibrato=f=6:d=0.5'); break;
      case 'china':       filters.push('aresample=48000,asetrate=48000*1.3,atempo=0.8'); break;
      case 'chipmunk':    filters.push('aresample=48000,asetrate=48000*1.5,atempo=0.7'); break;
      case 'darthvader':  filters.push('aresample=48000,asetrate=48000*0.7,atempo=1.4'); break;
      case 'daycore':     filters.push('aresample=48000,asetrate=48000*0.9,atempo=1.1'); break;
      case 'doubletime':  filters.push('atempo=2.0'); break;
      case 'pitch':       filters.push('aresample=48000,asetrate=48000*1.15'); break;
      case 'radio':       filters.push('afftdn=nf=-25,equalizer=f=3000:width_type=o:width=2:g=2'); break;
      case 'equalizer':   filters.push('equalizer=f=100:width_type=o:width=2:g=4,equalizer=f=1000:width_type=o:width=2:g=-2,equalizer=f=8000:width_type=o:width=2:g=4'); break;
      case 'party':       filters.push('bass=g=10,dynaudnorm=f=150,aecho=0.8:0.9:1000:0.3'); break;
      case 'slow':        filters.push('atempo=0.7'); break;
      case 'electronic':  filters.push('aecho=0.8:0.9:500:0.3,equalizer=f=2000:width_type=o:width=2:g=3'); break;
      case 'pop':         filters.push('equalizer=f=200:width_type=o:width=2:g=3,equalizer=f=3000:width_type=o:width=2:g=2,dynaudnorm=f=100'); break;
    }
  }

  const outputArgs = filters.length > 0 ? ['-af', filters.join(',')] : [];

  return [
    ...baseArgs,
    ...outputArgs,
    '-f', 's16le',
    '-ar', '48000',
    '-ac', '2',
    'pipe:1',
  ];
}

async function getStreamUrl(ytUrl) {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', [
  '--no-playlist',
  '-f', 'bestaudio/best',
  '--cookies', path.join(__dirname, 'cookies.txt'),
      '--js-runtimes', 'node',
  '--get-url',
  ytUrl,
]);
    let out = '', err = '';
    proc.stdout.on('data', d => (out += d));
    proc.stderr.on('data', d => (err += d));
    proc.on('close', code => {
      if (code === 0 && out.trim()) resolve(out.trim().split('\n')[0]);
      else reject(new Error(err || 'yt-dlp falló'));
    });
  });
}

async function playSong(queue, song, seekSeconds = 0) {
  queue.current = song;
  queue.playing = true;

  try {
    console.log(`🎵 Obteniendo URL para: ${song.title}`);
    const streamUrl = song.isFile ? song.url : await getStreamUrl(song.url);
    console.log(` URL obtenida, iniciando ffmpeg...`);

    const ffmpegArgs = buildFFmpegArgs(streamUrl, queue.filter, queue.volume, seekSeconds);
    const ffmpeg = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

    ffmpeg.stderr.on('data', d => {
      const msg = d.toString();
      if (msg.includes('Error') || msg.toLowerCase().includes('error')) {
        console.error('FFMPEG ERROR:', msg);
      }
    });

    ffmpeg.on('close', code => console.log(`ffmpeg terminó con código: ${code}`));

    const resource = createAudioResource(ffmpeg.stdout, {
      inputType: require('@discordjs/voice').StreamType.Raw,
      inlineVolume: false,
    });

    queue.player.play(resource);
    queue.resource = resource;
    queue.playStart = Date.now();
    queue._ffmpegProc = ffmpeg;

    queue.player.once('error', err => console.error('PLAYER ERROR:', err.message));
    console.log(`▶️ Reproduciendo: ${song.title}`);

  } catch (err) {
    console.error('Error al reproducir:', err);
    if (queue.textChannel) {
      queue.textChannel.send(` Error al reproducir **${song.title}**: ${err.message}`);
    }
    advanceQueue(queue);
  }
}

function advanceQueue(queue) {
  if (queue.skipping) return;

  if (queue.loop === 'song' && queue.current) {
    return playSong(queue, queue.current);
  }

  if (queue.current && queue.loop !== 'song') {
    queue.history.push(queue.current);
    if (queue.history.length > 50) queue.history.shift();
  }

  if (queue.loop === 'queue' && queue.current) {
    queue.songs.push(queue.current);
  }

  if (queue.songs.length === 0) {
    queue.current = null;
    queue.playing = false;
    if (queue.textChannel) {
      queue.textChannel.send(' Cola vacía, saliendo del canal de voz.');
    }
    setTimeout(() => {
      try { if (queue.connection) queue.connection.destroy(); } catch (e) {}
      deleteQueue(queue.guildId);
    }, 3000);
    return;
  }

  const next = queue.songs.shift();
  playSong(queue, next);
}

async function joinAndPlay(interaction, song) {
  const guildId = interaction.guildId;
  const voiceChannel = interaction.member.voice.channel;
  const textChannel = interaction.channel;

  let queue = getQueue(guildId);

  if (!queue) {
    queue = createQueue(guildId, voiceChannel, textChannel);

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });

    const player = createAudioPlayer();
    connection.subscribe(player);

    queue.connection = connection;
    queue.player = player;

    player.on(AudioPlayerStatus.Idle, () => advanceQueue(queue));
    player.on('error', err => {
      console.error('Player error:', err);
      advanceQueue(queue);
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        connection.destroy();
        deleteQueue(guildId);
      }
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
    } catch (err) {
      console.error('La conexión de voz nunca llegó a Ready:', err);
      connection.destroy();
      deleteQueue(guildId);
      throw new Error('No se pudo conectar al canal de voz a tiempo.');
    }
  }

  if (!queue.playing) {
    await playSong(queue, song);
    return { queued: false };
  } else {
    queue.songs.push(song);
    return { queued: true, position: queue.songs.length };
  }
}

module.exports = {
  getQueue,
  createQueue,
  deleteQueue,
  joinAndPlay,
  playSong,
  advanceQueue,
};
