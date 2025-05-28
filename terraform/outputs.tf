# terraform/outputs.tf
output "backend_fixed_ip" {
  description = "Elastic IP público do backend"
  value       = aws_eip.backend.public_ip
}


output "db_endpoint" {
  description = "RDS endpoint to connect your app"
  value       = aws_db_instance.postgres.endpoint
}
