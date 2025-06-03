// src/domain/auth/application/use-cases/delete-address.use-case.spec.ts
import { vi } from 'vitest'
import { left, right } from '@/core/either'
import { DeleteAddressUseCase, DeleteAddressRequest } from './delete-address.use-case'
import { InvalidInputError } from './errors/invalid-input-error'
import { NotFoundError } from 'rxjs/internal/util/NotFoundError'

import { InMemoryAddressRepository } from '@/test/repositories/in-memory-address-repository'
import { Address } from '@/domain/auth/enterprise/entities/address.entity'
import { UniqueEntityID } from '@/core/unique-entity-id'

describe('DeleteAddressUseCase', () => {
  let repo: InMemoryAddressRepository
  let sut: DeleteAddressUseCase

  beforeEach(() => {
    repo = new InMemoryAddressRepository()
    sut = new DeleteAddressUseCase(repo)
  })

  it('deletes an address successfully', async () => {

    const userId = new UniqueEntityID('user-1')
    const address = Address.create({
      userId,
      street: 'Some Street',
      number: '100',
      city: 'CityX',
      country: 'CountryY',
      postalCode: '00000',
    })
    repo.items.push(address)

    const request: DeleteAddressRequest = { id: address.id.toString() }


    const result = await sut.execute(request)


    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(repo.items).toHaveLength(0)
    }
  })

  it('rejects when id is missing', async () => {
    const result = await sut.execute({ id: '' })
    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError)
      expect(result.value.message).toBe('Missing id')
    }
  })

  it('returns NotFoundError if the address does not exist', async () => {

    const result = await sut.execute({ id: 'nonexistent-id' })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotFoundError)
      expect(result.value.message).toBe('Address not found')
    }
  })

  it('bubbles up repository Left errors from findById', async () => {
    const dbError = new Error('DB connection failed')
    vi.spyOn(repo, 'findById').mockResolvedValueOnce(left(dbError))

    const result = await sut.execute({ id: 'any-id' })
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBe(dbError)
    }
  })

  it('bubbles up exceptions thrown by findById', async () => {
    vi.spyOn(repo, 'findById').mockImplementationOnce(() => {
      throw new Error('findById threw unexpectedly')
    })

    const result = await sut.execute({ id: 'any-id' })
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(Error)
      expect((result.value as Error).message).toBe('findById threw unexpectedly')
    }
  })

  it('bubbles up repository Left errors from delete', async () => {

    const userId = new UniqueEntityID('user-2')
    const address = Address.create({
      userId,
      street: 'Another Street',
      number: '200',
      city: 'CityY',
      country: 'CountryZ',
      postalCode: '11111',
    })
    repo.items.push(address)


    const dbError = new Error('Deletion failed')
    vi.spyOn(repo, 'delete').mockResolvedValueOnce(left(dbError))

    const result = await sut.execute({ id: address.id.toString() })
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBe(dbError)
    }
  })

  it('bubbles up exceptions thrown by delete', async () => {
    // Arrange: insiro um Address para que findById devolva algo
    const userId = new UniqueEntityID('user-3')
    const address = Address.create({
      userId,
      street: 'Third Street',
      number: '300',
      city: 'CityZ',
      country: 'CountryA',
      postalCode: '22222',
    })
    repo.items.push(address)


    vi.spyOn(repo, 'delete').mockImplementationOnce(() => {
      throw new Error('delete() threw unexpectedly')
    })

    const result = await sut.execute({ id: address.id.toString() })
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(Error)
      expect((result.value as Error).message).toBe('delete() threw unexpectedly')
    }
  })
})