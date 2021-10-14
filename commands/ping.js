const { SlashCommandBuilder } = require('@discordjs/builders');
const { defaultEmbed } = require('../constants');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Returns ping information.'),
	async execute(interaction) {
		await interaction.reply({ embeds: [
			defaultEmbed()
			.setTitle("🏓 Ping-Pong")
			.addFields(
				{ name: 'Latency', value: `${Date.now() - interaction.createdTimestamp} ms`, inline: true },
				{ name: 'API Ping', value: `${Math.round(interaction.client.ws.ping)} ms`, inline: true },
			)
			] });
	},
};