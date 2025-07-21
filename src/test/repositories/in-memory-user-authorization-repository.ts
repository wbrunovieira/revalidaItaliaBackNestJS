// src/test/repositories/in-memory-user-authorization-repository.ts
import { Either, left, right } from '@/core/either';
import { IUserAuthorizationRepository } from '@/domain/auth/application/repositories/i-user-authorization-repository';
import { UserAuthorization, UserRole } from '@/domain/auth/enterprise/entities/user-authorization';

export class InMemoryUserAuthorizationRepository extends IUserAuthorizationRepository {
  public items: UserAuthorization[] = [];

  async create(userAuthorization: UserAuthorization): Promise<Either<Error, void>> {
    this.items.push(userAuthorization);
    return right(undefined);
  }

  async save(userAuthorization: UserAuthorization): Promise<Either<Error, void>> {
    const index = this.items.findIndex(item => item.identityId.toString() === userAuthorization.identityId.toString());
    
    if (index >= 0) {
      this.items[index] = userAuthorization;
    } else {
      this.items.push(userAuthorization);
    }
    
    return right(undefined);
  }

  async findByIdentityId(identityId: string): Promise<Either<Error, UserAuthorization | null>> {
    const userAuthorization = this.items.find(item => item.identityId.toString() === identityId);
    return right(userAuthorization || null);
  }

  async findById(id: string): Promise<Either<Error, UserAuthorization | null>> {
    const userAuthorization = this.items.find(item => item.id.toString() === id);
    return right(userAuthorization || null);
  }

  async findByRole(role: UserRole): Promise<Either<Error, UserAuthorization[]>> {
    const authorizations = this.items.filter(item => item.role === role);
    return right(authorizations);
  }

  async findActive(): Promise<Either<Error, UserAuthorization[]>> {
    const now = new Date();
    const activeAuthorizations = this.items.filter(item => {
      const isAfterEffectiveFrom = !item.effectiveFrom || item.effectiveFrom <= now;
      const isBeforeEffectiveUntil = !item.effectiveUntil || item.effectiveUntil > now;
      return isAfterEffectiveFrom && isBeforeEffectiveUntil;
    });
    return right(activeAuthorizations);
  }

  async findExpired(): Promise<Either<Error, UserAuthorization[]>> {
    const now = new Date();
    const expiredAuthorizations = this.items.filter(item => 
      item.effectiveUntil && item.effectiveUntil <= now
    );
    return right(expiredAuthorizations);
  }

  async delete(id: string): Promise<Either<Error, void>> {
    this.items = this.items.filter(item => item.id.toString() !== id);
    return right(undefined);
  }
}