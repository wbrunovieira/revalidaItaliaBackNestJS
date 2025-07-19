// src/domain/auth/application/dtos/create-user-request.dto.ts
import { UserCreationSource } from '@/domain/auth/enterprise/events/user-created.event';

export interface CreateUserRequest {
  name: string;
  nationalId: string;
  email: string;
  password: string;
  role: 'admin' | 'tutor' | 'student';
  source?: UserCreationSource;
}
