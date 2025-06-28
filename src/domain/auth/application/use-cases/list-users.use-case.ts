// src/domain/auth/application/use-cases/list-users.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { RepositoryError } from './errors/repository-error';
import { IAccountRepository } from '../repositories/i-account-repository';
import { PaginationParams } from '@/core/repositories/pagination-params';

export interface ListUsersRequest {
  page?: number;
  pageSize?: number;
}

export type ListUsersResponse = Either<
  RepositoryError | Error,
  {
    users: {
      id: string;
      name: string;
      email: string;
      cpf: string;
      phone?: string;
      profileImageUrl?: string;
      role: 'admin' | 'tutor' | 'student';
      createdAt: Date;
      updatedAt: Date;
    }[];
    pagination: {
      page: number;
      pageSize: number;
      total?: number;
    };
  }
>;

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(IAccountRepository)
    private readonly accountRepo: IAccountRepository,
  ) {}

  async execute(request: ListUsersRequest = {}): Promise<ListUsersResponse> {
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

      const result = await this.accountRepo.findAll(paginationParams);

      if (result.isLeft()) {
        return left(new RepositoryError(result.value.message));
      }

      const users = result.value.map((user) => ({
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));

      return right({
        users,
        pagination: {
          page,
          pageSize,
        },
      });
    } catch (err: any) {
      // Sanitize error messages to prevent information leakage
      const message = this.sanitizeErrorMessage(
        err.message || 'Failed to list users',
      );
      return left(new RepositoryError(message));
    }
  }

  private sanitizeErrorMessage(message: string): string {
    // Check for common sensitive patterns
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
        return 'Failed to list users';
      }
    }

    return message;
  }
}
