const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const { getQueue } = require('../musicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Hace que el bot entre al canal de voz sin reproducir nada'),

  async execute(interaction) {
    if (!interaction.member.voice.channel) {
      return interaction.reply({ content: '❌ Debes estar en un canal de voz.', ephemeral: true });
    }

    const queue = getQueue(interaction.guildId);
    if (queue && queue.connection) {
      return interaction.reply({ content: '❌ El bot ya está en un canal de voz.', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const connection = joinVoiceChannel({
        channelId: interaction.member.voice.channel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 15_000);

      return interaction.editReply(`✅ Me uní a **${interaction.member.voice.channel.name}**.`);
    } catch (err) {
      console.error(err);
      return interaction.editReply('❌ No se pudo conectar al canal de voz.');
    }
  },
};