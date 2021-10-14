const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

module.exports = {
	defaultEmbed() {
		return new MessageEmbed()
			.setColor('#742f67')
			.setTimestamp()
			.setFooter('Alinyx', 'https://cdn.discordapp.com/app-icons/426554007977197579/3fd22dff0bf6f9b65dfe945cc25ee24b.png');
	}
}