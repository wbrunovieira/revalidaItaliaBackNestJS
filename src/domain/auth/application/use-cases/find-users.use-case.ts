// src/domain/auth/application/use-cases/find-users.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { RepositoryError } from './errors/repository-error';
import { IUserRepository } from '../repositories/i-user-repository';
import { PaginationParams } from '@/core/repositories/pagination-params';
import { FindUsersRequestDto } from '../dtos/find-users-request.dto';
import {
  FindUsersResponseDto,
  UserResponseDto,
  PaginationResponseDto,
} from '../dtos/find-users-response.dto';

export type FindUsersUseCaseResponse = Either<
  RepositoryError | Error,
  FindUsersResponseDto
>;

@Injectable()
export class FindUsersUseCase {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(
    request: FindUsersRequestDto = {},
  ): Promise<FindUsersUseCaseResponse> {
    try {
      const page =
        request.page && request.page > 0 ? Math.floor(request.page) : 1;

      const pageSize =
        request.pageSize && request.pageSize > 0
          ? Math.floor(request.pageSize)
          : 20;

      const paginationParams: PaginationParams = {
        page,
        pageSize,
      };

      // Construir filtros de busca
      const searchFilters = {
        name: request.name?.trim(),
        email: request.email?.trim(),
        nationalId: request.nationalId?.trim(),
      };

      // Remover filtros vazios
      const activeFilters = Object.fromEntries(
        Object.entries(searchFilters).filter(
          ([_, value]) => value && value !== '',
        ),
      );

      const result = await this.userRepo.findUsers(
        activeFilters,
        paginationParams,
      );

      if (result.isLeft()) {
        return left(new RepositoryError(result.value.message));
      }

      // Mapear para DTOs de response
      const users: UserResponseDto[] = result.value.map((user) => ({
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        nationalId: user.nationalId,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));

      const pagination: PaginationResponseDto = {
        page,
        pageSize,
      };

      const response: FindUsersResponseDto = {
        users,
        pagination,
      };

      return right(response);
    } catch (err: any) {
      const message = this.sanitizeErrorMessage(
        err.message || 'Failed to search users',
      );
      return left(new RepositoryError(message));
    }
  }

  private sanitizeErrorMessage(message: string): string {
    const sensitivePatterns = [
      /SELECT.*FROM/i,
      /INSERT.*INTO/i,
      /UPDATE.*SET/i,
      /DELETE.*FROM/i,
      /password/i,
      /token/i,
      /secret/i,
      /WHERE.*=/i,
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(message)) {
        return 'Failed to search users';
      }
    }

    return message;
  }
}
