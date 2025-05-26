resource "aws_security_group" "db_sg" {
  name        = "revalida-db-sg"
  description = "Allow Postgres only from our backend EC2 SG"

  # EC2 (backend_sg) → RDS on 5432
  ingress {
    description     = "Allow Postgres from backend"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.backend_sg.id]
  }

  # RDS → anywhere outbound (for backups, updates…)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "revalida-db-sg"
  }
}
