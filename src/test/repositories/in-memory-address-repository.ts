// src/test/repositories/in-memory-address-repository.ts
import { Either, right } from '@/core/either';
import { IAddressRepository } from '@/domain/auth/application/repositories/i-address-repository';
import { Address } from '@/domain/auth/enterprise/entities/address.entity';

export class InMemoryAddressRepository implements IAddressRepository {
  public items: Address[] = [];

  async create(address: Address): Promise<Either<Error, void>> {
    this.items.push(address);
    return right(undefined);
  }

  async findByProfileId(profileId: string): Promise<Either<Error, Address[]>> {
    return right(this.items.filter((a) => a.profileId.toString() === profileId));
  }

  async findById(id: string): Promise<Either<Error, Address | undefined>> {
    return right(this.items.find((a) => a.id.toString() === id));
  }

  async update(address: Address): Promise<Either<Error, void>> {
    const idx = this.items.findIndex((a) => a.id.equals(address.id));
    if (idx >= 0) this.items[idx] = address;
    return right(undefined);
  }

  async delete(id: string): Promise<Either<Error, void>> {
    const idx = this.items.findIndex((a) => a.id.toString() === id);
    if (idx >= 0) {
      this.items.splice(idx, 1);
    }
    return right(undefined);
  }
}
