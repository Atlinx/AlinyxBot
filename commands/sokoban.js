const { SlashCommandBuilder } = require('@discordjs/builders');
const { defaultEmbed } = require('../constants');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sokoban')
		.setDescription('Play a game of sokoban.'),
	async execute(interaction) {
		await interaction.reply({ 
			embeds: [
				defaultEmbed()
				.setTitle("🟫 Sokoban")
				.setDescription("🟫🟫🟫\n🟫🟫🟫\n🟫🟫🟫")
			], 
			components: [
				new MessageActionRow()
					.addComponents(
						new MessageButton()
							.setCustomId('up')
							.setLabel('🔼')
							.setStyle('SECONDARY'),
						new MessageButton()
							.setCustomId('down')
							.setLabel('🔽')
							.setStyle('SECONDARY'),
						new MessageButton()
							.setCustomId('right')
							.setLabel('▶️')
							.setStyle('SECONDARY'),
						new MessageButton()
							.setCustomId('left')
							.setLabel('◀️')
							.setStyle('SECONDARY'),
						)
			]
			});
	},
};