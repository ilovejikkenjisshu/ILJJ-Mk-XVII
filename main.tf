terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 3.61.0"
    }
  }
  backend "gcs" {
    prefix = "terraform/state"
  }
}

variable "bucket_name" {
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

variable "credentials_file" {
  type = string
}

# jsonファイルのパスをcredentialsに設定する
provider "google" {
  credentials = file(var.credentials_file)
  project     = var.project_id
  region      = var.region
}

# NOTE: 今回はgithub actionsでzipを作成してアップロードするので不要
# # Cloud Functionsにアップロードするファイルをzipに固める。
# data "archive_file" "function_archive" {
#   type        = "zip"
#   source_dir  = "./src"
#   output_path = "./iljj-gssc-src.zip"
# }
#
# # zipファイルをアップロードするためのbucketを作成
# resource "google_storage_bucket" "bucket" {
#   name          = var.bucket_name
#   location      = var.region
#   storage_class = "STANDARD"
# }
#
# # zipファイルをアップロードする
# resource "google_storage_bucket_object" "packages" {
#   name   = "iljj-gssc-src.zip"
#   bucket = google_storage_bucket.bucket.name
#   source = data.archive_file.function_archive.output_path
# }

resource "google_cloudfunctions_function" "gssc_discord_bot" {
  name                  = "GSSC_Bot"
  runtime               = "nodejs16"
  description           = "Discord BOT for Game Server"
  source_archive_bucket = var.bucket_name
  source_archive_object = "iljj-gssc-src.zip"

  trigger_http = true
  entry_point  = "discordRequest"

  environment_variables = {
    BUCKET_NAME       = var.bucket_name
    PROJECT_ID        = var.project_id
    CLIENT_PUBLIC_KEY = var.client_public_key
  }
}

output "function_uri" {
  value = google_cloudfunctions_function.gssc_discord_bot.https_trigger_url
}
