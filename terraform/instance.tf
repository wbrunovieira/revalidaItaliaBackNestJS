# instance.tf

# 1) lookup dos parâmetros no SSM Parameter Store
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

# 2) define recurso EC2 que irá montar o .env e subir o Docker Compose
resource "aws_instance" "backend" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  key_name                    = aws_key_pair.revalida.key_name
  iam_instance_profile        = aws_iam_instance_profile.ssm_profile.name
  vpc_security_group_ids      = [aws_security_group.backend_sg.id]
  associate_public_ip_address = true

  user_data = <<-EOF
    #!/bin/bash
    set -e

    # Instala pre­requisitos
    apt-get update -y
    apt-get install -y docker.io docker-compose awscli jq amazon-ssm-agent
    systemctl enable --now amazon-ssm-agent
    usermod -aG docker ubuntu

    # Prepara diretório da aplicação
    mkdir -p /home/ubuntu/app
    chown ubuntu:ubuntu /home/ubuntu/app

    # Monta o .env usando valores do SSM
    cat > /home/ubuntu/app/.env <<EOT
    NEXT_PUBLIC_URL=${data.aws_ssm_parameter.next_public_url.value}
    NODE_ENV=${data.aws_ssm_parameter.node_env.value}
    PORT=${data.aws_ssm_parameter.port.value}

    DATABASE_URL='${data.aws_ssm_parameter.database_url.value}'

    JWT_PRIVATE_KEY='$(echo "${data.aws_ssm_parameter.jwt_private_key.value}" | sed -e ':a;N;$!ba;s/\\n/\\\\n/g')'
    JWT_PUBLIC_KEY='${data.aws_ssm_parameter.jwt_public_key.value}'
    EOT

    # Inicia o container via docker-compose
    cd /home/ubuntu/app
    docker compose -f compose.prod.yml up -d --build
  EOF

  tags = {
    Name = "backend-instance"
  }
}
