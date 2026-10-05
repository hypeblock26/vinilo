const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../musicQueue');
const https = require('https');

async function getLyrics(title) {
  const query = encodeURIComponent(title);
  
  return new Promise((resolve, reject) => {
    
    const parts = title.split(' - ');
    let artist, song;
    
    if (parts.length >= 2) {
      artist = encodeURIComponent(parts[0].trim());
      song = encodeURIComponent(parts.slice(1).join(' - ').trim());
    } else {
      artist = encodeURIComponent('unknown');
      song = query;
    }

    const url = `https://api.lyrics.ovh/v1/${artist}/${song}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.lyrics) resolve(json.lyrics);
          else reject(new Error('No se encontraron letras'));
        } catch (e) {
          reject(new Error('Error al parsear respuesta'));
        }
      });
    }).on('error', reject);
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('Muestra la letra de la canción actual o de una canción específica')
    .addStringOption(opt =>
      opt.setName('cancion')
        .setDescription('Nombre de la canción (opcional, usa la actual si no se especifica)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const queue = getQueue(interaction.guildId);
    const query = interaction.options.getString('cancion');

    let searchTitle;
    if (query) {
      searchTitle = query;
    } else if (queue && queue.current) {
      searchTitle = queue.current.title;
    } else {
      return interaction.editReply('❌ No hay ninguna canción reproduciéndose y no especificaste ninguna.');
    }

    try {
      const lyrics = await getLyrics(searchTitle);
      const maxLength = 3900;
      const lyricsText = lyrics.length > maxLength 
        ? lyrics.substring(0, maxLength) + '\n\n`... (letra recortada por límite de Discord)`'
        : lyrics;

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`📝 ${searchTitle}`)
        .setDescription(lyricsText)
        .setFooter({ text: 'Letra provista por lyrics.ovh' });

      return interaction.editReply({ embeds: [embed] });

    } catch (err) {
      return interaction.editReply(`❌ No se encontró la letra de **${searchTitle}**. Intenta con "Artista - Canción".`);
    }
  },
};