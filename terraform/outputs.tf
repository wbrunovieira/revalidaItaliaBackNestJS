output "ec2_public_ip" {
  description = "Public IP da instância backend"
  value       = aws_instance.backend.public_ip
}


output "db_endpoint" {
  description = "RDS endpoint to connect your app"
  value       = aws_db_instance.postgres.endpoint
}
