terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 3.61.0"
    }
  }
}

variable "bucket_name" {
  type = string
}

variable "discord_token" {
  type = string
}

variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "client_public_key" {
  type = string
}

resource "google_cloudfunctions_function" "gssc_discord_bot" {
  name        = "Game Server Slash Command Bot"
  runtime     = "nodejs16"
  description = "Discord BOT for Game Server"
  source_archive_bucket = bucket_name

  entry_point = "main" # Discord BOTのメインファイルのエントリポイント

  trigger_http = true

  environment_variables = {
    BUCKET_NAME = var.bucket_name
    DISCORD_TOKEN = var.discord_token
    PROJECT_ID = var.project_id
    REGION = var.region
    CLIENT_PUBLIC_KEY = var.client_public_key
  }
}

