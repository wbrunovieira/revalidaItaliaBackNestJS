data "aws_iam_policy_document" "ssm_assume" {
  statement {
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ssm" {
  name               = "ssm-for-backend"
  assume_role_policy = data.aws_iam_policy_document.ssm_assume.json
}

resource "aws_iam_role_policy_attachment" "ssm_attach" {
  role       = aws_iam_role.ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ssm_profile" {
  name = "ssm-for-backend-profile"
  role = aws_iam_role.ssm.name
}

# Política para leitura dos parâmetros SSM
data "aws_iam_policy_document" "allow_ssm_read" {
  statement {
    sid = "AllowReadRevalidaParams"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath"
    ]
    resources = [
      aws_ssm_parameter.next_public_url.arn,
      aws_ssm_parameter.node_env.arn,
      aws_ssm_parameter.port.arn,
      aws_ssm_parameter.database_url.arn,
      aws_ssm_parameter.jwt_private_key.arn,
      aws_ssm_parameter.jwt_public_key.arn,
      aws_ssm_parameter.storage_type.arn,
      aws_ssm_parameter.s3_bucket_name.arn,
      aws_ssm_parameter.s3_region.arn,
      aws_ssm_parameter.s3_base_url.arn,
      aws_ssm_parameter.max_file_size.arn,
      aws_ssm_parameter.allowed_file_types.arn,
    ]
  }
}

resource "aws_iam_role_policy" "ssm_read_params" {
  name   = "RevalidaSSMRead"
  role   = aws_iam_role.ssm.name
  policy = data.aws_iam_policy_document.allow_ssm_read.json
}

# Política para acesso ao S3
data "aws_iam_policy_document" "allow_s3_access" {
  statement {
    sid = "AllowS3BucketAccess"
    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation"
    ]
    resources = [
      aws_s3_bucket.documents.arn
    ]
  }

  statement {
    sid = "AllowS3ObjectAccess"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:GetObjectVersion",
      "s3:DeleteObjectVersion"
    ]
    resources = [
      "${aws_s3_bucket.documents.arn}/*"
    ]
  }
}

resource "aws_iam_role_policy" "s3_access_policy" {
  name   = "RevalidaS3Access"
  role   = aws_iam_role.ssm.name
  policy = data.aws_iam_policy_document.allow_s3_access.json
}
