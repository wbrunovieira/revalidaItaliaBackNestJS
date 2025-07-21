// src/test/repositories/in-memory-account-repository.ts
import { Either, left, right } from '@/core/either';
import { PaginationParams } from '@/core/repositories/pagination-params';
import {
  IUserRepository,
  SearchFilters,
} from '@/domain/auth/application/repositories/i-user-repository';
import { ResourceNotFoundError } from '@/domain/auth/application/use-cases/errors/resource-not-found-error';
import { User } from '@/domain/auth/enterprise/entities/user.entity';
import { Email } from '@/domain/auth/enterprise/value-objects/email.vo';
import { NationalId } from '@/domain/auth/enterprise/value-objects/national-id.vo';
import { UserCriteria } from '@/domain/auth/application/criteria/user-criteria';

export class InMemoryUserRepository implements IUserRepository {
  public items: User[] = [];

  async findByVerificationToken(token: string): Promise<User | null> {
    throw new Error('Method not implemented.');
  }


  async findById(id: string): Promise<Either<Error, User | null>> {
    const user = this.items.find((item) => item.id.toString() === id);
    return right(user || null);
  }

  async create(user: User): Promise<Either<Error, void>> {
    this.items.push(user);
    return right(undefined);
  }

  async findByEmail(email: Email): Promise<Either<Error, User | null>> {
    const user = this.items.find((item) => item.email.equals(email));
    return right(user || null);
  }

  async findByNationalId(nationalId: NationalId): Promise<Either<Error, User | null>> {
    const user = this.items.find((item) => item.nationalId.equals(nationalId));
    return right(user || null);
  }

  async findAll(params: PaginationParams): Promise<Either<Error, User[]>> {
    try {
      const { page, pageSize } = params;

      // Validate parameters
      if (page < 1 || pageSize < 1) {
        return left(new Error('Invalid pagination parameters'));
      }

      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      // Sort by createdAt descending (newest first)
      const sortedItems = [...this.items].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      const paginatedItems = sortedItems.slice(startIndex, endIndex);

      return right(paginatedItems);
    } catch (error) {
      return left(new Error('Failed to retrieve users'));
    }
  }

  async findUsers(
    filters: SearchFilters,
    params: PaginationParams,
  ): Promise<Either<Error, User[]>> {
    try {
      const { page, pageSize } = params;

      // Validate parameters
      if (page < 1 || pageSize < 1) {
        return left(new Error('Invalid pagination parameters'));
      }

      // Filter users based on search criteria
      let filteredUsers = [...this.items];

      // Se não há filtros, retorna todos os usuários
      if (!filters || Object.keys(filters).length === 0) {
        // Apply pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        const sortedUsers = filteredUsers.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );

        const paginatedUsers = sortedUsers.slice(startIndex, endIndex);
        return right(paginatedUsers);
      }

      // Apply OR logic: user matches if ANY filter condition is met
      filteredUsers = filteredUsers.filter((user) => {
        // Check if user matches any of the filter conditions (OR logic)
        let matches = false;

        // Apply name filter (case insensitive partial match)
        if (
          filters.name &&
          user.name.toLowerCase().includes(filters.name.toLowerCase())
        ) {
          matches = true;
        }

        // Apply email filter (case insensitive partial match)
        if (
          filters.email &&
          user.email.value.toLowerCase().includes(filters.email.toLowerCase())
        ) {
          matches = true;
        }

        // Apply nationalId filter (partial match)
        if (filters.nationalId && user.nationalId.value.includes(filters.nationalId)) {
          matches = true;
        }

        return matches;
      });

      // Sort by createdAt descending (newest first)
      const sortedUsers = filteredUsers.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

      return right(paginatedUsers);
    } catch (error) {
      return left(new Error('Failed to search users'));
    }
  }

  async delete(user: User): Promise<Either<Error, void>> {
    this.items = this.items.filter(
      (item) => item.id.toString() !== user.id.toString(),
    );
    return right(undefined);
  }

  async save(user: User): Promise<Either<Error, void>> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === user.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = user;
      return right(undefined);
    }
    return left(new ResourceNotFoundError('User not found'));
  }

  async count(): Promise<Either<Error, number>> {
    return right(this.items.length);
  }

  async findByCriteria(criteria: UserCriteria): Promise<Either<Error, User[]>> {
    try {
      // For in-memory implementation, we need to interpret the criteria
      const query = criteria.build();
      let result = [...this.items];

      // Apply where conditions
      if (query.where) {
        result = result.filter(user => this.matchesConditions(user, query.where));
      }

      // Apply ordering
      if (query.orderBy) {
        const field = Object.keys(query.orderBy)[0];
        const direction = query.orderBy[field];
        result = this.sortUsers(result, field, direction);
      }

      // Apply pagination
      if (query.skip !== undefined && query.take !== undefined) {
        result = result.slice(query.skip, query.skip + query.take);
      }

      return right(result);
    } catch (error) {
      return left(new Error('Failed to find users by criteria'));
    }
  }

  async countByCriteria(criteria: UserCriteria): Promise<Either<Error, number>> {
    try {
      const query = criteria.build();
      let result = [...this.items];

      // Apply where conditions only
      if (query.where) {
        result = result.filter(user => this.matchesConditions(user, query.where));
      }

      return right(result.length);
    } catch (error) {
      return left(new Error('Failed to count users by criteria'));
    }
  }

  private matchesConditions(user: User, conditions: any): boolean {
    // Handle AND conditions
    if (conditions.AND) {
      return conditions.AND.every((cond: any) => this.matchesConditions(user, cond));
    }

    // Handle OR conditions
    if (conditions.OR) {
      return conditions.OR.some((cond: any) => this.matchesConditions(user, cond));
    }

    // Handle individual conditions
    for (const [field, value] of Object.entries(conditions)) {
      if (!this.matchesFieldCondition(user, field, value)) {
        return false;
      }
    }

    return true;
  }

  private matchesFieldCondition(user: User, field: string, condition: any): boolean {
    const userValue = this.getUserFieldValue(user, field);

    // Handle different condition types
    if (typeof condition === 'object' && condition !== null) {
      if ('contains' in condition) {
        const searchValue = condition.contains.toLowerCase();
        const fieldValue = String(userValue).toLowerCase();
        return fieldValue.includes(searchValue);
      }
      if ('in' in condition) {
        return condition.in.includes(userValue);
      }
      if ('gte' in condition) {
        return userValue >= condition.gte;
      }
      if ('lte' in condition) {
        return userValue <= condition.lte;
      }
    }

    // Direct equality
    return userValue === condition;
  }

  private getUserFieldValue(user: User, field: string): any {
    switch (field) {
      case 'name': return user.name;
      case 'email': return user.email.value;
      case 'nationalId': return user.nationalId.value;
      case 'role': return user.role;
      case 'createdAt': return user.createdAt;
      case 'lastLogin': return user.lastLogin;
      default: return (user as any)[field];
    }
  }

  private sortUsers(users: User[], field: string, direction: 'asc' | 'desc'): User[] {
    return users.sort((a, b) => {
      const aValue = this.getUserFieldValue(a, field);
      const bValue = this.getUserFieldValue(b, field);
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
}
