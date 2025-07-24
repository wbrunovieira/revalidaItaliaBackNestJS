// src/domain/auth/application/use-cases/profile/list-users.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { validateSync } from 'class-validator';
import { IUserAggregatedViewRepository } from '../../repositories/i-user-aggregated-view-repository';
import { Either, left, right } from '@/core/either';
import {
  InvalidInputError,
  RepositoryError,
} from '@/domain/auth/domain/exceptions';
import { ListUsersRequestDto } from '../../dtos/list-users-request.dto';
import { ListUsersResponseDto } from '../../dtos/list-users-response.dto';

export type ListUsersResult = Either<
  InvalidInputError | RepositoryError,
  ListUsersResponseDto
>;

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(IUserAggregatedViewRepository)
    private viewRepo: IUserAggregatedViewRepository,
  ) {}

  async execute(request: ListUsersRequestDto): Promise<ListUsersResult> {
    // Validate DTO
    const dto = Object.assign(new ListUsersRequestDto(), request);
    const errors = validateSync(dto);

    if (errors.length > 0) {
      const details = errors.flatMap((error) =>
        Object.entries(error.constraints || {}).map(([code, message]) => ({
          code,
          message,
          path: [error.property],
        })),
      );
      return left(new InvalidInputError('Validation failed', details));
    }

    // Set defaults
    const page = request.page || 1;
    const limit = request.limit || 10;

    try {
      // Fetch users from repository
      const result = await this.viewRepo.findForListing({
        page,
        limit,
        search: request.search,
        role: request.role,
        profession: request.profession,
        orderBy: request.orderBy || 'createdAt',
        order: request.order || 'desc',
      });

      if (result.isLeft()) {
        return left(RepositoryError.operationFailed('listUsers', result.value));
      }

      const data = result.value;
      const totalPages = Math.ceil(data.total / limit);

      return right({
        items: data.items.map((view) => ({
          identityId: view.identityId,
          email: view.email,
          emailVerified: view.emailVerified,
          fullName: view.fullName,
          nationalId: view.nationalId,
          phone: view.phone,
          profileImageUrl: view.profileImageUrl,
          bio: view.bio,
          profession: view.profession,
          specialization: view.specialization,
          role: view.role,
          isActive: view.isActive,
          lastLogin: view.lastLogin,
          createdAt: view.createdAt,
        })),
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages,
      });
    } catch (error: any) {
      return left(
        RepositoryError.operationFailed(
          'listUsers',
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }
  }
}
