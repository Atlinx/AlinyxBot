# Alinyx Bot

Alinyx is a general purpose discord bot. Right now it mostly serves as a playground for me to experiment with discord.js.

## Setup

1. Clone the repository
2. Install required packages using
```bash
> npm install
```
3. Create a `config.json` file inside the cloned repository folder. It should contain,
```json
{
	"clientId": "...",
	"guildId": "...",
	"token": "...",
}
```

  - `clientId` is the application ID of the bot found on your Discord developer dashboard.
  - `guildID` is the ID of the guild used for adding slash commands to.
  - `token` is your bot token found on your Discord developer dashboard.

## Usage

You can host the bot by running `host-bot.sh` or by running
```bash
> node index.js
```

You can add the slash commands by running `deploy-commands.sh` or by running
```bash
> node deploy-commands.js
```