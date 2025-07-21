// src/domain/auth/application/use-cases/profile/find-users.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { RepositoryError } from '@/domain/auth/domain/exceptions';

import { FindUsersRequestDto } from '../../dtos/find-users-request.dto';
import {
  FindUsersResponseDto,
  PaginationResponseDto,
} from '../../dtos/find-users-response.dto';
import { UserResponseDto } from '../../dtos/user-response.dto';

import { IUserAggregatedViewRepository } from '../../repositories/i-user-aggregated-view-repository';

export type FindUsersUseCaseResponse = Either<
  RepositoryError,
  FindUsersResponseDto
>;

@Injectable()
export class FindUsersUseCase {
  constructor(
    @Inject(IUserAggregatedViewRepository)
    private readonly userViewRepo: IUserAggregatedViewRepository,
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

      // Use the aggregated view for efficient searching
      const result = await this.userViewRepo.findForListing({
        page,
        limit: pageSize,
        search: request.name?.trim() || request.email?.trim() || request.nationalId?.trim(),
        orderBy: 'createdAt',
        order: 'desc',
      });

      if (result.isLeft()) {
        return left(RepositoryError.operationFailed('findUsers', result.value));
      }

      const { items, total } = result.value;

      // Map to response DTOs
      const users: UserResponseDto[] = items.map(view => ({
        id: view.identityId,
        email: view.email,
        name: view.fullName,
        nationalId: view.nationalId,
        phone: view.phone || undefined,
        birthDate: view.birthDate || undefined,
        profileImageUrl: view.profileImageUrl || undefined,
        role: view.role,
        lastLogin: view.lastLogin || undefined,
        createdAt: view.createdAt,
        updatedAt: view.updatedAt || view.createdAt,
      }));

      const pagination: PaginationResponseDto = {
        page,
        pageSize,
        total,
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
      return left(
        RepositoryError.operationFailed('search', new Error(message)),
      );
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
