# parameters.tf

# Valor público (não‐sensível)
resource "aws_ssm_parameter" "next_public_url" {
  name        = "/revalida/NEXT_PUBLIC_URL"
  description = "URL pública do frontend"
  type        = "String"
  value       = var.next_public_url
}

resource "aws_ssm_parameter" "node_env" {
  name        = "/revalida/NODE_ENV"
  description = "Ambiente Node"
  type        = "String"
  value       = var.node_env
}

resource "aws_ssm_parameter" "port" {
  name        = "/revalida/PORT"
  description = "Porta da API"
  type        = "String"
  value       = var.port
}

# Segredos (usar SecureString)
resource "aws_ssm_parameter" "database_url" {
  name        = "/revalida/DATABASE_URL"
  description = "String de conexão com o Postgres"
  type        = "SecureString"
  value       = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.address}:5432/${var.db_name}?schema=public"
}


resource "aws_ssm_parameter" "jwt_private_key" {
  name        = "/revalida/JWT_PRIVATE_KEY"
  description = "Chave privada JWT"
  type        = "SecureString"
  value       = local.jwt_private_key
}

resource "aws_ssm_parameter" "jwt_public_key" {
  name        = "/revalida/JWT_PUBLIC_KEY"
  description = "Chave pública JWT"
  type        = "String"
  value       = local.jwt_public_key
}

resource "aws_ssm_parameter" "panda_api_key" {
  name        = "/revalida/PANDA_API_KEY"
  description = "Panda Video API Key"
  type        = "SecureString"
  value       = local.panda_api_key
}

