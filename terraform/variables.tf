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
  default     = "t3.micro"
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
