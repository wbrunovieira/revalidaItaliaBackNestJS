// src/domain/auth/application/dtos/update-user-profile-response.dto.ts

import { UserProps } from '@/domain/auth/enterprise/entities/user.entity';

export interface UpdateUserProfileResponse {
  user: Omit<UserProps, 'password'> & { id: string };
}