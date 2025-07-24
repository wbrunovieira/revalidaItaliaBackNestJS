// src/domain/auth/application/repositories/i-address-repository.ts
import { Either } from '@/core/either';
import { Address } from '@/domain/auth/enterprise/entities/address.entity';

export abstract class IAddressRepository {
  abstract create(address: Address): Promise<Either<Error, void>>;
  abstract findByProfileId(
    profileId: string,
  ): Promise<Either<Error, Address[]>>;
  abstract findById(id: string): Promise<Either<Error, Address | undefined>>;
  abstract update(addr: Address): Promise<Either<Error, void>>;
  abstract delete(id: string): Promise<Either<Error, void>>;
}
