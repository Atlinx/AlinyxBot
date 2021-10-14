const { SlashCommandBuilder } = require('@discordjs/builders');
const { defaultEmbed } = require('../constants');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Server info.'),
	async execute(interaction) {
		await interaction.reply({ embeds: [
			defaultEmbed()
			.setTitle("📃 Server Info")
			.addFields(
				{ name: "Server", value: `${interaction.guild.name}`, inline: true },
				{ name: "Members", value: `${interaction.guild.memberCount}`, inline: true }
			)
			] });
	},
};