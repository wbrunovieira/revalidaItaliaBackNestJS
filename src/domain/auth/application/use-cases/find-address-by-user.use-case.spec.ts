// src/domain/auth/application/use-cases/find-address-by-user.use-case.spec.ts
import { vi } from 'vitest'
import { left } from '@/core/either'

import { FindAddressByUserUseCase, FindAddressRequest } from './find-address-by-user.use-case'
import { InvalidInputError } from './errors/invalid-input-error'
import { InMemoryAddressRepository } from '@/test/repositories/in-memory-address-repository'
import { Address } from '@/domain/auth/enterprise/entities/address.entity'
import { UniqueEntityID } from '@/core/unique-entity-id'

describe('FindAddressByUserUseCase', () => {
  let repo: InMemoryAddressRepository
  let sut: FindAddressByUserUseCase

  beforeEach(() => {
    repo = new InMemoryAddressRepository()
    sut  = new FindAddressByUserUseCase(repo)
  })

  it('should return addresses for valid userId', async () => {
    const userId = new UniqueEntityID()
  
    const addr1 = Address.create({
      userId,
      street: 'A',
      number: '1',
      city: 'C',
      country: 'X',
      postalCode: '000',
    })
    const addr2 = Address.create({
      userId,
      street: 'B',
      number: '2',
      city: 'D',
      country: 'Y',
      postalCode: '111',
    })
  
    repo.items.push(addr1, addr2)
  
    const result = await sut.execute({ userId: userId.toString() })
    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value).toEqual([addr1, addr2])
    }
  })

  it('should reject when userId is missing', async () => {
    const result = await sut.execute({ userId: '' })
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError)
      expect(result.value.message).toBe('Missing userId')
    }
  })

  it('should bubble up repository errors (returned Left)', async () => {
    const error = new Error('DB down')
    vi.spyOn(repo, 'findByUserId').mockResolvedValueOnce(left(error))

    const result = await sut.execute({ userId: 'user-1' })
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBe(error)
    }
  })

  it('should bubble up repository exceptions', async () => {
    vi.spyOn(repo, 'findByUserId').mockImplementationOnce(() => { throw new Error('Thrown') })
    const result = await sut.execute({ userId: 'user-1' })
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value.message).toBe('Thrown')
    }
  })
})