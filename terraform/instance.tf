# terraform/instance.tf

# Dados dos parâmetros existentes
data "aws_ssm_parameter" "next_public_url" {
  name = aws_ssm_parameter.next_public_url.name
}
data "aws_ssm_parameter" "node_env" {
  name = aws_ssm_parameter.node_env.name
}
data "aws_ssm_parameter" "port" {
  name = aws_ssm_parameter.port.name
}
data "aws_ssm_parameter" "database_url" {
  name            = aws_ssm_parameter.database_url.name
  with_decryption = true
}
data "aws_ssm_parameter" "jwt_private_key" {
  name            = aws_ssm_parameter.jwt_private_key.name
  with_decryption = true
}
data "aws_ssm_parameter" "jwt_public_key" {
  name = aws_ssm_parameter.jwt_public_key.name
}

# Dados dos novos parâmetros S3
data "aws_ssm_parameter" "storage_type" {
  name = aws_ssm_parameter.storage_type.name
}
data "aws_ssm_parameter" "s3_bucket_name" {
  name = aws_ssm_parameter.s3_bucket_name.name
}
data "aws_ssm_parameter" "s3_region" {
  name = aws_ssm_parameter.s3_region.name
}
data "aws_ssm_parameter" "s3_base_url" {
  name = aws_ssm_parameter.s3_base_url.name
}
data "aws_ssm_parameter" "max_file_size" {
  name = aws_ssm_parameter.max_file_size.name
}
data "aws_ssm_parameter" "allowed_file_types" {
  name = aws_ssm_parameter.allowed_file_types.name
}

resource "aws_instance" "backend" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  key_name                    = data.aws_key_pair.revalida.key_name
  iam_instance_profile        = aws_iam_instance_profile.ssm_profile.name
  vpc_security_group_ids      = [aws_security_group.backend_sg.id]
  associate_public_ip_address = true

  user_data = <<-EOF
    #!/bin/bash
    set -e

    # Instala pré-requisitos
    apt-get update -y
    apt-get install -y docker.io docker-compose awscli jq amazon-ssm-agent
    systemctl enable --now amazon-ssm-agent
    usermod -aG docker ubuntu

    # Prepara diretório da aplicação
    mkdir -p /home/ubuntu/app
    mkdir -p /home/ubuntu/app/storage/documents
    chown -R ubuntu:ubuntu /home/ubuntu/app

    # Monta o .env usando valores do SSM
    cat > /home/ubuntu/app/.env <<EOT
    # Base Configuration
    NEXT_PUBLIC_URL=${data.aws_ssm_parameter.next_public_url.value}
    NODE_ENV=${data.aws_ssm_parameter.node_env.value}
    PORT=${data.aws_ssm_parameter.port.value}

    # Database
    DATABASE_URL='${data.aws_ssm_parameter.database_url.value}'

    # JWT
    JWT_PRIVATE_KEY='$(echo "${data.aws_ssm_parameter.jwt_private_key.value}" | sed -e ':a;N;$!ba;s/\\n/\\\\n/g')'
    JWT_PUBLIC_KEY='${data.aws_ssm_parameter.jwt_public_key.value}'

    # Storage Configuration
    STORAGE_TYPE=${data.aws_ssm_parameter.storage_type.value}
    
    # S3 Configuration
    AWS_REGION=${data.aws_ssm_parameter.s3_region.value}
    S3_BUCKET_NAME=${data.aws_ssm_parameter.s3_bucket_name.value}
    S3_BASE_URL=${data.aws_ssm_parameter.s3_base_url.value}
    
    # File Upload Configuration
    MAX_FILE_SIZE=${data.aws_ssm_parameter.max_file_size.value}
    ALLOWED_FILE_TYPES=${data.aws_ssm_parameter.allowed_file_types.value}
    
    # Local Storage (fallback)
    LOCAL_STORAGE_PATH=./storage/documents
    LOCAL_BASE_URL=${data.aws_ssm_parameter.next_public_url.value}
    EOT

  EOF

  tags = {
    Name = "backend-instance"
  }
}

resource "aws_eip" "backend" {
  domain   = "vpc"
  instance = aws_instance.backend.id

  tags = {
    Name = "backend-eip"
  }
}
