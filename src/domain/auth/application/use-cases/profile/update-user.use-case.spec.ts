// src/domain/auth/application/use-cases/update-user.use-case.spec.ts
import { vi } from 'vitest';
import { left } from '@/core/either';
import { User } from '@/domain/auth/enterprise/entities/user.entity';
import { InMemoryUserRepository } from '@/test/repositories/in-memory-account-repository';
import { UpdateUserUseCase } from './update-user.use-case';
import {
  InvalidInputError,
  ResourceNotFoundError,
  DuplicateEmailError,
  DuplicateNationalIdError,
  RepositoryError,
} from '@/domain/auth/domain/exceptions';

describe('UpdateUserUseCase', () => {
  let repo: InMemoryUserRepository;
  let sut: UpdateUserUseCase;
  let existingUser: User;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    sut = new UpdateUserUseCase(repo);

    existingUser = User.create(
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'irrelevantHash',
        nationalId: '12345678900',

        role: 'student',
      },
      existingUser?.id?.toString(),
    );
    repo.items.push(existingUser);
  });

  it('should reject when no updatable field is provided', async () => {
    const result = await sut.execute({ id: existingUser.id.toString() });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
      expect(result.value.message).toContain('Missing required fields');
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
    const other = User.create(
      {
        name: 'Jane',
        email: 'jane@conflict.com',
        password: 'irrelevantHash',
        nationalId: '09876543210',
        role: 'student',
      },
      'other-id',
    );
    repo.items.push(other);

    const result = await sut.execute({
      id: existingUser.id.toString(),
      email: 'jane@conflict.com',
    });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DuplicateEmailError);
      expect(result.value.message).toContain('already');
    }
  });

  it('should reject duplicate nationalId', async () => {
    const other = User.create(
      {
        name: 'Jane',
        email: 'jane@example.com',
        password: 'irrelevantHash',
        nationalId: '09876543210',
        role: 'student',
      },
      'other-id-2',
    );
    repo.items.push(other);

    const result = await sut.execute({
      id: existingUser.id.toString(),
      nationalId: '09876543210',
    });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DuplicateNationalIdError);
      expect(result.value.message).toContain('already');
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
      expect(result.value.message).toContain('Repository operation failed');
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
      expect(repo.items[0].email.value).toBe('new@example.com');
      expect(repo.items[0].role).toBe('tutor');

      expect(result.value.user.name).toBe('New Name');
      expect(result.value.user.email).toBe('new@example.com');
      expect(result.value.user.role).toBe('tutor');
    }
  });
});
