data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_db_subnet_group" "revalida" {
  name       = "revalida-db-subnets"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name = "revalida-db-subnets"
  }
}

resource "aws_db_instance" "postgres" {
  identifier        = "revalida-postgres"
  engine            = "postgres"
  engine_version    = var.db_engine_version
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage

  # initial database name
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.revalida.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]

  publicly_accessible = false
  skip_final_snapshot = true

  tags = {
    Name = "revalida-postgres"
  }
}
