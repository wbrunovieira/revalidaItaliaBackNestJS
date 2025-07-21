//src/domain/auth/application/use-cases/create-user.spec.ts
import { compare } from 'bcryptjs';
import { left } from '@/core/either';
import { InMemoryUserRepository } from '@/test/repositories/in-memory-account-repository';
import { CreateUserUseCase } from './create-user.use-case';
import { ConfigService } from '@nestjs/config';
import { InvalidInputError, DuplicateEmailError, DuplicateNationalIdError, RepositoryError } from '@/domain/auth/domain/exceptions';
import { CreateUserRequest } from '../dtos/create-user-request.dto';
import { vi } from 'vitest';

let repo: InMemoryUserRepository;
let sut: CreateUserUseCase;
let configService: ConfigService;
let defaultDto: CreateUserRequest;

describe('CreateUserUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryUserRepository();
    configService = new ConfigService({ crypto: { saltRounds: 8 } });
    sut = new CreateUserUseCase(repo, configService);
    defaultDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Secure1@',
      role: 'student',
      nationalId: '12345678900',
      source: 'admin',
    };
  });

  it('should be able to create a user', async () => {
    const result = await sut.execute(defaultDto);
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(repo.items[0].id.toString()).toBeTruthy();
      expect(repo.items[0].name).toEqual(defaultDto.name);
      expect(repo.items[0].email.value).toEqual(defaultDto.email);
    }
  });

  it('should hash the password before storing', async () => {
    const result = await sut.execute(defaultDto);
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const stored = repo.items[0];
      const isValid = await stored.password.compare(defaultDto.password);
      expect(isValid).toBe(true);
    }
  });

  it('should allow name with exactly 3 characters', async () => {
    const dto = { ...defaultDto, name: 'Tom' };
    const result = await sut.execute(dto);
    expect(result.isRight()).toBe(true);
  });

  it('should allow password with exactly 6 characters', async () => {
    const dto = { ...defaultDto, password: 'Ab1@c2' };
    const result = await sut.execute(dto);
    expect(result.isRight()).toBe(true);
  });

  it('should reject invalid email format', async () => {
    const dto = { ...defaultDto, email: 'foo@' };
    const result = await sut.execute(dto);
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
      expect(result.value.message).toContain('Invalid');
    }
  });

  it('should reject invalid nationalId format', async () => {
    const dto = { ...defaultDto, nationalId: '123' };
    const result = await sut.execute(dto);
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
      expect(result.value.message).toContain('Invalid');
    }
  });

  it('should reject invalid role value', async () => {
    const dto = { ...defaultDto, role: 'manager' as any };
    const result = await sut.execute(dto as any);
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
      expect(result.value.message).toContain('Invalid');
    }
  });

  it('should not be able to create a user with a duplicate email', async () => {
    // first creation
    await sut.execute(defaultDto);
    const result = await sut.execute(defaultDto);
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DuplicateEmailError);
      expect(result.value.message).toContain('already');
    }
  });

  it('should not be able to create a user with a duplicate nationalId', async () => {
    // first creation
    await sut.execute(defaultDto);
    const dtoWithDifferentEmail = { ...defaultDto, email: 'different@example.com' };
    const result = await sut.execute(dtoWithDifferentEmail);
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DuplicateNationalIdError);
      expect(result.value.message).toContain('already');
    }
  });

  it('should handle repository create returning Left', async () => {
    vi.spyOn(repo, 'create').mockResolvedValueOnce(left(new Error('DB down')));
    const result = await sut.execute(defaultDto);
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect(result.value.message).toContain('Repository operation failed');
    }
  });

  it('should handle errors thrown by the repository', async () => {
    vi.spyOn(repo, 'create').mockImplementationOnce(() => {
      throw new Error('Repository thrown');
    });
    const result = await sut.execute(defaultDto);
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect(result.value.message).toContain('Repository operation failed');
    }
  });
});
