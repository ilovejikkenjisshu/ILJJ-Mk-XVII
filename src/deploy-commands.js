const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('node:fs');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

console.log("START : load commands")
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	console.log(`JSON: ${command.data.toJSON()}`);
	commands.push(command.data.toJSON());
}
console.log("FINISH: load commands");

const rest = new REST({ version: '10' }).setToken(token);

async function deploy() {
	try {
		console.log(`Regist ${commands.length} counts application command.`);
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);
		console.log('Regitration completed.');
	} catch (err) {
		console.error(err);
	}
}

(async () => {
	await deploy();
})();
