locals {

  jwt_private_key = file("${path.module}/../private.pem")
  jwt_public_key  = file("${path.module}/../public.pem")
}
