#locals.tf
locals {

  jwt_private_key = file("${path.module}/../private.pem")
  jwt_public_key  = file("${path.module}/../public.pem")
  panda_api_key   = trimspace(file("${path.module}/../panda-api-key.txt"))
}
