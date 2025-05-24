resource "aws_instance" "backend" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  key_name                    = aws_key_pair.revalida.key_name
  iam_instance_profile        = aws_iam_instance_profile.ssm_profile.name
  vpc_security_group_ids      = [aws_security_group.backend_sg.id]
  associate_public_ip_address = true

  # Updated user_data script for Amazon Linux
  user_data = <<-EOF
  #!/bin/bash
  set -e

  # Update the system and install Docker and Docker Compose
  apt-get update -y
  apt-get install -y docker.io docker-compose

  # Install and start the SSM Agent (Session Manager)
  apt-get install -y amazon-ssm-agent
  systemctl enable --now amazon-ssm-agent

  # Add the ubuntu user to the Docker group
  usermod -aG docker ubuntu
EOF


  tags = {
    Name = "backend-instance"
  }
}
