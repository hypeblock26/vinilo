const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Muestra la latencia del bot'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: ' Calculando...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);
    return interaction.editReply(`\n Latencia: \`${latency}ms\`\n API: \`${apiLatency}ms\``);
  },
};