const { SlashCommandBuilder } = require('@discordjs/builders');
const { defaultEmbed } = require('../constants');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { Collection } = require('discord.js');
const { EventEmitter } = require('events');
const fs = require('fs');
const { exit } = require('process');

const activeGames = new Collection();
const prefix = 'sokoban-';

const BlockEnum = {
	AIR: 0,
	PLAYER: 1,
	BOX: 2,
	BOXGOAL: 3,
	WALL: 4,
}

const defaultBlockEnum2Visual = {
	[BlockEnum.AIR]: '⬛',
	[BlockEnum.PLAYER]: '😳',
	[BlockEnum.BOX]: '📦',
	[BlockEnum.BOXGOAL]: '❎',
	[BlockEnum.WALL]: '⬜',
}

function sokobanEmbed() {
	return defaultEmbed().setTitle("📦 Sokoban");
}

function sokobanButtonRows() {
	return [
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
			]
}

function sokobanInteractionContent() {
	return { 
				embeds: [
					sokobanEmbed()
				], 
				components: sokobanButtonRows(),
			};
}

const levels = []

try {
	const levelData = fs.readFileSync('./commands/sokoban-levels.txt', 'utf-8');
	levels.push(levelData);
	// TODO: add parsing for multiple levels
} catch (e) {
	console.error(e);
}

class Vector2 {
	constructor(x, y) {
		if (typeof x !== 'number')
			throw new Error("Vector2.constructor() expected 'x' to be a number.")
		if (typeof y !== 'number')
			throw new Error("Vector2.constructor() expected 'y' to be a number.")
		this.x = x;
		this.y = y;
	}

	add(otherVector) {
		if (!(otherVector instanceof Vector2))
			throw new Error("Vector2.add() expected 'otherVector' to be a Vector2.")
		return new Vector2(this.x + otherVector.x, this.y + otherVector.y);
	}

	multiply(scalar) {
		if (otherVector !== 'number')
			throw new Error("Vector2.multiply() expected 'scalar' to be a number.")
		return new Vector2(this.x * scalar, this.y * scalar);
	}

	get magnitude() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	normalize() {
		const magnitude = this.magnitude;
		return new Vector2(this.x / magnitude, this.y / magnitude);
	}

	equals(otherVector) {
		if (!(otherVector instanceof Vector2))
			throw new Error("Vector2.equals() expected 'otherVector' to be a Vector2.")
		return otherVector.x == this.x && otherVector.y == this.y;
	}

	// Checks if the vector is inside some bounds
	isInsideBounds(corner, oppositeCorner) {
		const largest = new Vector2(Math.max(corner.x, oppositeCorner.x), Math.max(corner.y, oppositeCorner.y));
		const smallest = new Vector2(Math.min(corner.x, oppositeCorner.x), Math.min(corner.y, oppositeCorner.y));
		
		return this.x >= smallest.x &&
			this.y >= smallest.y &&
			this.x <= largest.x &&
			this.x <= largest.y;
	}

	toString() {
		return `(${this.x}, ${this.y})`;
	}

	static get zero() {
		return new Vector2(0, 0);
	}

	static get up() {
		return new Vector2(0, 1);
	}

	static get down() {
		return new Vector2(0, -1);
	}

	static get right() {
		return new Vector2(1, 0);
	}

	static get left() {
		return new Vector2(-1, 0);
	}
}

class SimulationGrid {
	constructor() {
		this.grid = [];
	}
	
	get size() {
		return new Vector2(this.grid[0].length, this.grid.length);
	}

	set(x, y, value) {
		if (x instanceof Vector2) {
			// set(position, value)
			value = y;
			y = x.y;
			x = x.x;
		}
		this.grid[y][x] = value;
	}

	get(x, y) {
		if (x instanceof Vector2) {
			// get(position)
			y = x.y;
			x = x.x;
		}
		return this.grid[y][x];
	}
	
	// Allows for deep cloning and conversions.
	clone(filterPredicate) {
		if (typeof filterPredicate === 'undefined')
			filterPredicate = (value) => value;
		const simulationGrid = new SimulationGrid();
		simulationGrid.grid = [];

		for (let y = 0; y < this.grid.length; y++) {
			const row = [];
			simulationGrid.grid.push(row);
			for (let x = 0; x < this.grid[0].length; x++)
				row.push(filterPredicate(this.grid[y][x]));
		}

		return simulationGrid;
	}

	move(originalPos, finalPos) {
		const originalBlock = this.get(originalPos);
		this.set(originalPos, BlockEnum.AIR);
		this.set(finalPos, originalBlock);
	}

	// Takes in an array of move steps and runs each move step.
	moveSteps(steps) {
		for (const idx in steps)
			this.move(steps[idx].from, steps[idx].to);
	}
	
	tryPushGetMoveSteps(position, direction, steps) {
		const futurePos = position.add(direction);
		if (!this.bounds(position) || !this.bounds(futurePos) || this.get(position) !== BlockEnum.BOX)
			return false;
		const block = this.get(futurePos);
		switch (block) {
			case BlockEnum.WALL:
				return false;
			case BlockEnum.AIR:
				steps.push({
					from: position,
					to: futurePos,
				});
				return true;
			case BlockEnum.BOX:
				return this.pushGetSteps(position, direction, steps);	
			// TODO: Add sticky boxes	
		}
	}

	bounds(position) {
		return position.isInsideBounds(Vector2.zero, this.size.add(new Vector2(-1, -1)));
	}

	toString() {
		let str = '';
		for (let y = 0; y < this.grid.length; y++) {
			for (let x = 0; x < this.grid[0].length; x++) {
				str += this.get(x, y);
			}
			str += '\n';
		}
		return str;
	}
}

class SokobanBoard {
	constructor () {
		this.frontGrid = new SimulationGrid();
		this.backGrid = new SimulationGrid();
		this.boxGoals = [];
		this.players = [];
		this.eventEmitter = new EventEmitter();
		this.stopAfterWin = true;
		this.won = false;
		
		// Events	Args
		// 'win'	none
	}

	get size() {
		return this.frontGrid.size;
	}

	generateVisuals(blockEnum2Visual) {
		if (typeof blockEnum2Visual === 'undefined')
			blockEnum2Visual = defaultBlockEnum2Visual
		let str = '';
		for (let y = 0; y < this.frontGrid.size.y; y++)
		{
			for (let x = 0; x < this.frontGrid.size.x; x++) {
				const frontBlock = this.frontGrid.get(new Vector2(x, y));
				const backBlock = this.backGrid.get(new Vector2(x, y));
				str += (frontBlock !== BlockEnum.AIR) ? blockEnum2Visual[frontBlock] : blockEnum2Visual[backBlock];
			}
			if (y < this.frontGrid.size.y - 1)
				str += '\n';
		}
		return str;
	}

	movePlayer(playerId, direction) {
		console.log('moving');
		if (this.stopAfterWin && this.won)
			return;
		if (playerId >= this.players.length) 
			return;
		
		const player = this.players[playerId];
		const futurePos = player.position.add(direction);

		if (!this.frontGrid.bounds(futurePos))
			return;
		
		const block = this.getFrontBlock(futurePos);

		switch (block) {
			case BlockEnum.AIR:
				break;
			case BlockEnum.WALL:
				return;
			case BlockEnum.BOX:
				const actions = [];
				const moveSteps = []
				if (this.frontGrid.clone().tryPushGetMoveSteps(futurePos, direction, moveSteps)) {
					this.frontGrid.moveSteps(moveSteps);
				}
				break;
		}

		this.frontGrid.move(player.position, futurePos);
		player.position = futurePos;

		if (this.verifyWin()) {
			this.won = true;
			this.eventEmitter.emit('win');
		}
	}

	verifyWin() {
		for (const idx in this.boxGoals) {
			const boxGoal = this.boxGoals[idx];
			if (boxGoal.type == BlockEnum.BOXGOAL && this.frontGrid.get(boxGoal.position) !== BlockEnum.BOX)
				return false;
		}
		return true;
	}

	getFrontBlock(position) {
		return this.frontGrid.get(position);
	}

	getBackBlock(position) {
		return this.backGrid.get(position);
	}

	// NOTE: Emoji parsing current doesn't work,
	//		 since the flushed emoji cannot be parsed in utf-8.
	static fromText(boardText) {
		if (!(typeof(boardText) === 'string'))
			throw new Error("Vector2.multiply() expected 'scalar' to be a number.")
		
		const board = new SokobanBoard();

		let frontRow = [];
		let backRow = [];
		board.frontGrid.grid.push(frontRow);
		board.backGrid.grid.push(backRow);

		let i = 0;
		let x = 0;
		let y = 0;
		while (i < boardText.length) {			
			switch (boardText.charAt(i)) {
				case '\n':
					frontRow = [];
					backRow = [];
					board.frontGrid.grid.push(frontRow);
					board.backGrid.grid.push(backRow);
					y++;
					x = -1;
					break
				case '_':
				case '⬛':
					frontRow.push(BlockEnum.AIR);
					backRow.push(BlockEnum.AIR);
					break;
				case 'P':
				case '😳':
					console.log('adding player to pos: ' + new Vector2(x, y));
					board.players.push({
						id: board.players.length,
						position: new Vector2(x, y),
					});
					frontRow.push(BlockEnum.PLAYER);
					backRow.push(BlockEnum.AIR);
					break;
				case 'B':
				case '📦':
					frontRow.push(BlockEnum.BOX);
					backRow.push(BlockEnum.AIR);
					break;
				case 'G':
				case '❎':
					frontRow.push(BlockEnum.AIR);
					backRow.push(BlockEnum.BOXGOAL);
					board.boxGoals.push({
						type: BlockEnum.BOXGOAL,
						position: new Vector2(x, y),
					});
					break;
				case 'W':
				case '⬜':
					frontRow.push(BlockEnum.WALL);
					backRow.push(BlockEnum.AIR);
					break;
			}
			x++;
			i++;
		}
		return board;
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sokoban')
		.setDescription('Play a game of sokoban.'),
	buttons: [
		{
			id: prefix + 'left',
			get data() {
				return new MessageButton()
					.setCustomId(this.id)
					.setLabel('◀️')
					.setStyle('SECONDARY')
			},
			async execute(interaction) {
				activeGames.get(interaction.user.id).sokobanBoard.movePlayer(0, Vector2.left);
				await activeGames.get(interaction.user.id).updateVisuals(interaction);
			}
		},
		{
			id: prefix + 'up',
			get data() {
				return new MessageButton()
					.setCustomId(this.id)
					.setLabel('🔼')
					.setStyle('SECONDARY')
			},
			async execute(interaction) {
				// We use down to represent up since the array is constructed top to bottom
				activeGames.get(interaction.user.id).sokobanBoard.movePlayer(0, Vector2.down);
				await activeGames.get(interaction.user.id).updateVisuals(interaction);
			},
		}, 
		{
			id: prefix + 'down',
			get data() {
				return new MessageButton()
					.setCustomId(this.id)
					.setLabel('🔽')
					.setStyle('SECONDARY')
			},
			async execute(interaction) {
				// We use up to represent down since the array is constructed top to bottom
				activeGames.get(interaction.user.id).sokobanBoard.movePlayer(0, Vector2.up);
				await activeGames.get(interaction.user.id).updateVisuals(interaction);
			}
		}, 
		{ 
			id: prefix + 'right',
			get data() {
				return new MessageButton()
					.setCustomId(this.id)
					.setLabel('▶️')
					.setStyle('SECONDARY')
			},
			async execute(interaction) {
				activeGames.get(interaction.user.id).sokobanBoard.movePlayer(0, Vector2.right);
				await activeGames.get(interaction.user.id).updateVisuals(interaction);
			}
		},
		{
			id: prefix + 'restart',
			get data() {
				return new MessageButton()
					.setCustomId(this.id)
					.setLabel('🔁')
					.setStyle('PRIMARY')
			},
			async execute(interaction) {
				const activeGame = activeGames.get(interaction.user.id);
				activeGame.sokobanBoard = SokobanBoard.fromText(levels[0]);
				activeGame.sokobanBoard.eventEmitter.addListener('win', activeGame.onWin.bind(activeGame))
				await activeGame.updateVisuals(interaction);
			}
		},
		{
			id: prefix + 'quit',
			get data() {
				return new MessageButton()
					.setCustomId(this.id)
					.setLabel('🛑')
					.setStyle('DANGER')
			},
			async execute(interaction) {
				await activeGames.get(interaction.user.id).exit();
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
		
		// Setup a new active game for the player
		const newActiveGame = {
			userId: interaction.user.id,
			message: null,
			sokobanBoard: SokobanBoard.fromText(levels[0]),
			async updateVisuals(visualInteraction) {
				if (activeGames.get(interaction.user.id).sokobanBoard.won)
					// Don't update the visuals if we won
					return;
				
				if (typeof visualInteraction !== 'undefined')
					await visualInteraction.update({ 
							embeds: [sokobanEmbed()
								.setDescription(this.sokobanBoard.generateVisuals()) ],
							components: sokobanButtonRows(),
							});
				else
					await this.message.edit({ embeds: [sokobanEmbed()
						.setDescription(this.sokobanBoard.generateVisuals())]
						});
			},
			async onWin() {
				this.message.edit({ embeds: [sokobanEmbed()
					.setDescription(this.sokobanBoard.generateVisuals() + "\n\n🎊 **You won!** 🎊")
				]});
				await setTimeout(() => this.exit(), 3000);
			},
			async exit() {
				await this.message.delete();
				activeGames.delete(this.userId);
			}
		}
		newActiveGame.sokobanBoard.eventEmitter.addListener('win', newActiveGame.onWin.bind(newActiveGame))
		
		activeGames.set(interaction.user.id, newActiveGame);
		const content = sokobanInteractionContent()
		content.fetchReply = true;
		await interaction.reply(content)
			.then(msg => { 
				newActiveGame.message = msg;
				newActiveGame.updateVisuals();
			})
			.catch(console.error);
	},
};