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