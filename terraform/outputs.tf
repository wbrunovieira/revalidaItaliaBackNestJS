output "ec2_public_ip" {
  description = "Public IP da instância backend"
  value       = aws_instance.backend.public_ip
}
