// src/domain/auth/application/dtos/delete-user-request.dto.ts
export interface DeleteUserRequestDto {
  id: string;
  requesterId: string;
  requesterRole: 'admin' | 'tutor' | 'student';
}
