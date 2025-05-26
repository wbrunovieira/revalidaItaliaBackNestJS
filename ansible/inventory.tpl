all:
  hosts:
    backend:
      # conecta no IP que o Terraform passa
      ansible_host: "${public_ip}"
      ansible_user: ubuntu
      ansible_connection: ssh
      ansible_port: 22
      ansible_ssh_private_key_file: "~/.ssh/${key_name}"

  vars:
    NEXT_PUBLIC_URL: "${next_public_url}"
    NODE_ENV:        "${node_env}"
    PORT:            "${port}"
    DATABASE_URL:    "${database_url}"

    ## chaves PEM (multi-linha) corretamente indentadas abaixo
    JWT_PRIVATE_KEY: |
      ${replace(jwt_private_key, "\n", "\n      ")}
    JWT_PUBLIC_KEY: |
      ${replace(jwt_public_key, "\n", "\n      ")}