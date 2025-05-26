resource "aws_security_group" "backend_sg" {
  # keep the AWS Security Group *name* unchanged so Terraform won't replace it
  name        = "backend_sg"
  description = "Allow SSH & API traffic to EC2"

  # SSH
  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Your app on port 3333
  ingress {
    description = "Backend API"
    from_port   = 3333
    to_port     = 3333
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "revalida-backend-sg"
  }
}
