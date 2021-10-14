const { Client, Collection, Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token } = require('./config.json');

const ytdl = require('ytdl-core');
const fs = require('fs');

const buttons = new Collection();
const client = new Client({ 
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] 
});

// Setup event listeners
client.once('ready', () => {
	console.log('🟢 Ready');
});

client.once('reconnecting', () => {
	console.log('🟠 Reconnecting');
});

client.once('disconnect', () => {
	console.log('🔴 Disconnected');
});

client.on('interactionCreate', async interaction => {
	if (interaction.isButton()) {
		const button = buttons.get(interaction.customId);

		if (!button) return;

		try {
			await button.execute(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this button interaction!', ephemeral: true });
		}
	} else if (interaction.isCommand()) {
		const command = client.commands.get(interaction.commandName);

		if (!command) return;

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// Setup commands
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
	if (command.hasOwnProperty('buttons'))
	{
		for (const buttonIdx in command.buttons) {
			const button = command.buttons[buttonIdx];
			buttons.set(button.id, button);
		}
	}
}

client.login(token);