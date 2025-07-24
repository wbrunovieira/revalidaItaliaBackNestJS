// src/test/repositories/in-memory-user-identity-repository.ts
import { Either, left, right } from '@/core/either';
import { IUserIdentityRepository } from '@/domain/auth/application/repositories/i-user-identity-repository';
import { UserIdentity } from '@/domain/auth/enterprise/entities/user-identity';
import { Email } from '@/domain/auth/enterprise/value-objects/email.vo';

export class InMemoryUserIdentityRepository extends IUserIdentityRepository {
  public items: UserIdentity[] = [];

  async create(userIdentity: UserIdentity): Promise<Either<Error, void>> {
    this.items.push(userIdentity);
    return right(undefined);
  }

  async save(userIdentity: UserIdentity): Promise<Either<Error, void>> {
    const index = this.items.findIndex((item) =>
      item.id.equals(userIdentity.id),
    );

    if (index >= 0) {
      this.items[index] = userIdentity;
    } else {
      this.items.push(userIdentity);
    }

    return right(undefined);
  }

  async findById(id: string): Promise<Either<Error, UserIdentity | null>> {
    const userIdentity = this.items.find((item) => item.id.toString() === id);
    return right(userIdentity || null);
  }

  async findByEmail(email: Email): Promise<Either<Error, UserIdentity | null>> {
    const userIdentity = this.items.find((item) => item.email.equals(email));
    return right(userIdentity || null);
  }

  async findByEmailVerificationToken(
    token: string,
  ): Promise<Either<Error, UserIdentity | null>> {
    const userIdentity = this.items.find(
      (item) => item.emailVerificationToken === token,
    );
    return right(userIdentity || null);
  }

  async findByPasswordResetToken(
    token: string,
  ): Promise<Either<Error, UserIdentity | null>> {
    const userIdentity = this.items.find(
      (item) => item.passwordResetToken === token,
    );
    return right(userIdentity || null);
  }

  async emailExists(email: Email): Promise<Either<Error, boolean>> {
    const exists = this.items.some((item) => item.email.equals(email));
    return right(exists);
  }

  async delete(id: string): Promise<Either<Error, void>> {
    this.items = this.items.filter((item) => item.id.toString() !== id);
    return right(undefined);
  }
}
