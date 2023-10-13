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
BUCKET_NAME=your-bucket-name
POOL_ID=your-pool-id
PROVIDER_ID=your-provider-id
gcloud init
gsutil mb -b on -c standard -l ${REGION} gs://${BUCKET_NAME}
gcloud services enable iamcredentials.googleapis.com
gcloud iam service-accounts create terraform --display-name="terraform"
# Service Accountに必要な権限を付与: Storage Object Admin, Cloud Functions Admin
SERVICE_ACCOUNT_EMAIL=your-service-account-email
GITHUB_REPOSITORY="github-user-name/github-repository-name"
PROJECT_NUMBER=$(gcloud projects list --format="table(projectNumber,projectId)" | grep $(gcloud config get-value project) | cut -d ' ' -f1)
gcloud iam workload-identity-pools create ${POOL_ID} --loation="global" --description="gssc-pool"
gcloud iam workload-identity-pools providers create-oidc ${PROVIDER_ID} \
  --location="global" \
  --workload-identity-pool=${POOL_ID} \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" \
  --issuer-uri="https://token.actions.githubusercontent.com"
gcloud iam service-accounts add-iam-policy-binding \
  "${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/subject/attribute.repository/${GITHUB_REPOSITORY}"
```

コマンドでうまく行かない場合、 [https://zenn.dev/kou_pg_0131/articles/gh-actions-oidc-gcp](GitHub Actions で OIDC を使用して GCP 認証を行う) を見て、ポチポチしてください。

### 3. Github Actinos Settings

#### Variables

| Name                    | Value                     |
| :---------------------: | :-----------------------: |
| `PROJECT_ID`            | GCP Project Number        |
| `POOL_ID`               | GCP Pool ID               |
| `PROVIDER_ID`           | GCP Provider ID           |
| `SERVICE_ACCOUNT_EMAIL` | GCP Service Account Email |
| `REGION`                | GCP Region                |
| `BUCKET_NAME`           | GCP Bucket Name           |
| `DISCORD_BOT_ID`        | Discord Bot ID            |
| `CLIENT_PUBLIC_KEY`     | Discord Bot Public Key    |

#### Secrets

| Name                | Value                  |
| :-----------------: | :--------------------: |
| `DISCORD_TOKEN`     | Discord Bot Token      |
| `DISCORD_GUILD`     | Discord Guild ID       |

## 参考情報

- [https://blog.g-gen.co.jp/entry/using-terraform-via-github-actions]
- [https://zenn.dev/sway/articles/terraform_biginner_varliable]
- [https://zenn.dev/hiroga/articles/discord-bot-by-gcp-terraform-circleci]
