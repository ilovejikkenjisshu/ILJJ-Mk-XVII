const { google } = require("googleapis");
const { Storage } = require('@google-cloud/storage');
const {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} = require("discord-interactions");
const functions = require("@google-cloud/functions-framework");

const compute = google.compute("v1");
const storage = new Storage();
const auth = new google.auth.GoogleAuth();

// 環境変数からトークンを取得
const { BUCKET_NAME, PROJECT_ID, CLIENT_PUBLIC_KEY } = process.env;

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

const gsscCommand = async (game, command) => {
  const gameServers = await readGameServersJson();
  const gameServer = gameServers[game];
  if (!gameServer) return "Game not found";

  switch (command) {
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

const getInstanceConfig = (instance_name, zone) => {
  return {
    auth: auth,
    project: PROJECT_ID,
    zone: zone,
    instance: instance_name,
  };
};

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

const discordRequest = async (req, res) => {
  // Verify the request
  const signature = req.get("X-Signature-Ed25519");
  const timestamp = req.get("X-Signature-Timestamp");
  const isValidRequest = await verifyKey(
    req.rawBody,
    signature,
    timestamp,
    CLIENT_PUBLIC_KEY,
  );
  if (!isValidRequest) {
    return res.status(401).end("invalid request signature");
  }

  const interaction = req.body;
  let responce_body;
  if (interaction && interaction.type === InteractionType.APPLICATION_COMMAND) {
    const { options } = interaction.data;
    console.debug(`options: ${Object.keys(options)}`)
    let command, game;
    for (let option of options) {
      if (option.name === 'command') {
        command = option.value;
      } else if (option.name === 'game') {
        game = option.value;
      }
    }
    let response;
    if (command === "list") {
      const gameServers = await readGameServersJson();
      const gameServerNames = Object.keys(gameServers);
      response = "## list of game\n - " + gameServerNames.join("\n - ");
    } else {
      response = await gsscCommand(game, command);
    }
    responce_body = {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: response },
    };
  } else {
    responce_body = { type: InteractionResponseType.PONG }
  }
  res.send(responce_body);
};

functions.http("discordRequest", discordRequest);
