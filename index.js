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

// クラウドファンクションの環境変数からトークンを取得
const { BUCKET_NAME, DISCORD_TOKEN, PROJECT_ID, REGION, CLIENT_PUBLIC_KEY } = process.env;

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

const getInstanceConfig = (instance_name) => {
  return {
    project: PROJECT_ID,
    zone: REGION,
    instance: instance_name,
  };
};

const startGameServer = async (gameServer) => {
  const { instance_name, name } = gameServer;
  try {
    await compute.instances.start(getInstanceConfig(instance_name));
    return `Start ${name} server`;
  } catch (err) {
    console.error("ERROR:", err);
    return `Failed to start ${name} server`;
  }
};

const stopGameServer = async (gameServer) => {
  const { instance_name, name } = gameServer;
  try {
    await compute.instances.stop(getInstanceConfig(instance_name));
    return `Stop ${name} server`;
  } catch (err) {
    console.error("ERROR:", err);
    return `Failed to stop ${name} server`;
  }
};

const restartGameServer = async (gameServer) => {
  const { instance_name, name } = gameServer;
  try {
    const instance_config = getInstanceConfig(instance_name);
    await compute.instances.stop(instance_config);
    await compute.instances.start(instance_config);
    return `Restart ${name} server`;
  } catch (err) {
    console.error("ERROR:", err);
    return `Failed to restart ${name} server`;
  }
};

const statusGameServer = async (gameServer) => {
  const { instance_name, name } = gameServer;
  try {
    const response = await compute.instances.get(getInstanceConfig(instance_name));
    return `${name}: ${response.data.status}`;
  } catch (err) {
    console.error("ERROR:", err);
    return `Failed to get status on ${name} server`;
  }
};

const discordRequest = async (req, res) => {
  // Verify the request
  const isValidRequest = await verifyKey(
    req.rawBody,
    req.get("X-Signature-Ed25519");,
    req.get("X-Signature-Timestamp");,
    CLIENT_PUBLIC_KEY,
  );
  if (!isValidRequest) return res.status(401).send("Bad request signature");

  const interactoin = req.body;
  let responce_body;
  if (interaction && interaction.type === InteractionType.APPLICATION_COMMAND) {
    const { commandName, options } = interaction.data;
    const command = options.getString("command");
    const game = options.getString("game");
    let response;
    if (command === "list") {
      const gameServers = await readGameServersJson();
      const gameServerNames = Object.keys(gameServers);
      response = gameServerNames.join("\n");
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
  res.status(200).send({
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(responce_body),
  });
};

functions.http("discordRequest", discordRequest);
