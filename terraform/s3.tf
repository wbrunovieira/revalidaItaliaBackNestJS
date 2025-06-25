resource "aws_s3_bucket" "documents" {
  bucket = "revalida-documents-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "revalida-documents"
    Environment = var.node_env
    Purpose     = "Document storage for course catalog"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = [
      var.next_public_url,
      "http://localhost:3000",
      "http://localhost:3333"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_policy" "documents" {
  bucket = aws_s3_bucket.documents.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowBackendInstanceAccess"
        Effect    = "Allow"
        Principal = { AWS = aws_iam_role.backend_s3.arn }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.documents.arn,
          "${aws_s3_bucket.documents.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    id     = "cleanup_old_versions"
    status = "Enabled"

    filter { prefix = "" }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  rule {
    id     = "transition_to_ia"
    status = "Enabled"

    filter { prefix = "" }

    transition {
      days          = var.s3_lifecycle_ia_days
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = var.s3_lifecycle_glacier_days
      storage_class = "GLACIER"
    }
  }
}

# IAM Role para a instância EC2 acessar S3
resource "aws_iam_role" "backend_s3" {
  name = "revalida-backend-s3-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
      }
    ]
  })

  tags = {
    Name = "revalida-backend-s3-role"
  }
}

# Convertendo inline policy para managed policy para expor arn
resource "aws_iam_policy" "backend_s3_policy" {
  name = "RevalidaS3Access"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetObjectVersion",
          "s3:DeleteObjectVersion"
        ]
        Resource = [
          aws_s3_bucket.documents.arn,
          "${aws_s3_bucket.documents.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "backend_s3_attach" {
  role       = aws_iam_role.backend_s3.name
  policy_arn = aws_iam_policy.backend_s3_policy.arn
}

# SSM Parameters
resource "aws_ssm_parameter" "storage_type" {
  name        = "/revalida/STORAGE_TYPE"
  description = "Tipo de storage (local ou s3)"
  type        = "String"
  value       = "s3"
}

resource "aws_ssm_parameter" "s3_bucket_name" {
  name        = "/revalida/S3_BUCKET_NAME"
  description = "Nome do bucket S3 para documentos"
  type        = "String"
  value       = aws_s3_bucket.documents.bucket
}

resource "aws_ssm_parameter" "s3_region" {
  name        = "/revalida/AWS_REGION"
  description = "Região AWS para S3"
  type        = "String"
  value       = var.aws_region
}

resource "aws_ssm_parameter" "s3_base_url" {
  name        = "/revalida/S3_BASE_URL"
  description = "URL base do bucket S3"
  type        = "String"
  value       = "https://${aws_s3_bucket.documents.bucket}.s3.${var.aws_region}.amazonaws.com"
}

resource "aws_ssm_parameter" "max_file_size" {
  name        = "/revalida/MAX_FILE_SIZE"
  description = "Tamanho máximo de arquivo em bytes"
  type        = "String"
  value       = "52428800"
}

resource "aws_ssm_parameter" "allowed_file_types" {
  name        = "/revalida/ALLOWED_FILE_TYPES"
  description = "Tipos de arquivo permitidos"
  type        = "String"
  value       = "pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv"
}
