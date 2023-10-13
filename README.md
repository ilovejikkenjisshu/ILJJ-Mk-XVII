# Game Server Slash Command BOT

ゲームサーバーの「起動/終了/再起動/状態確認」を実行できるdiscordbot  

## Slash Command

`/gssc [command] [game]`

`command`には実行されるコマンドを記述します。

| `command` | 実行される内容     |
| :-------: | :----------------: |
| `start`   | サーバーを起動     |
| `stop`    | サーバーを終了     |
| `restart` | サーバーを再起動   |
| `status`  | サーバーの状態     |
| `list`    | サーバーの一覧表示 |

`game`には起動するゲームサーバーのaliasを記述します。

## Game Server Settings

以下のようなjson形式で記述し、`game_servers.json`としてGCPの`gssc`バケットに配置します。

```json:game_servers.json
{
  "valheim": {
    "name": "Valheim",
    "instance_name": "gcp insrance name",
  },
  "minecraft-vanila": {
    "name": "Minecraft Vanila",
    "instance_name": "gcp insrance name",
  }
}
```

## Setup Guide

### 1. Create Discord Application

Using [https://discord.com/developers/applications]

### 2. GCP Settings

```bash
REGION=asia-northeast1
gcloud init
gsutil mb -b on -c standard -l ${REGION} gs://gssc
gcloud iam service-accounts create terraform --display-name="terraform"
```

### 3. Github Actinos Settings

#### Variables

| Name             | Value              |
| :--------------: | :----------------: |
| `PROJECT_ID`     | GCP Project Number |
| `POOL_ID`        | GCP Pool ID        |
| `PROVIDER_ID`    | GCP Provider ID    |
| `REGION`         | GCP Region         |
| `DISCORD_BOT_ID` | Discord Bot ID     |

#### Secrets

| Name                | Value                  |
| :-----------------: | :--------------------: |
| `DISCORD_TOKEN`     | Discord Bot Token      |
| `CLIENT_PUBLIC_KEY` | Discord Bot Public Key |
| `DISCORD_GUILD`     | Discord Guild ID       |

## 参考情報

- [https://blog.g-gen.co.jp/entry/using-terraform-via-github-actions]
- [https://zenn.dev/sway/articles/terraform_biginner_varliable]
- [https://zenn.dev/hiroga/articles/discord-bot-by-gcp-terraform-circleci]
