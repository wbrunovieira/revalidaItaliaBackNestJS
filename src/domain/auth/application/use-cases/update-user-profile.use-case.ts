// src/domain/auth/application/use-cases/update-user-profile.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { IAccountRepository } from '@/domain/auth/application/repositories/i-account-repository';
import { User } from '@/domain/auth/enterprise/entities/user.entity';
import { UpdateUserProfileRequest } from '../dtos/update-user-profile-request.dto';
import { UpdateUserProfileResponse } from '../dtos/update-user-profile-response.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { DuplicateEmailError } from './errors/duplicate-email-error';
import { DuplicateCPFError } from './errors/duplicate-cpf-error';
import { RepositoryError } from './errors/repository-error';
import { UnauthorizedError } from './errors/unauthorized-error';
import { updateUserProfileSchema } from './validations/update-user-profile.schema';
import { ZodError } from 'zod';

type UpdateUserProfileUseCaseResponse = Either<
  | InvalidInputError
  | ResourceNotFoundError
  | DuplicateEmailError
  | DuplicateCPFError
  | UnauthorizedError
  | RepositoryError
  | Error,
  UpdateUserProfileResponse
>;

@Injectable()
export class UpdateUserProfileUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(
    request: UpdateUserProfileRequest,
  ): Promise<UpdateUserProfileUseCaseResponse> {
    try {
      // Validação com Zod
      const validatedData = updateUserProfileSchema.parse(request);
      const { userId, name, email, cpf, phone, birthDate, profileImageUrl } = validatedData;

      // Buscar usuário existente
      let existingUser: User | undefined;
      try {
        const found = await this.accountRepository.findById(userId);
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
          const byEmail = await this.accountRepository.findByEmail(email);
          if (byEmail.isRight()) {
            return left(new DuplicateEmailError());
          }
        } catch (err: any) {
          return left(new RepositoryError(err.message));
        }
      }

      // Verificar unicidade do CPF se estiver sendo alterado
      if (cpf && cpf !== existingUser.cpf) {
        try {
          const byCpf = await this.accountRepository.findByCpf(cpf);
          if (byCpf.isRight()) {
            return left(new DuplicateCPFError());
          }
        } catch (err: any) {
          return left(new RepositoryError(err.message));
        }
      }

      // Atualizar o perfil
      existingUser.updateProfile({
        name,
        email,
        cpf,
        phone,
        profileImageUrl,
        birthDate,
      });

      // Salvar as alterações
      try {
        const saved = await this.accountRepository.save(existingUser);
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