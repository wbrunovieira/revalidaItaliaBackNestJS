// test/unit/domain/auth/application/use-cases/search-users.use-case.with-in-memory.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';

import { InMemoryAccountRepository } from '@/test/repositories/in-memory-account-repository';
import { User } from '@/domain/auth/enterprise/entities/user.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { FindUsersUseCase } from './find-users.use-case';

describe('FindUsersUseCase with InMemoryRepository', () => {
  let useCase: FindUsersUseCase;
  let repository: InMemoryAccountRepository;

  beforeEach(() => {
    repository = new InMemoryAccountRepository();
    useCase = new FindUsersUseCase(repository);
  });

  const createUser = (overrides = {}) => {
    const defaults = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedpassword',
      cpf: '12345678900',
      phone: '11999999999',
      profileImageUrl: 'https://example.com/john.jpg',
      role: 'student' as const,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    return User.create({ ...defaults, ...overrides }, new UniqueEntityID());
  };

  describe('Integration tests with real data', () => {
    it('should search users by name successfully', async () => {
      // Arrange - Create test users
      const user1 = createUser({
        name: 'Alice Smith',
        email: 'alice@example.com',
        cpf: '11111111111',
      });

      const user2 = createUser({
        name: 'Bob Johnson',
        email: 'bob@example.com',
        cpf: '22222222222',
      });

      const user3 = createUser({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        cpf: '33333333333',
      });

      // Add users to repository
      await repository.create(user1);
      await repository.create(user2);
      await repository.create(user3);

      // Act - Search for users with 'Alice' in name
      const result = await useCase.execute({
        name: 'Alice',
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;
        expect(response.users).toHaveLength(1);
        expect(response.users[0].name).toBe('Alice Smith');
        expect(response.users[0].email).toBe('alice@example.com');
        expect(response.pagination.page).toBe(1);
        expect(response.pagination.pageSize).toBe(10);
      }
    });

    it('should search users by email successfully', async () => {
      // Arrange
      const user1 = createUser({
        name: 'Test User 1',
        email: 'test1@gmail.com',
        cpf: '11111111111',
      });

      const user2 = createUser({
        name: 'Test User 2',
        email: 'test2@yahoo.com',
        cpf: '22222222222',
      });

      await repository.create(user1);
      await repository.create(user2);

      // Act - Search for users with 'gmail' in email
      const result = await useCase.execute({
        email: 'gmail',
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;
        expect(response.users).toHaveLength(1);
        expect(response.users[0].email).toBe('test1@gmail.com');
      }
    });

    it('should search users by CPF successfully', async () => {
      // Arrange
      const user1 = createUser({
        name: 'CPF User 1',
        email: 'cpf1@example.com',
        cpf: '12345678900',
      });

      const user2 = createUser({
        name: 'CPF User 2',
        email: 'cpf2@example.com',
        cpf: '98765432100',
      });

      await repository.create(user1);
      await repository.create(user2);

      // Act - Search for users with '123' in CPF
      const result = await useCase.execute({
        cpf: '123',
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;
        expect(response.users).toHaveLength(1);
        expect(response.users[0].cpf).toBe('12345678900');
      }
    });

    it('should search with multiple filters (OR logic)', async () => {
      // Arrange
      const user1 = createUser({
        name: 'Alice Smith',
        email: 'alice@example.com',
        cpf: '11111111111',
      });

      const user2 = createUser({
        name: 'Bob Johnson',
        email: 'test@gmail.com',
        cpf: '22222222222',
      });

      const user3 = createUser({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        cpf: '12345678900',
      });

      await repository.create(user1);
      await repository.create(user2);
      await repository.create(user3);

      // Act - Search for users with 'Alice' in name OR 'gmail' in email OR '123' in CPF
      const result = await useCase.execute({
        name: 'Alice',
        email: 'gmail',
        cpf: '123',
        page: 1,
        pageSize: 10,
      });

      // Assert - Should find all 3 users (Alice by name, Bob by email, Charlie by CPF)
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;
        expect(response.users).toHaveLength(3);

        const names = response.users.map((u) => u.name).sort();
        expect(names).toEqual(['Alice Smith', 'Bob Johnson', 'Charlie Brown']);
      }
    });

    it('should return empty array when no matches found', async () => {
      // Arrange
      const user1 = createUser({
        name: 'Alice Smith',
        email: 'alice@example.com',
        cpf: '11111111111',
      });

      await repository.create(user1);

      // Act - Search for non-existent user
      const result = await useCase.execute({
        name: 'NonExistent',
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;
        expect(response.users).toHaveLength(0);
      }
    });

    it('should handle pagination correctly', async () => {
      // Arrange - Create 5 users
      for (let i = 1; i <= 5; i++) {
        const user = createUser({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          cpf: `1111111111${i}`,
          createdAt: new Date(`2024-01-0${i}`), // Different creation dates
        });
        await repository.create(user);
      }

      // Act - Get first page with 2 items per page
      const result = await useCase.execute({
        page: 1,
        pageSize: 2,
      });

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;
        expect(response.users).toHaveLength(2);
        expect(response.pagination.page).toBe(1);
        expect(response.pagination.pageSize).toBe(2);

        // Should be sorted by createdAt desc (newest first)
        expect(response.users[0].name).toBe('User 5');
        expect(response.users[1].name).toBe('User 4');
      }
    });

    it('should handle case insensitive search', async () => {
      // Arrange
      const user = createUser({
        name: 'Alice Smith',
        email: 'ALICE@EXAMPLE.COM',
        cpf: '11111111111',
      });

      await repository.create(user);

      // Act - Search with different case
      const result = await useCase.execute({
        name: 'alice',
        email: 'alice@example.com',
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;
        expect(response.users).toHaveLength(1);
        expect(response.users[0].name).toBe('Alice Smith');
      }
    });

    it('should handle empty filters correctly', async () => {
      // Arrange
      const user1 = createUser({
        name: 'User 1',
        email: 'user1@example.com',
        cpf: '11111111111',
      });

      const user2 = createUser({
        name: 'User 2',
        email: 'user2@example.com',
        cpf: '22222222222',
      });

      await repository.create(user1);
      await repository.create(user2);

      // Act - Search with empty filters
      const result = await useCase.execute({
        name: '',
        email: '   ',
        cpf: '',
        page: 1,
        pageSize: 10,
      });

      // Assert - Should return all users when no valid filters
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;
        expect(response.users).toHaveLength(2);
      }
    });

    it('should handle edge cases with pagination', async () => {
      // Arrange
      const user = createUser({
        name: 'Test User',
        email: 'test@example.com',
        cpf: '11111111111',
      });

      await repository.create(user);

      // Act - Request page beyond available data
      const result = await useCase.execute({
        page: 10,
        pageSize: 10,
      });

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;
        expect(response.users).toHaveLength(0); // No users on page 10
        expect(response.pagination.page).toBe(10);
        expect(response.pagination.pageSize).toBe(10);
      }
    });
  });
});
