// src/domain/auth/application/use-cases/list-users.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryAccountRepository } from '@/test/repositories/in-memory-account-repository';
import { User } from '@/domain/auth/enterprise/entities/user.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { RepositoryError } from '@/domain/auth/application/use-cases/errors/repository-error';
import { left, right } from '@/core/either';
import { ListUsersUseCase } from './list-users.use-case';

describe('ListUsersUseCase', () => {
  let repo: InMemoryAccountRepository;
  let useCase: ListUsersUseCase;

  beforeEach(() => {
    repo = new InMemoryAccountRepository();
    useCase = new ListUsersUseCase(repo as any);
  });

  describe('when listing users', () => {
    it('should return empty list when no users exist', async () => {
      const result = await useCase.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toEqual([]);
        expect(result.value.pagination).toMatchObject({
          page: 1,
          pageSize: 20,
        });
      }
    });

    it('should return all user data except sensitive information', async () => {
      const user = User.create(
        {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'super_secret_password_hash',
          cpf: '12345678900',
          phone: '11999999999',
          profileImageUrl: 'https://example.com/avatar.jpg',
          paymentToken: 'payment_token_secret',
          birthDate: new Date('1990-01-01'),
          role: 'student',
        },
        new UniqueEntityID('user-1'),
      );

      repo.items.push(user);

      const result = await useCase.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const returnedUser = result.value.users[0];

        // Should include public data
        expect(returnedUser).toMatchObject({
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          cpf: '12345678900',
          phone: '11999999999',
          profileImageUrl: 'https://example.com/avatar.jpg',
          role: 'student',
        });

        // Should never expose sensitive data
        expect(returnedUser).not.toHaveProperty('password');
        expect(returnedUser).not.toHaveProperty('paymentToken');

        // Should include timestamps
        expect(returnedUser.createdAt).toBeInstanceOf(Date);
        expect(returnedUser.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should handle users with minimal required fields only', async () => {
      const minimalUser = User.create({
        name: 'Minimal User',
        email: 'minimal@example.com',
        password: 'password',
        cpf: '00000000000',
        role: 'student',
      });

      repo.items.push(minimalUser);

      const result = await useCase.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const user = result.value.users[0];
        expect(user.phone).toBeUndefined();
        expect(user.profileImageUrl).toBeUndefined();
        expect(user.name).toBe('Minimal User');
      }
    });

    it('should preserve the order of users from repository', async () => {
      const users = ['Charlie', 'Alice', 'Bob'].map((name, index) =>
        User.create(
          {
            name,
            email: `${name.toLowerCase()}@example.com`,
            password: 'password',
            cpf: `0000000000${index}`,
            role: 'student',
          },
          new UniqueEntityID(`user-${index}`),
        ),
      );

      repo.items.push(...users);

      const result = await useCase.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const names = result.value.users.map((u) => u.name);
        expect(names).toEqual(['Charlie', 'Alice', 'Bob']);
      }
    });
  });

  describe('pagination behavior', () => {
    beforeEach(() => {
      // Create 25 test users
      for (let i = 1; i <= 25; i++) {
        repo.items.push(
          User.create(
            {
              name: `User ${i.toString().padStart(2, '0')}`,
              email: `user${i}@example.com`,
              password: 'password',
              cpf: `${i.toString().padStart(11, '0')}`,
              role: 'student',
            },
            new UniqueEntityID(`user-${i}`),
          ),
        );
      }
    });

    it('should use default pagination values when not provided', async () => {
      const result = await useCase.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.pagination).toEqual({
          page: 1,
          pageSize: 20,
        });
        expect(result.value.users).toHaveLength(20);
      }
    });

    it('should respect custom pagination parameters', async () => {
      const result = await useCase.execute({ page: 2, pageSize: 10 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.pagination).toEqual({
          page: 2,
          pageSize: 10,
        });
        expect(result.value.users).toHaveLength(10);
      }
    });

    it('should handle last page with fewer items than pageSize', async () => {
      const result = await useCase.execute({ page: 3, pageSize: 10 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(5); // 25 total, page 3 with size 10
      }
    });

    it('should return empty list when page exceeds total pages', async () => {
      const result = await useCase.execute({ page: 10, pageSize: 20 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(0);
        expect(result.value.pagination.page).toBe(10);
      }
    });

    it('should handle edge case of exactly pageSize items', async () => {
      const result = await useCase.execute({ page: 1, pageSize: 25 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(25);
      }
    });
  });

  describe('edge cases and invalid inputs', () => {
    it('should handle negative page number by using default', async () => {
      const result = await useCase.execute({ page: -1, pageSize: 10 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.pagination.page).toBe(1); // Should default to 1
      }
    });

    it('should handle zero page number by using default', async () => {
      const result = await useCase.execute({ page: 0, pageSize: 10 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.pagination.page).toBe(1); // Should default to 1
      }
    });

    it('should handle negative pageSize by using default', async () => {
      const result = await useCase.execute({ page: 1, pageSize: -10 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.pagination.pageSize).toBe(20); // Should default to 20
      }
    });

    it('should handle zero pageSize by using default', async () => {
      const result = await useCase.execute({ page: 1, pageSize: 0 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.pagination.pageSize).toBe(20); // Should default to 20
      }
    });

    it('should handle very large page numbers gracefully', async () => {
      const result = await useCase.execute({
        page: Number.MAX_SAFE_INTEGER,
        pageSize: 20,
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(0);
        expect(result.value.pagination.page).toBe(Number.MAX_SAFE_INTEGER);
      }
    });

    it('should handle undefined request object', async () => {
      const result = await useCase.execute(undefined);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.pagination).toEqual({
          page: 1,
          pageSize: 20,
        });
      }
    });

    it('should handle partial request objects', async () => {
      const resultPageOnly = await useCase.execute({ page: 2 });
      const resultSizeOnly = await useCase.execute({ pageSize: 5 });

      expect(resultPageOnly.isRight()).toBe(true);
      expect(resultSizeOnly.isRight()).toBe(true);

      if (resultPageOnly.isRight()) {
        expect(resultPageOnly.value.pagination).toEqual({
          page: 2,
          pageSize: 20,
        });
      }

      if (resultSizeOnly.isRight()) {
        expect(resultSizeOnly.value.pagination).toEqual({
          page: 1,
          pageSize: 5,
        });
      }
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      vi.spyOn(repo, 'findAll').mockResolvedValueOnce(
        left(new Error('Database connection failed')),
      );

      const result = await useCase.execute();

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Database connection failed');
      }
    });

    it('should handle repository exceptions', async () => {
      vi.spyOn(repo, 'findAll').mockImplementationOnce(() => {
        throw new Error('Unexpected database error');
      });

      const result = await useCase.execute();

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Unexpected database error');
      }
    });

    it('should handle non-Error exceptions with default message', async () => {
      vi.spyOn(repo, 'findAll').mockImplementationOnce(() => {
        throw 'String error'; // Non-Error thrown
      });

      const result = await useCase.execute();

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to list users');
      }
    });

    it('should not leak internal errors to response', async () => {
      vi.spyOn(repo, 'findAll').mockImplementationOnce(() => {
        throw new Error('SELECT * FROM users WHERE password = "leaked"');
      });

      const result = await useCase.execute();

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        // Should wrap the error, not expose SQL
        expect(result.value.message).not.toContain('SELECT');
        expect(result.value.message).not.toContain('password');
      }
    });
  });

  describe('repository integration', () => {
    it('should pass pagination params correctly to repository', async () => {
      const findAllSpy = vi.spyOn(repo, 'findAll');

      await useCase.execute({ page: 3, pageSize: 15 });

      expect(findAllSpy).toHaveBeenCalledWith({
        page: 3,
        pageSize: 15,
      });
    });

    it('should handle repository returning right with empty array', async () => {
      vi.spyOn(repo, 'findAll').mockResolvedValueOnce(right([]));

      const result = await useCase.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toEqual([]);
      }
    });
  });
});
