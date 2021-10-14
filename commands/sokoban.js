const { SlashCommandBuilder } = require('@discordjs/builders');
const { defaultEmbed } = require('../constants');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { Collection } = require('discord.js');

const activeGames = new Collection();
const prefix = 'sokoban-';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sokoban')
		.setDescription('Play a game of sokoban.'),
	buttons: [
		{
			oof: 0,
			id: prefix + 'left',
			get data() {
				return new MessageButton()
					.setCustomId(this.id)
					.setLabel('◀️')
					.setStyle('SECONDARY')
			},
			async execute(interaction) {
				
			}
		},
		{
			oof: 0,
			id: prefix + 'up',
			get data() {
				return new MessageButton()
					.setCustomId(this.id)
					.setLabel('🔼')
					.setStyle('SECONDARY')
			},
			async execute(interaction) {
				
			},
		}, 
		{
			oof: 0,
			id: prefix + 'down',
			get data() {
				return new MessageButton()
					.setCustomId(this.id)
					.setLabel('🔽')
					.setStyle('SECONDARY')
			},
			async execute(interaction) {
				
			}
		}, 
		{ 
			oof: 0,
			id: prefix + 'right',
			get data() {
				return new MessageButton()
					.setCustomId(this.id)
					.setLabel('▶️')
					.setStyle('SECONDARY')
			},
			async execute(interaction) {
				
			}
		},
		{
			oof: 0,
			id: prefix + 'restart',
			get data() {
				return new MessageButton()
					.setCustomId(this.id)
					.setLabel('🔁')
					.setStyle('PRIMARY')
			},
			async execute(interaction) {
				
			}
		},
		{
			oof: 0,
			id: prefix + 'quit',
			get data() {
				return new MessageButton()
					.setCustomId(this.id)
					.setLabel('🛑')
					.setStyle('DANGER')
			},
			async execute(interaction) {
				activeGames.get(interaction.user.id).message.delete();
				activeGames.delete(interaction.user.id);
			}
		}],
	async execute(interaction) {
		const activeGame = activeGames.get(interaction.user.id);
		if (activeGame) {
			if (activeGame.message != null)
				await interaction.reply({
						content: `A sokoban game for you is already running [here](${activeGame.message.url})!`,
						ephemeral: true	
					});
			else
				await interaction.reply({
						content: `A sokoban game for you is already starting up!`,
						ephemeral: true	
					});
			return;
		}
		
		const newActiveGame = {
			userId: interaction.user.id,
			message: null,
		}
		activeGames.set(interaction.user.id, newActiveGame);
		await interaction.reply({ 
				embeds: [
					defaultEmbed()
					.setTitle("🟫 Sokoban")
					.setDescription("🟫🟫🟫\n🟫🟫🟫\n🟫🟫🟫")
				], 
				components: [
					new MessageActionRow()
						.addComponents(
							module.exports.buttons[0].data,
							module.exports.buttons[1].data,
							module.exports.buttons[2].data,
							module.exports.buttons[3].data,
							),
					new MessageActionRow()
						.addComponents(
							module.exports.buttons[4].data,
							module.exports.buttons[5].data,
							)
				],
				fetchReply: true
			})
			.then(msg => { newActiveGame.message = msg; })
			.catch(console.error);
	},
};