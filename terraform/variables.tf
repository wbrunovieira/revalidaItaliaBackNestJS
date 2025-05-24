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

variable "private_key_path" {
  description = "Absolute path to your private key"
  default     = "/Users/brunovieira/.ssh/revalida-key"
}

variable "instance_type" {
  description = "EC2 instance type"
  default     = "t3.micro"
}

variable "ami_id" {
  description = "Ubuntu 22.04 LTS HVM SSD"
  default     = "ami-04f167a56786e4b09" # AMI para Ubuntu 22.04 LTS (Exemplo para us-east-2)
}
