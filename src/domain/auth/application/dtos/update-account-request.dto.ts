// src/domain/auth/application/dtos/update-account-request.dto.ts
export interface UpdateAccountRequest {
  id:       string
  name?:    string
  cpf?:     string
  email?:   string
  password?: string
  profileImageUrl?: string
  role?:    'admin' | 'tutor' | 'student'
}