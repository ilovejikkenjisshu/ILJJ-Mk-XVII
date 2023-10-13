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
  name        = "GSSC_Bot"
  runtime     = "nodejs16"
  description = "Discord BOT for Game Server"
  source_archive_bucket = var.bucket_name
  source_archive_object = "iljj-gssc-src.zip"

  trigger_http = true

  environment_variables = {
    BUCKET_NAME = var.bucket_name
    DISCORD_TOKEN = var.discord_token
    PROJECT_ID = var.project_id
    REGION = var.region
    CLIENT_PUBLIC_KEY = var.client_public_key
  }
}

output "function_uri" {
  value = google_cloudfunctions_function.gssc_discord_bot.service_config[0].uri
}
