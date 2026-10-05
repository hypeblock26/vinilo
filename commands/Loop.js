const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../musicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Cambia el modo de repetición')
    .addStringOption(opt =>
      opt.setName('modo')
        .setDescription('Modo de loop')
        .setRequired(true)
        .addChoices(
          { name: '🔂 Canción actual', value: 'song' },
          { name: '🔁 Toda la cola', value: 'queue' },
          { name: '➡️ Sin loop', value: 'none' },
        )
    ),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || !queue.playing) {
      return interaction.reply({ content: '❌ No hay música reproduciéndose.', ephemeral: true });
    }

    const modo = interaction.options.getString('modo');
    queue.loop = modo;

    const icons = { song: '🔂 Canción actual', queue: '🔁 Toda la cola', none: '➡️ Sin loop' };
    return interaction.reply(`${icons[modo]} — Modo de loop actualizado.`);
  },
};