require('dotenv').config();

const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');
const { google } = require("googleapis");
// const { GoogleAuth } = require('google-auth-library');
const { Storage } = require('@google-cloud/storage');

const compute = google.compute("v1");
const storage = new Storage();
const auth = new google.auth.GoogleAuth({scopes: 'https://www.googleapis.com/auth/cloud-platform'});

console.log("AUTH:: ", auth);

const { BUCKET_NAME, PROJECT_ID, CLIENT_PUBLIC_KEY } = process.env;
console.log("BUCKET_NAME:: ", BUCKET_NAME);

//const gameOption = option => option.setName('game').setRequired(true)
// .addChoices(await ...getChoices()); // 現時点では実現不可

module.exports = {
	data: new SlashCommandBuilder()
	.setName('gssc')
	.setDescription('ILJJ Game Server Commands')
	.addSubcommand(subcommand =>
		subcommand.setName('list')
		.setDescription('登録済みのゲームリスト一覧'))
	.addSubcommand(subcommand =>
		subcommand.setName('list-update')
		.setDescription('登録済みのゲームリストを更新'))
	.addSubcommand(subcommand =>
		subcommand.setName('start')
		.setDescription('ゲームサーバーを起動')
		.addStringOption(option => option.setName('game').setDescription('Game name').setRequired(true)))
	.addSubcommand(subcommand =>
		subcommand.setName('restart')
		.setDescription('ゲームサーバーを再起動')
		.addStringOption(option => option.setName('game').setDescription('Game name').setRequired(true)))
	.addSubcommand(subcommand =>
		subcommand.setName('status')
		.setDescription('ゲームサーバーの状態を表示')
		.addStringOption(option => option.setName('game').setDescription('Game name').setRequired(true)))
	.addSubcommand(subcommand =>
		subcommand.setName('stop')
		.setDescription('ゲームサーバーを停止')
		.addStringOption(option => option.setName('game').setDescription('Game name').setRequired(true))),
	async execute(interaction) {
		try {
			const resp = await gsscCommand(
				interaction.options.getSubcommand(),
				interaction.options.getString("game", false)
			);
			await interaction.reply(resp);
		} catch (error) {
			console.error(error);
			await interaction.reply({content: "INTERNAL SERVER ERROR", ephemeral: true});
		}
	},
};


// ゲームサーバーの設定ファイルを取得
const readGameServersJson = async () => {
	const bucketName = BUCKET_NAME;
	const fileName = "game_servers.json";
	try {
		const [file] = await storage.bucket(bucketName).file(fileName).download();
		return JSON.parse(file.toString('utf8'));
	} catch (err) {
		console.error('Error reading game_servers.json:', err.message);
		throw err;
	}
}

const gsscCommand = async (command, game) => {
	console.log(`COMMAND: ${command}`)
	switch (command) {
		case "list":
			return { content: await listupServer(), ephemeral: true };
		case "list-update":
			return { content: "# 現時点では未実装です。\n" + await listupServer(), ephemeral: true };
		default:
			if (game == null) return "Game fields is required!";
			const gameServers = await readGameServersJson();
			const gameServer = gameServers[game];
			if (!gameServer) return `### ${game} not found!`;
			switch(command) {
				case "start":
					return await startGameServer(gameServer);
				case "stop":
					return await stopGameServer(gameServer);
				case "restart":
					return await restartGameServer(gameServer);
				case "status":
					return await statusGameServer(gameServer);
				default:
					return `Unknown command: ${command}`;
			}
	}
}

const getInstanceConfig = (instance_name, zone) => {
	return {
		auth: auth,
		project: PROJECT_ID,
		zone: zone,
		instance: instance_name,
	};
};

const listupServer = async () => {
	try {
		const gameServers = await readGameServersJson();
		const gameServerNames = Object.keys(gameServers);
		return "## list of game\n - " + gameServerNames.join("\n - ");
	} catch (error) {
		console.error("ERROR ON LISTUP SERVER")
		console.error(error);
		return "Error on Server."
	}
}

const getChoices = async () => {
	const gameServers = await ReadGameServersJson();
	const gameServerNames = Object.keys(gameServers);
	let choices = []
	for (const [key, val] of Object.entries(gameServers)) {
		choices.push({name: val.name, value: key})
	}
	return choices;
}

const startGameServer = async (gameServer) => {
	const { instance_name, name, zone } = gameServer;
	try {
		await compute.instances.start(getInstanceConfig(instance_name, zone));
		return `Start ${name} server`;
	} catch (err) {
		console.error("ERROR:", err);
		return `Failed to start ${name} server`;
	}
};

const stopGameServer = async (gameServer) => {
	const { instance_name, name, zone } = gameServer;
	try {
		await compute.instances.stop(getInstanceConfig(instance_name, zone));
		return `Stop ${name} server`;
	} catch (err) {
		console.error("ERROR:", err);
		return `Failed to stop ${name} server`;
	}
};

const restartGameServer = async (gameServer) => {
	const { instance_name, name, zone } = gameServer;
	try {
		const instance_config = getInstanceConfig(instance_name, zone);
		await compute.instances.stop(instance_config);
		await compute.instances.start(instance_config);
		return `Restart ${name} server`;
	} catch (err) {
		console.error("ERROR:", err);
		return `Failed to restart ${name} server`;
	}
};

const statusGameServer = async (gameServer) => {
	const { instance_name, name, zone } = gameServer;
	try {
		const response = await compute.instances.get(getInstanceConfig(instance_name, zone));
		return `${name}: ${response.data.status}`;
	} catch (err) {
		console.error("ERROR:", err);
		return `Failed to get status on ${name} server`;
	}
};
