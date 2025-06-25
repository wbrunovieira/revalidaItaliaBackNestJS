# terraform/ansible.tf

resource "local_file" "ansible_inventory" {
  filename = "${path.module}/../ansible/inventory.yml"

  content = templatefile(
    "${path.module}/../ansible/inventory.tpl",
    {
      public_ip       = aws_eip.backend.public_ip, # usar EIP
      key_name        = data.aws_key_pair.revalida.key_name,
      next_public_url = data.aws_ssm_parameter.next_public_url.value,
      node_env        = data.aws_ssm_parameter.node_env.value,
      port            = data.aws_ssm_parameter.port.value,
      database_url    = data.aws_ssm_parameter.database_url.value,
      jwt_private_key = data.aws_ssm_parameter.jwt_private_key.value,
      jwt_public_key  = data.aws_ssm_parameter.jwt_public_key.value,

      # S3 Variables
      storage_type       = data.aws_ssm_parameter.storage_type.value,
      s3_bucket_name     = data.aws_ssm_parameter.s3_bucket_name.value,
      s3_region          = data.aws_ssm_parameter.s3_region.value,
      s3_base_url        = data.aws_ssm_parameter.s3_base_url.value,
      max_file_size      = data.aws_ssm_parameter.max_file_size.value,
      allowed_file_types = data.aws_ssm_parameter.allowed_file_types.value,
    }
  )
}

resource "null_resource" "wait_for_ssh" {
  # só roda depois do EIP estar associado
  depends_on = [aws_eip.backend]

  # conexão em nível de recurso (vale pra todos os provisioners abaixo)
  connection {
    type        = "ssh"
    host        = aws_eip.backend.public_ip
    user        = "ubuntu" # ajuste ao seu AMI
    private_key = file(var.private_key_path)
    timeout     = "5m" # até 5 minutos de tentativas
  }

  provisioner "remote-exec" {
    inline = [
      "echo 'SSH is ready ✅'",
    ]
  }
}

resource "null_resource" "run_ansible" {
  depends_on = [
    null_resource.wait_for_ssh,
    local_file.ansible_inventory,
  ]

  triggers = {
    playbook_checksum  = filemd5("${path.module}/../ansible/playbook.yml")
    inventory_checksum = filemd5("${path.module}/../ansible/inventory.tpl")
    always_run         = timestamp()
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../ansible"
    command     = "ansible-playbook -i inventory.yml playbook.yml"
  }
}
