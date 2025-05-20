// src/domain/auth/application/dtos/create-account-request.dto.ts
export interface CreateAccountRequest {
  name:     string
  cpf:      string
  email:    string
  password: string
  role:     'admin' | 'tutor' | 'student'
}