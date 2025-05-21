
import { compare } from 'bcryptjs'
import { left } from '@/core/either'
import { InMemoryAccountRepository } from '@/test/repositories/in-Memory-account-repository'
import {
  CreateAccountUseCase,

} from './create-account.use-case'

import { InvalidInputError } from './errors/invalid-input-error'
import { DuplicateEmailError } from './errors/duplicate-email-error'
import { RepositoryError } from './errors/repository-error'
import { CreateAccountRequest } from '../dtos/create-account-request.dto'

let repo: InMemoryAccountRepository
let sut: CreateAccountUseCase
let defaultDto: CreateAccountRequest

describe('CreateAccountUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryAccountRepository()
    sut  = new CreateAccountUseCase(repo, 8)
    defaultDto = {
      name:     'John Doe',
      email:    'john@example.com',
      password: 'securepassword',
      role:     'student',
      cpf:      '12345678900',
    }
  })

  it('should be able to create an account', async () => {
    const result = await sut.execute(defaultDto)
    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(repo.items[0].toResponseObject()).toEqual(result.value.user)
    }
  })

  it('should hash the password before storing', async () => {
    const result = await sut.execute(defaultDto)
    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const stored = repo.items[0] as any
      const hashed = stored.props.password
      expect(await compare(defaultDto.password, hashed)).toBe(true)
    }
  })

  it('should allow name with exactly 3 characters', async () => {
    const dto = { ...defaultDto, name: 'Tom' }
    const result = await sut.execute(dto)
    expect(result.isRight()).toBe(true)
  })

  it('should allow password with exactly 6 characters', async () => {
    const dto = { ...defaultDto, password: '123456' }
    const result = await sut.execute(dto)
    expect(result.isRight()).toBe(true)
  })

  it('should reject invalid email format', async () => {
    const dto = { ...defaultDto, email: 'foo@' }
    const result = await sut.execute(dto)
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError)
      expect(result.value.message).toBe('Invalid email address')
    }
  })

  it('should reject invalid CPF format', async () => {
    const dto = { ...defaultDto, cpf: '123' }
    const result = await sut.execute(dto)
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError)
      expect(result.value.message).toBe('CPF must be 11 digits')
    }
  })

  it('should reject invalid role value', async () => {
    const dto = { ...defaultDto, role: 'manager' as any }
    const result = await sut.execute(dto as any)
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError)
      expect(result.value.message).toMatch(/Invalid enum value/)
    }
  })

  it('should not be able to create an account with a duplicate email', async () => {
    // first creation
    await sut.execute(defaultDto)
    const result = await sut.execute(defaultDto)
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DuplicateEmailError)
      expect(result.value.message).toBe('User already exists')
    }
  })

  it('should handle repository create returning Left', async () => {
    vi.spyOn(repo, 'create').mockResolvedValueOnce(left(new Error('DB down')))
    const result = await sut.execute(defaultDto)
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError)
      expect(result.value.message).toBe('DB down')
    }
  })

  it('should handle errors thrown by the repository', async () => {
    vi.spyOn(repo, 'create').mockImplementationOnce(() => {
      throw new Error('Repository thrown')
    })
    const result = await sut.execute(defaultDto)
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError)
      expect(result.value.message).toBe('Repository thrown')
    }
  })
})
