// src/test/repositories/in-memory-user-profile-repository.ts
import { Either, left, right } from '@/core/either';
import { IUserProfileRepository } from '@/domain/auth/application/repositories/i-user-profile-repository';
import { UserProfile } from '@/domain/auth/enterprise/entities/user-profile';
import { NationalId } from '@/domain/auth/enterprise/value-objects/national-id.vo';
import { UserProfileCriteria } from '@/domain/auth/application/criteria/user-profile-criteria';

export class InMemoryUserProfileRepository extends IUserProfileRepository {
  public items: UserProfile[] = [];

  async create(userProfile: UserProfile): Promise<Either<Error, void>> {
    this.items.push(userProfile);
    return right(undefined);
  }

  async save(userProfile: UserProfile): Promise<Either<Error, void>> {
    const index = this.items.findIndex(item => item.identityId.toString() === userProfile.identityId.toString());
    
    if (index >= 0) {
      this.items[index] = userProfile;
    } else {
      this.items.push(userProfile);
    }
    
    return right(undefined);
  }

  async findByIdentityId(identityId: string): Promise<Either<Error, UserProfile | null>> {
    const userProfile = this.items.find(item => item.identityId.toString() === identityId);
    return right(userProfile || null);
  }

  async findById(id: string): Promise<Either<Error, UserProfile | null>> {
    const userProfile = this.items.find(item => item.id.toString() === id);
    return right(userProfile || null);
  }

  async findByNationalId(nationalId: NationalId): Promise<Either<Error, UserProfile | null>> {
    const userProfile = this.items.find(item => item.nationalId.equals(nationalId));
    return right(userProfile || null);
  }

  async nationalIdExists(nationalId: NationalId): Promise<Either<Error, boolean>> {
    const exists = this.items.some(item => item.nationalId.equals(nationalId));
    return right(exists);
  }

  async findByCriteria(criteria: UserProfileCriteria): Promise<Either<Error, UserProfile[]>> {
    // For now, just return all items as the criteria builder is complex
    // In a real implementation, we would parse the criteria.build() result
    return right([...this.items]);
  }

  async countByCriteria(criteria: UserProfileCriteria): Promise<Either<Error, number>> {
    const result = await this.findByCriteria(criteria);
    if (result.isLeft()) {
      return left(result.value);
    }
    return right(result.value.length);
  }

  async delete(id: string): Promise<Either<Error, void>> {
    this.items = this.items.filter(item => item.id.toString() !== id);
    return right(undefined);
  }
}