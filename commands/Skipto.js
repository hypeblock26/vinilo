const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue, playSong } = require('../musicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skipto')
    .setDescription('Salta a una posición específica de la cola')
    .addIntegerOption(opt =>
      opt.setName('posicion')
        .setDescription('Posición a la que quieres saltar (2 = primera en cola)')
        .setRequired(true)
        .setMinValue(2)
    ),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: ' No hay canciones en la cola.', ephemeral: true });
    }

    const pos = interaction.options.getInteger('posicion');
    const queueIndex = pos - 2; 

    if (queueIndex >= queue.songs.length) {
      return interaction.reply({ content: ` Posición inválida. Hay **${queue.songs.length}** canción(es) en cola (posiciones 2-${queue.songs.length + 1}).`, ephemeral: true });
    }

    await interaction.deferReply();

    
    queue.songs.splice(0, queueIndex);

    queue.loop = queue.loop === 'song' ? 'none' : queue.loop;
    queue.skipping = true;
    queue.player.stop(true);
    await new Promise(res => setTimeout(res, 500));
    queue.skipping = false;

    const next = queue.songs.shift();
    if (!next) return interaction.editReply('❌ No hay canción en esa posición.');

    await playSong(queue, next);
    await new Promise(res => setTimeout(res, 1500));

    const current = queue.current;
    if (!current) return interaction.editReply(' Saltando a la posición indicada...');

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle(' Sonando ahora')
      .setDescription(`**[${current.title}](${current.url})**`)
      .addFields(
        { name: 'Duración', value: current.duration, inline: true },
        { name: 'Solicitado por', value: current.requestedBy, inline: true },
      )
      .setImage(current.thumbnail);

    return interaction.editReply({ embeds: [embed] });
  },
};