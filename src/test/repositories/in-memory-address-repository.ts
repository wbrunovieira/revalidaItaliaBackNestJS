import { Either, right } from '@/core/either'
import { IAddressRepository } from '@/domain/auth/application/repositories/i-address-repository'
import { Address } from '@/domain/auth/enterprise/entities/address.entity'

export class InMemoryAddressRepository implements IAddressRepository {
  public items: Address[] = []

  async create(address: Address): Promise<Either<Error, void>> {
    this.items.push(address)
    return right(undefined)
  }

  async findByUserId(userId: string): Promise<Either<Error, Address[]>> {
    const addresses = this.items.filter(
      addr => addr.userId.toString() === userId
    )
    return right(addresses)
  }
}