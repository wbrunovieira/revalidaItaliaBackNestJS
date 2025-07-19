// src/domain/auth/application/use-cases/update-user-profile.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/auth/application/repositories/i-user-repository';
import { User } from '@/domain/auth/enterprise/entities/user.entity';
import { UpdateUserProfileRequest } from '../dtos/update-user-profile-request.dto';
import { UpdateUserProfileResponse } from '../dtos/update-user-profile-response.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { DuplicateEmailError } from './errors/duplicate-email-error';
import { DuplicateNationalIdError } from './errors/duplicate-national-id-error';
import { RepositoryError } from './errors/repository-error';
import { UnauthorizedError } from './errors/unauthorized-error';
import { updateUserProfileSchema } from './validations/update-user-profile.schema';
import { ZodError } from 'zod';

type UpdateUserProfileUseCaseResponse = Either<
  | InvalidInputError
  | ResourceNotFoundError
  | DuplicateEmailError
  | DuplicateNationalIdError
  | UnauthorizedError
  | RepositoryError
  | Error,
  UpdateUserProfileResponse
>;

@Injectable()
export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    request: UpdateUserProfileRequest,
  ): Promise<UpdateUserProfileUseCaseResponse> {
    try {
      // Validação com Zod
      const validatedData = updateUserProfileSchema.parse(request);
      const { userId, name, email, nationalId, phone, birthDate, profileImageUrl } = validatedData;

      // Buscar usuário existente
      let existingUser: User | undefined;
      try {
        const found = await this.userRepository.findById(userId);
        if (found.isLeft()) {
          return left(found.value);
        }
        existingUser = found.value;
      } catch (err: any) {
        return left(new RepositoryError(err.message));
      }

      if (!existingUser) {
        return left(new ResourceNotFoundError('Usuário não encontrado'));
      }

      // Verificar unicidade do email se estiver sendo alterado
      if (email && email !== existingUser.email) {
        try {
          const byEmail = await this.userRepository.findByEmail(email);
          if (byEmail.isRight() && byEmail.value) {
            return left(new DuplicateEmailError());
          }
        } catch (err: any) {
          return left(new RepositoryError(err.message));
        }
      }

      // Verificar unicidade do nationalId se estiver sendo alterado
      if (nationalId && nationalId !== existingUser.nationalId) {
        try {
          const byNationalId = await this.userRepository.findByNationalId(nationalId);
          if (byNationalId.isRight() && byNationalId.value) {
            return left(new DuplicateNationalIdError());
          }
        } catch (err: any) {
          return left(new RepositoryError(err.message));
        }
      }

      // Atualizar o perfil
      existingUser.updateProfile({
        name,
        email,
        nationalId,
        phone,
        profileImageUrl,
        birthDate,
      });

      // Salvar as alterações
      try {
        const saved = await this.userRepository.save(existingUser);
        if (saved.isLeft()) {
          return left(new RepositoryError(saved.value.message));
        }
      } catch (err: any) {
        return left(new RepositoryError(err.message));
      }

      return right({ user: existingUser.toResponseObject() });
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        // Usar a primeira mensagem de erro específica do Zod
        const firstErrorMessage = error.errors[0]?.message || 'Dados de entrada inválidos';
        return left(new InvalidInputError(firstErrorMessage, errors));
      }
      return left(new Error('Erro inesperado ao atualizar perfil'));
    }
  }
}