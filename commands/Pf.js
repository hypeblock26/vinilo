const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinAndPlay } = require('../musicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pf')
    .setDescription('Reproduce un archivo de audio o video subido en Discord')
    .addAttachmentOption(opt =>
      opt.setName('archivo')
        .setDescription('Archivo de audio o video (mp3, mp4, wav, ogg, flac, etc)')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    if (!interaction.member.voice.channel) {
      return interaction.editReply('❌ Debes estar en un canal de voz.');
    }

    const attachment = interaction.options.getAttachment('archivo');
    const validTypes = ['audio/', 'video/'];
    const isValid = validTypes.some(type => attachment.contentType?.startsWith(type));

    if (!isValid) {
      return interaction.editReply('❌ El archivo debe ser de audio o video (mp3, mp4, wav, ogg, flac, etc).');
    }

    const song = {
      title: attachment.name || 'Archivo de audio',
      url: attachment.url,
      duration: '??:??',
      thumbnail: null,
      requestedBy: interaction.user.username,
      isFile: true,
    };

    const { queued, position } = await joinAndPlay(interaction, song);

    if (queued) {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('➕ Archivo añadido a la cola')
        .setDescription(`**${song.title}**`)
        .addFields(
          { name: 'Posición', value: `#${position + 1}`, inline: true },
          { name: 'Solicitado por', value: song.requestedBy, inline: true }
        );
      return interaction.editReply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('▶️ Reproduciendo archivo')
        .setDescription(`**${song.title}**`)
        .addFields(
          { name: 'Solicitado por', value: song.requestedBy, inline: true }
        );
      return interaction.editReply({ embeds: [embed] });
    }
  },
};