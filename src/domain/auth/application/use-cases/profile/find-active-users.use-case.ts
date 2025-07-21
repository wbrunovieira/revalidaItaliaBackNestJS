// src/domain/auth/application/use-cases/profile/find-active-users.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { RepositoryError } from '@/domain/auth/domain/exceptions';

import { ListUsersResponseDto, UserResponseDto } from '../../dtos/user-response.dto';
import { UserRole } from '@/domain/auth/enterprise/entities/user-authorization';
import { IUserAggregatedViewRepository } from '../../repositories/i-user-aggregated-view-repository';

export interface FindActiveUsersRequest {
  roles?: UserRole[];
  activeDays?: number;
  page?: number;
  pageSize?: number;
}

export type FindActiveUsersResponse = Either<
  RepositoryError,
  ListUsersResponseDto
>;

/**
 * Use case for finding active users
 *
 * Demonstrates advanced usage of the Criteria Pattern
 * to build complex queries in a clean way
 */
@Injectable()
export class FindActiveUsersUseCase {
  constructor(
    @Inject(IUserAggregatedViewRepository)
    private readonly userViewRepo: IUserAggregatedViewRepository,
  ) {}

  async execute(
    request: FindActiveUsersRequest = {},
  ): Promise<FindActiveUsersResponse> {
    try {
      const page =
        request.page && request.page > 0 ? Math.floor(request.page) : 1;
      const pageSize =
        request.pageSize && request.pageSize > 0
          ? Math.floor(request.pageSize)
          : 20;
      const activeDays = request.activeDays || 30;

      // Calculate the date for active users
      const activeDate = new Date();
      activeDate.setDate(activeDate.getDate() - activeDays);

      // Use the aggregated view for efficient querying
      const result = await this.userViewRepo.findForListing({
        page,
        limit: pageSize,
        role: request.roles && request.roles.length === 1 ? request.roles[0] : undefined,
        orderBy: 'lastLogin',
        order: 'desc',
      });

      if (result.isLeft()) {
        return left(
          RepositoryError.operationFailed('findActiveUsers', result.value),
        );
      }

      const { items, total } = result.value;

      // Filter by active users and multiple roles if needed
      let filteredItems = items.filter(
        view => view.lastLogin && view.lastLogin >= activeDate && view.isActive
      );

      if (request.roles && request.roles.length > 0) {
        filteredItems = filteredItems.filter(
          view => request.roles!.includes(view.role as UserRole)
        );
      }

      // Map to UserResponseDto
      const users: UserResponseDto[] = filteredItems.map(view => ({
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

      return right({
        users,
        total: filteredItems.length,
        page,
        pageSize,
      });
    } catch (err: any) {
      return left(RepositoryError.operationFailed('findActiveUsers', err));
    }
  }
}
