const { SlashCommandBuilder } = require('discord.js');
const { getQueue, playSong, advanceQueue } = require('../musicQueue');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filter')
    .setDescription('Aplica un filtro de audio a la canción actual')
    .addStringOption(opt =>
      opt.setName('tipo')
        .setDescription('Filtro a aplicar')
        .setRequired(true)
        .addChoices(
          { name: '🎵 8D', value: '8d' },
          { name: '🎸 Bass Boost', value: 'bassboost' },
          { name: '🌙 Nightcore', value: 'nightcore' },
          { name: '🎤 Karaoke', value: 'karaoke' },
          { name: '🌊 Vaporwave', value: 'vaporwave' },
          { name: '💥 Earrape', value: 'earrape' },
          { name: '🌸 Soft', value: 'soft' },
          { name: '⚡ Speed', value: 'speed' },
          { name: '🎡 Tremolo', value: 'tremolo' },
          { name: '🔊 Treblebass', value: 'treblebass' },
          { name: '🎻 Vibrato', value: 'vibrato' },
          { name: '🀄 China', value: 'china' },
          { name: '🤖 Chipmunk', value: 'chipmunk' },
          { name: '🌑 Darthvader', value: 'darthvader' },
          { name: '☀️ Daycore', value: 'daycore' },
          { name: '⏩ Doubletime', value: 'doubletime' },
          { name: '🎼 Pitch', value: 'pitch' },
          { name: '📻 Radio', value: 'radio' },
          { name: '🎛️ Equalizer', value: 'equalizer' },
          { name: '🎉 Party', value: 'party' },
          { name: '🐌 Slow', value: 'slow' },
          { name: '🎙️ Electronic', value: 'electronic' },
          { name: '🎶 Pop', value: 'pop' },
          { name: '❌ Reset (sin filtro)', value: 'reset' },
        )
    ),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || !queue.current) {
      return interaction.reply({ content: '❌ No hay ninguna canción reproduciéndose.', ephemeral: true });
    }

    await interaction.deferReply();

    const tipo = interaction.options.getString('tipo');
    queue.filter = tipo === 'reset' ? null : tipo;

    const currentSong = queue.current;

    // Calcular cuántos segundos han pasado
    const elapsed = queue.resource
      ? Math.floor(queue.resource.playbackDuration / 1000)
      : 0;

    // Remover listener de Idle temporalmente
    queue.player.removeAllListeners(AudioPlayerStatus.Idle);

    try { if (queue._ffmpegProc) queue._ffmpegProc.kill('SIGKILL'); } catch (e) {}
    queue.player.stop(true);
    await new Promise(res => setTimeout(res, 200));

    // Restaurar listener de Idle
    queue.player.on(AudioPlayerStatus.Idle, () => advanceQueue(queue));

    queue.playing = true;
    await playSong(queue, currentSong, elapsed);

    const nombres = {
      '8d': '🎵 8D', bassboost: '🎸 Bass Boost', nightcore: '🌙 Nightcore',
      karaoke: '🎤 Karaoke', vaporwave: '🌊 Vaporwave', earrape: '💥 Earrape',
      soft: '🌸 Soft', speed: '⚡ Speed', tremolo: '🎡 Tremolo',
      treblebass: '🔊 Treblebass', vibrato: '🎻 Vibrato', china: '🀄 China',
      chipmunk: '🤖 Chipmunk', darthvader: '🌑 Darthvader', daycore: '☀️ Daycore',
      doubletime: '⏩ Doubletime', pitch: '🎼 Pitch', radio: '📻 Radio',
      equalizer: '🎛️ Equalizer', party: '🎉 Party', slow: '🐌 Slow',
      electronic: '🎙️ Electronic', pop: '🎶 Pop', reset: '❌ Sin filtro',
    };

    return interaction.editReply(`✅ Filtro **${nombres[tipo]}** aplicado.`);

  },
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}