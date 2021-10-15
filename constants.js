const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

module.exports = {
	defaultEmbed(type) {
		const embed = new MessageEmbed()
			.setColor('#742f67')
			.setTimestamp()
			.setFooter('Alinyx', 'https://cdn.discordapp.com/app-icons/426554007977197579/3fd22dff0bf6f9b65dfe945cc25ee24b.png');
		if (typeof type === 'string') {
			switch (type.toUpperCase()) {
				case 'ATTENTION':
					embed.setTitle('‼️ Attention')
					break;
			}
		}
		return embed;
	}
}