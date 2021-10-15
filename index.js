const { Client, Collection, Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token } = require('./config.json');

const ytdl = require('ytdl-core');
const fs = require('fs');

const components = new Collection();
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
	if (interaction.isMessageComponent()) {
		const component = components.get(interaction.customId);

		if (!component) return;

		try {
			await component.execute(interaction);
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
	if (command.hasOwnProperty('components'))
	{
		for (const componentIdx in command.components) {
			const component = command.components[componentIdx];
			components.set(component.id, component);
		}
	}
}

client.login(token);