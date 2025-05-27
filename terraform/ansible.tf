# terraform/ansible.tf
resource "local_file" "ansible_inventory" {
  filename = "${path.module}/../ansible/inventory.yml"

  content = templatefile(
    "${path.module}/../ansible/inventory.tpl",
    {
      public_ip       = aws_instance.backend.public_ip,
      key_name        = data.aws_key_pair.revalida.key_name,
      next_public_url = data.aws_ssm_parameter.next_public_url.value,
      node_env        = data.aws_ssm_parameter.node_env.value,
      port            = data.aws_ssm_parameter.port.value,
      database_url    = data.aws_ssm_parameter.database_url.value,
      jwt_private_key = data.aws_ssm_parameter.jwt_private_key.value,
      jwt_public_key  = data.aws_ssm_parameter.jwt_public_key.value,
    }
  )
}

resource "null_resource" "wait_for_ssh" {
  provisioner "remote-exec" {
    inline = ["echo 'SSH is ready'"]
    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file(var.private_key_path)
      host        = aws_instance.backend.public_ip
    }
  }

  depends_on = [aws_instance.backend]
}

resource "null_resource" "run_ansible" {
  depends_on = [
    null_resource.wait_for_ssh, # ✅ Aguarda o SSH responder
    local_file.ansible_inventory
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
