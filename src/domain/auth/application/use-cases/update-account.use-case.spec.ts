// src/domain/auth/application/use-cases/update-account.use-case.spec.ts
import { vi } from 'vitest';
import { left } from '@/core/either';
import { User } from '@/domain/auth/enterprise/entities/user.entity';
import { InMemoryAccountRepository } from '@/test/repositories/in-memory-account-repository';
import { UpdateAccountUseCase } from './update-account.use-case';
import { InvalidInputError } from './errors/invalid-input-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { DuplicateEmailError } from './errors/duplicate-email-error';
import { DuplicateCPFError } from './errors/duplicate-cpf-error';
import { RepositoryError } from './errors/repository-error';

describe('UpdateAccountUseCase', () => {
  let repo: InMemoryAccountRepository;
  let sut: UpdateAccountUseCase;
  let existingUser: User;

  beforeEach(() => {
    repo = new InMemoryAccountRepository();
    sut = new UpdateAccountUseCase(repo);

    existingUser = User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'irrelevantHash',
      cpf: '12345678900',
      role: 'student',
    });
    repo.items.push(existingUser);
  });

  it('should reject when no updatable field is provided', async () => {
    const result = await sut.execute({ id: existingUser.id.toString() });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
      expect(result.value.message).toBe('At least one field must be provided');
    }
  });

  it('should reject when user not found', async () => {
    const result = await sut.execute({ id: 'nonexistent-id', name: 'X' });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      expect(result.value.message).toContain('not found');
    }
  });

  it('should reject duplicate email', async () => {
    const other = User.create({
      name: 'Jane',
      email: 'jane@conflict.com',
      password: 'irrelevantHash',
      cpf: '09876543210',
      role: 'student',
    });
    repo.items.push(other);

    const result = await sut.execute({
      id: existingUser.id.toString(),
      email: 'jane@conflict.com',
    });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DuplicateEmailError);
      expect(result.value.message).toContain('already exists');
    }
  });

  it('should reject duplicate cpf', async () => {
    const other = User.create({
      name: 'Jane',
      email: 'jane@example.com',
      password: 'irrelevantHash',
      cpf: '09876543210',
      role: 'student',
    });
    repo.items.push(other);

    const result = await sut.execute({
      id: existingUser.id.toString(),
      cpf: '09876543210',
    });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DuplicateCPFError);
      expect(result.value.message).toContain('already exists');
    }
  });

  it('should handle repository errors', async () => {
    vi.spyOn(repo, 'save').mockResolvedValueOnce(left(new Error('DB down')));
    const result = await sut.execute({
      id: existingUser.id.toString(),
      name: 'New Name',
    });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect(result.value.message).toBe('DB down');
    }
  });

  it('should update successfully', async () => {
    const result = await sut.execute({
      id: existingUser.id.toString(),
      name: 'New Name',
      email: 'new@example.com',
      role: 'tutor',
    });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(repo.items[0].name).toBe('New Name');
      expect(repo.items[0].email).toBe('new@example.com');
      expect(repo.items[0].role).toBe('tutor');

      expect(result.value.user.name).toBe('New Name');
      expect(result.value.user.email).toBe('new@example.com');
      expect(result.value.user.role).toBe('tutor');
    }
  });
});
