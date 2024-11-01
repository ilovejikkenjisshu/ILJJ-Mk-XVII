require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
console.log("Set ready info")
client.on('ready', () => { console.log(`${client.user.tag}でログインしました。`); });
client.login(token);
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log("Set commands")
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) client.commands.set(command.data.name, command);
	else console.log(`${filePath}に必要な"data"か"execute"がありません。`);
}

console.log("Set interactionCreate")
client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	console.log("Command is here!");
	const command = interaction.client.commands.get(interaction.commandName);
	if (!command) {
		console.error(`${interaction.commandName}がみつかりません。`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true });
	}
});
