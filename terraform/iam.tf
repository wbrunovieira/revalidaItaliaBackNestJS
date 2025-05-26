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
    ]
  }
}

resource "aws_iam_role_policy" "ssm_read_params" {
  name   = "RevalidaSSMRead"
  role   = aws_iam_role.ssm.name
  policy = data.aws_iam_policy_document.allow_ssm_read.json
}
