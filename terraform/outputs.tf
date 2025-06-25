# terraform/outputs.tf
output "backend_fixed_ip" {
  description = "Elastic IP público do backend"
  value       = aws_eip.backend.public_ip
}


output "db_endpoint" {
  description = "RDS endpoint to connect your app"
  value       = aws_db_instance.postgres.endpoint
}

output "s3_bucket_name" {
  description = "Nome do bucket S3 para documentos"
  value       = aws_s3_bucket.documents.bucket
}

output "s3_bucket_arn" {
  description = "ARN do bucket S3"
  value       = aws_s3_bucket.documents.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name do bucket S3"
  value       = aws_s3_bucket.documents.bucket_domain_name
}

output "s3_bucket_regional_domain_name" {
  description = "Regional domain name do bucket S3"
  value       = aws_s3_bucket.documents.bucket_regional_domain_name
}

output "s3_base_url" {
  description = "URL base para acessar arquivos no S3"
  value       = "https://${aws_s3_bucket.documents.bucket}.s3.${var.aws_region}.amazonaws.com"
}


output "backend_s3_role_arn" {
  description = "ARN da role IAM para acesso S3"
  value       = aws_iam_role.backend_s3.arn
}


output "ssm_parameters" {
  description = "Lista de parâmetros SSM criados"
  value = {
    storage_type       = aws_ssm_parameter.storage_type.name
    s3_bucket_name     = aws_ssm_parameter.s3_bucket_name.name
    s3_region          = aws_ssm_parameter.s3_region.name
    s3_base_url        = aws_ssm_parameter.s3_base_url.name
    max_file_size      = aws_ssm_parameter.max_file_size.name
    allowed_file_types = aws_ssm_parameter.allowed_file_types.name
  }
}
