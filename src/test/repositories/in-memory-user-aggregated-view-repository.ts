// src/test/repositories/in-memory-user-aggregated-view-repository.ts
import { Either, left, right } from '@/core/either';
import {
  IUserAggregatedViewRepository,
  UserAggregatedView,
} from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { UserProfileCriteria } from '@/domain/auth/application/criteria/user-profile-criteria';

export class InMemoryUserAggregatedViewRepository extends IUserAggregatedViewRepository {
  public items: UserAggregatedView[] = [];

  async findByIdentityId(
    identityId: string,
  ): Promise<Either<Error, UserAggregatedView | null>> {
    const view = this.items.find((item) => item.identityId === identityId);
    return right(view || null);
  }

  async findByEmail(
    email: string,
  ): Promise<Either<Error, UserAggregatedView | null>> {
    const view = this.items.find((item) => item.email === email);
    return right(view || null);
  }

  async findByNationalId(
    nationalId: string,
  ): Promise<Either<Error, UserAggregatedView | null>> {
    const view = this.items.find((item) => item.nationalId === nationalId);
    return right(view || null);
  }

  async findByCriteria(
    criteria: UserProfileCriteria,
  ): Promise<Either<Error, UserAggregatedView[]>> {
    // For now, just return all items as the criteria builder is complex
    // In a real implementation, we would parse the criteria.build() result
    return right([...this.items]);
  }

  async countByCriteria(
    criteria: UserProfileCriteria,
  ): Promise<Either<Error, number>> {
    const result = await this.findByCriteria(criteria);
    if (result.isLeft()) {
      return left(result.value);
    }
    return right(result.value.length);
  }

  async findForListing(params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    profession?: string;
    orderBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<
    Either<
      Error,
      {
        items: UserAggregatedView[];
        total: number;
        page: number;
        limit: number;
      }
    >
  > {
    let filtered = [...this.items];

    // Apply search filter
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.fullName.toLowerCase().includes(searchLower) ||
          item.email.toLowerCase().includes(searchLower) ||
          item.nationalId.includes(params.search!),
      );
    }

    // Apply role filter
    if (params.role) {
      filtered = filtered.filter((item) => item.role === params.role);
    }

    // Apply profession filter
    if (params.profession) {
      filtered = filtered.filter(
        (item) => item.profession === params.profession,
      );
    }

    // Apply sorting
    if (params.orderBy) {
      filtered.sort((a, b) => {
        const aValue = a[params.orderBy as keyof UserAggregatedView];
        const bValue = b[params.orderBy as keyof UserAggregatedView];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return params.order === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const end = start + params.limit;
    const paginatedItems = filtered.slice(start, end);

    return right({
      items: paginatedItems,
      total,
      page: params.page,
      limit: params.limit,
    });
  }

  // Helper methods for testing
  async create(view: UserAggregatedView): Promise<void> {
    this.items.push(view);
  }

  async update(view: UserAggregatedView): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.identityId === view.identityId,
    );
    if (index >= 0) {
      this.items[index] = view;
    }
  }

  async delete(identityId: string): Promise<void> {
    this.items = this.items.filter((item) => item.identityId !== identityId);
  }
}
