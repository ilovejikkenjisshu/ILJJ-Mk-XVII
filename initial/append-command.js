const {
  Client,
  Routes,
  REST,
  GatewayIntentBits: {
    Guilds,
    GuildMessages,
  }
} = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

const client = new Client({ intents: [Guilds, GuildMessages] });
const { DISCORD_TOKEN, DISCORD_GUILD } = process.env;

// Discord BOTのコマンドを定義
const commands = [
  new SlashCommandBuilder()
    .setName("gssc")
    .setDescription("Game Server Slash Commands")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command to execute")
        .setRequired(true)
        .addChoices(
          { name: "start", value: "start" },
          { name: "stop", value: "stop" },
          { name: "restart", value: "restart" },
          { name: "status", value: "status" },
          { name: "list", value: "list" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("game")
        .setDescription("The game server name")
        .setRequired(false),
    ),
].map((command) => {
  return command.toJSON();
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);

  // コマンドを登録
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

  (async () => {
    try {
      console.log("Started refreshing application (/) commands.");

      await rest.put(
        Routes.applicationGuildCommands(client.user.id, DISCORD_GUILD), // ギルドIDを指定
        { body: commands },
      );

      console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
      console.error(error);
    }
  })().then(() => { client.destroy(); });
});

// Discord BOTをログイン
client.login(DISCORD_TOKEN);
