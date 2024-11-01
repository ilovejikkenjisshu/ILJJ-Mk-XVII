# Game Server Slash Command BOT

ゲームサーバーの「起動/終了/再起動/状態確認」を実行できるdiscordbot  

## Slash Command

`/gssc [command] [game]`

`command`には実行されるコマンドを記述します。

| `command` | 実行される内容     | 例                      |
| :-:       | :-:                | :-:                     |
| `start`   | サーバーを起動     | `/gssc start valheim`   |
| `stop`    | サーバーを終了     | `/gssc stop valheim`    |
| `restart` | サーバーを再起動   | `/gssc restart valheim` |
| `status`  | サーバーの状態     | `/gssc status valheim`  |
| `list`    | サーバーの一覧表示 | `/gssc list`            |

`game`には起動するゲームサーバーのaliasを記述します。

## Game Server Settings

以下のようなjson形式で記述し、`game_servers.json`としてGCP上の`BUCKET_NAME`バケットに配置します。

```json:game_servers.json
{
  "valheim": {
    "name": "Valheim",
    "instance_name": "gcp insrance name",
    "zone": "asia-northeast1-b"
  },
  "minecraft-vanila": {
    "name": "Minecraft Vanila",
    "instance_name": "gcp insrance name",
    "zone": "asia-northeast1-b"
  }
}
```

## Setup Guide

### 1. Create Discord Application

Using [discord developers](https://discord.com/developers/applications).

### 2. GCPの認証情報を配置

ホームディレクトリ直下にゲームサーバーを配置予定のGCPプロジェクトから取得した、`google-key.json`を配置してください。
中身はサービスアカウントの認証情報です。
必要に応じてGCPの該当プロジェクト上でサービスアカウントを作成し、Compute Engineの「起動/停止/状態取得」の権限とCloud Storageの「buckt閲覧」権限を付与してください。

### 3. .env, config.jsonの修正

.envファイル内に必要な情報を埋めてください。
```.env
CLIENT_TOKEN=ディスコードのトークン
BUCKET_NAME=game_servers.jsonを配置したバケット名
PROJECT_ID=GCPのプロジェクト名
```

config.json の中身を自身のBOTとサーバに合わせて修正してください。
```json
{
	"token": "ディスコードのBOT TOKEN",
	"clientId": "アプリケーションID",
	"guildId": "ディスコードのサーバID"
}
```

### 3. BOTの登録

```bash
cd src
npm i
node deploy-commands.js
```

### 4. サーバーの起動

次のコマンドを実行すると、BOTが起動します。
```bash
npm run prod
```
また、`start.sh`を実行してもBOTが起動します。
必要であれば、`start.sh`を`systemd`などで起動してください。
```service
[Unit]
Description=Node.js Service
After=network-online.target
Requires=network-online.target

[Service]
Type=simple
User=実行者のユーザー名
WorkingDirectory=srcディレクトリの絶対パス
ExecStart=start.shの絶対パス

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## 参考情報

- https://blog.g-gen.co.jp/entry/using-terraform-via-github-actions
- https://zenn.dev/sway/articles/terraform_biginner_varliable
- https://zenn.dev/hiroga/articles/discord-bot-by-gcp-terraform-circleci
- https://sterfield.co.jp/blog/17682/
