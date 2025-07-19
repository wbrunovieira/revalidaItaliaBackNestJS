// src/domain/auth/application/dtos/update-user-request.dto.ts
export interface UpdateUserRequest {
  id: string;
  name?: string;
  nationalId?: string;
  email?: string;
  password?: string;
  profileImageUrl?: string;
  role?: 'admin' | 'tutor' | 'student';
}
