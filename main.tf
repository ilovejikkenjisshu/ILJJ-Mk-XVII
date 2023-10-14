terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.34.0"
    }
  }
  backend "gcs" {
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

# Cloud Functionsにアップロードするファイルをzipに固める。
data "archive_file" "function_archive" {
  type        = "zip"
  source_dir  = "./src"
  output_path = "./iljj-gssc-src.zip"
}

# zipファイルをアップロードする
resource "google_storage_bucket_object" "packages" {
  name   = "iljj-gssc-src.zip"
  bucket = var.bucket_name
  source = data.archive_file.function_archive.output_path
}

resource "google_cloudfunctions2_function" "gssc_discord_bot" {
  name        = "GSSC_Bot"
  location    = var.region
  description = "Discord BOT for Game Server"

  build_config {
    runtime     = "nodejs16"
    entry_point = "discordRequest"
    source {
      storage_source {
        bucket = var.bucket_name
        object = google_storage_bucket_object.packages.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    available_memory   = "128M"
    timeout            = "60s"
  }

  environment_variables = {
    BUCKET_NAME       = var.bucket_name
    PROJECT_ID        = var.project_id
    CLIENT_PUBLIC_KEY = var.client_public_key
  }
}

output "function_uri" {
  value = google_cloudfunctions2_function.gssc_discord_bot.service_config[0].uri
}
