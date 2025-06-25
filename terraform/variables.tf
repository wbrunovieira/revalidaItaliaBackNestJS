# terraform/variables.tf
variable "aws_region" {
  description = "AWS region"
  default     = "us-east-2"
}

variable "aws_profile" {
  description = "AWS CLI profile"
  default     = "bruno-admin-revalida-aws"
}

variable "key_name" {
  description = "Name for the EC2 key pair in AWS"
  default     = "revalida-key"
}

variable "public_key_path" {
  description = "Absolute path to your public key (no tilde)"
  default     = "/Users/brunovieira/.ssh/revalida-key.pub"
}



variable "instance_type" {
  description = "EC2 instance type"
  default     = "t3.small"
}

variable "ami_id" {
  description = "Ubuntu 22.04 LTS HVM SSD"
  default     = "ami-04f167a56786e4b09"
}

variable "db_name" {
  description = "Name of the database to create"
  default     = "revalida_postgres"
}

variable "db_username" {
  description = "Postgres username"
  default     = "postgres"
}

variable "db_password" {
  description = "Postgres user password"
  default     = "docker123"
  sensitive   = true
}

variable "db_allocated_storage" {
  description = "Storage (GB) for RDS"
  default     = 20
}

variable "db_instance_class" {
  description = "RDS instance class"
  default     = "db.t3.micro"
}

variable "db_engine_version" {
  description = "Postgres engine version"
  default     = "16"
}

variable "next_public_url" {
  description = "URL pública do frontend"
  type        = string
  default     = "http://example.com"
}

variable "node_env" {
  description = "Ambiente Node"
  type        = string
  default     = "development"
}

variable "port" {
  description = "Porta da API"
  type        = string
  default     = "3333"
}

variable "private_key_path" {
  description = "Absolute path to your private key"
  default     = "/Users/brunovieira/.ssh/revalida-key"
}

variable "enable_s3_storage" {
  description = "Enable S3 storage for documents"
  type        = bool
  default     = true
}

variable "s3_bucket_prefix" {
  description = "Prefix for S3 bucket name"
  type        = string
  default     = "revalida-documents"
}

variable "s3_versioning_enabled" {
  description = "Enable S3 bucket versioning"
  type        = bool
  default     = true
}

variable "s3_lifecycle_ia_days" {
  description = "Days to transition to IA storage class"
  type        = number
  default     = 30
}

variable "s3_lifecycle_glacier_days" {
  description = "Days to transition to Glacier storage class"
  type        = number
  default     = 90
}

variable "max_file_size_mb" {
  description = "Maximum file size in MB"
  type        = number
  default     = 50
}

variable "allowed_file_extensions" {
  description = "Allowed file extensions for upload"
  type        = list(string)
  default     = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"]
}
