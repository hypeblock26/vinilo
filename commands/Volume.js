const { SlashCommandBuilder } = require('discord.js');
const { getQueue, playSong } = require('../musicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Ajusta el volumen del bot')
    .addIntegerOption(opt =>
      opt.setName('nivel')
        .setDescription('Volumen del 1 al 200')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(200)
    ),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || !queue.playing) {
      return interaction.reply({ content: '❌ No hay música reproduciéndose.', ephemeral: true });
    }

    const nivel = interaction.options.getInteger('nivel');
    queue.volume = nivel / 100;
    if (queue.current) {
      if (queue._ffmpegProc) queue._ffmpegProc.kill('SIGKILL');
      await playSong(queue, queue.current);
    }

    return interaction.reply(`🔊 Volumen ajustado a **${nivel}%**.`);
  },
};