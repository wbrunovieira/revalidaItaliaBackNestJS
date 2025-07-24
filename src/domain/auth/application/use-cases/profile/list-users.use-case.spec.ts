// src/domain/auth/application/use-cases/profile/list-users.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListUsersUseCase } from './list-users.use-case';
import { InMemoryUserAggregatedViewRepository } from '@/test/repositories/in-memory-user-aggregated-view-repository';
import { InvalidInputError, RepositoryError } from '@/domain/auth/domain/exceptions';
import { UserAggregatedView } from '../../repositories/i-user-aggregated-view-repository';
import { left, right } from '@/core/either';

describe('ListUsersUseCase', () => {
  let useCase: ListUsersUseCase;
  let viewRepo: InMemoryUserAggregatedViewRepository;

  beforeEach(() => {
    viewRepo = new InMemoryUserAggregatedViewRepository();
    useCase = new ListUsersUseCase(viewRepo);
  });

  describe('Success cases', () => {
    it('should list users with default pagination', async () => {
      // Arrange
      const users = createMockUsers(5);
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items).toHaveLength(5);
        expect(result.value.total).toBe(5);
        expect(result.value.page).toBe(1);
        expect(result.value.limit).toBe(10);
        expect(result.value.totalPages).toBe(1);
      }
    });

    it('should paginate results correctly', async () => {
      // Arrange
      const users = createMockUsers(25);
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const result = await useCase.execute({ page: 2, limit: 10 });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items).toHaveLength(10);
        expect(result.value.total).toBe(25);
        expect(result.value.page).toBe(2);
        expect(result.value.limit).toBe(10);
        expect(result.value.totalPages).toBe(3);
      }
    });

    it('should handle last page with fewer items', async () => {
      // Arrange
      const users = createMockUsers(23);
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const result = await useCase.execute({ page: 3, limit: 10 });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items).toHaveLength(3);
        expect(result.value.total).toBe(23);
        expect(result.value.page).toBe(3);
        expect(result.value.limit).toBe(10);
        expect(result.value.totalPages).toBe(3);
      }
    });

    it('should filter users by search term', async () => {
      // Arrange
      const users = [
        createMockUser('id1', 'john@example.com', 'John Doe'),
        createMockUser('id2', 'jane@example.com', 'Jane Smith'),
        createMockUser('id3', 'bob@example.com', 'Bob Johnson'),
      ];
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const result = await useCase.execute({ search: 'john' });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items).toHaveLength(2);
        expect(result.value.items[0].fullName).toBe('John Doe');
        expect(result.value.items[1].fullName).toBe('Bob Johnson');
      }
    });

    it('should filter users by role', async () => {
      // Arrange
      const users = [
        createMockUser('id1', 'admin@example.com', 'Admin User', 'admin'),
        createMockUser('id2', 'tutor@example.com', 'Tutor User', 'tutor'),
        createMockUser('id3', 'student@example.com', 'Student User', 'student'),
        createMockUser('id4', 'admin2@example.com', 'Admin User 2', 'admin'),
      ];
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const result = await useCase.execute({ role: 'admin' });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items).toHaveLength(2);
        expect(result.value.items.every(u => u.role === 'admin')).toBe(true);
      }
    });

    it('should filter users by profession', async () => {
      // Arrange
      const users = [
        { ...createMockUser('id1'), profession: 'Doctor' },
        { ...createMockUser('id2'), profession: 'Engineer' },
        { ...createMockUser('id3'), profession: 'Doctor' },
        { ...createMockUser('id4'), profession: 'Teacher' },
      ];
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const result = await useCase.execute({ profession: 'Doctor' });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items).toHaveLength(2);
        expect(result.value.items.every(u => u.profession === 'Doctor')).toBe(true);
      }
    });

    it('should sort users by specified field in ascending order', async () => {
      // Arrange
      const users = [
        createMockUser('id1', 'charlie@example.com', 'Charlie'),
        createMockUser('id2', 'alice@example.com', 'Alice'),
        createMockUser('id3', 'bob@example.com', 'Bob'),
      ];
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const result = await useCase.execute({ orderBy: 'fullName', order: 'asc' });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items[0].fullName).toBe('Alice');
        expect(result.value.items[1].fullName).toBe('Bob');
        expect(result.value.items[2].fullName).toBe('Charlie');
      }
    });

    it('should sort users by specified field in descending order', async () => {
      // Arrange
      const users = [
        createMockUser('id1', 'alice@example.com', 'Alice'),
        createMockUser('id2', 'charlie@example.com', 'Charlie'),
        createMockUser('id3', 'bob@example.com', 'Bob'),
      ];
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const result = await useCase.execute({ orderBy: 'email', order: 'desc' });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items[0].email).toBe('charlie@example.com');
        expect(result.value.items[1].email).toBe('bob@example.com');
        expect(result.value.items[2].email).toBe('alice@example.com');
      }
    });

    it('should handle empty results', async () => {
      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items).toHaveLength(0);
        expect(result.value.total).toBe(0);
        expect(result.value.totalPages).toBe(0);
      }
    });

    it('should combine multiple filters', async () => {
      // Arrange
      const users = [
        { ...createMockUser('id1', 'john@example.com', 'John Doe', 'admin'), profession: 'Doctor' },
        { ...createMockUser('id2', 'jane@example.com', 'Jane Doe', 'admin'), profession: 'Engineer' },
        { ...createMockUser('id3', 'jack@example.com', 'Jack Doe', 'student'), profession: 'Doctor' },
        { ...createMockUser('id4', 'jill@example.com', 'Jill Smith', 'admin'), profession: 'Doctor' },
      ];
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const result = await useCase.execute({ 
        search: 'doe',
        role: 'admin',
        profession: 'Doctor' 
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items).toHaveLength(1);
        expect(result.value.items[0].fullName).toBe('John Doe');
      }
    });

    it('should use default values when optional parameters are not provided', async () => {
      // Arrange
      const users = createMockUsers(5);
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.page).toBe(1);
        expect(result.value.limit).toBe(10);
      }
    });

    it('should map all user fields correctly', async () => {
      // Arrange
      const lastLogin = new Date();
      const createdAt = new Date();
      const user: UserAggregatedView = {
        identityId: 'id1',
        email: 'test@example.com',
        emailVerified: true,
        lastLogin,
        lockedUntil: null,
        profileId: 'profile1',
        fullName: 'Test User',
        nationalId: '12345678901',
        phone: '+1234567890',
        birthDate: new Date('1990-01-01'),
        profileImageUrl: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        profession: 'Software Engineer',
        specialization: 'Backend Development',
        preferredLanguage: 'en',
        timezone: 'UTC',
        authorizationId: 'auth1',
        role: 'admin',
        isActive: true,
        createdAt,
        updatedAt: null,
      };
      await viewRepo.create(user);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const item = result.value.items[0];
        expect(item.identityId).toBe('id1');
        expect(item.email).toBe('test@example.com');
        expect(item.emailVerified).toBe(true);
        expect(item.fullName).toBe('Test User');
        expect(item.nationalId).toBe('12345678901');
        expect(item.phone).toBe('+1234567890');
        expect(item.profileImageUrl).toBe('https://example.com/avatar.jpg');
        expect(item.bio).toBe('Test bio');
        expect(item.profession).toBe('Software Engineer');
        expect(item.specialization).toBe('Backend Development');
        expect(item.role).toBe('admin');
        expect(item.isActive).toBe(true);
        expect(item.lastLogin).toEqual(lastLogin);
        expect(item.createdAt).toEqual(createdAt);
      }
    });
  });

  describe('Error cases', () => {
    it('should return InvalidInputError for invalid page number', async () => {
      // Act
      const result = await useCase.execute({ page: 0 });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Validation failed');
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'min',
            message: 'page must not be less than 1',
            path: ['page'],
          });
        }
      }
    });

    it('should return InvalidInputError for negative page number', async () => {
      // Act
      const result = await useCase.execute({ page: -1 });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for invalid limit', async () => {
      // Act
      const result = await useCase.execute({ limit: 0 });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'min',
            message: 'limit must not be less than 1',
            path: ['limit'],
          });
        }
      }
    });

    it('should return InvalidInputError for limit exceeding maximum', async () => {
      // Act
      const result = await useCase.execute({ limit: 101 });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'max',
            message: 'limit must not be greater than 100',
            path: ['limit'],
          });
        }
      }
    });

    it('should return InvalidInputError for invalid order value', async () => {
      // Act
      const result = await useCase.execute({ order: 'invalid' as any });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'isIn',
            message: 'order must be one of the following values: asc, desc',
            path: ['order'],
          });
        }
      }
    });

    it('should return RepositoryError when repository fails', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      vi.spyOn(viewRepo, 'findForListing').mockResolvedValueOnce(left(error));

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        if (result.value instanceof RepositoryError) {
          expect(result.value.context.operation).toBe('listUsers');
        }
      }
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      vi.spyOn(viewRepo, 'findForListing').mockRejectedValueOnce(new Error('Unexpected error'));

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        if (result.value instanceof RepositoryError) {
          expect(result.value.context.operation).toBe('listUsers');
        }
      }
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      vi.spyOn(viewRepo, 'findForListing').mockRejectedValueOnce('String error');

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        if (result.value instanceof RepositoryError) {
          expect(result.value.message).toBe('Repository operation failed: listUsers');
        }
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle page beyond available data', async () => {
      // Arrange
      const users = createMockUsers(5);
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const result = await useCase.execute({ page: 10, limit: 10 });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items).toHaveLength(0);
        expect(result.value.page).toBe(10);
      }
    });

    it('should handle special characters in search', async () => {
      // Arrange
      const users = [
        createMockUser('id1', 'test@example.com', 'Test (Admin)'),
        createMockUser('id2', 'user@example.com', 'Regular User'),
      ];
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const result = await useCase.execute({ search: '(Admin)' });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items).toHaveLength(1);
        expect(result.value.items[0].fullName).toBe('Test (Admin)');
      }
    });

    it('should handle null values in user fields', async () => {
      // Arrange
      const user: UserAggregatedView = {
        identityId: 'id1',
        email: 'test@example.com',
        emailVerified: false,
        lastLogin: null,
        lockedUntil: null,
        profileId: 'profile1',
        fullName: 'Test User',
        nationalId: '12345678901',
        phone: null,
        birthDate: null,
        profileImageUrl: null,
        bio: null,
        profession: null,
        specialization: null,
        preferredLanguage: 'en',
        timezone: 'UTC',
        authorizationId: 'auth1',
        role: 'student',
        isActive: true,
        createdAt: new Date(),
        updatedAt: null,
      };
      await viewRepo.create(user);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const item = result.value.items[0];
        expect(item.phone).toBeNull();
        expect(item.profileImageUrl).toBeNull();
        expect(item.bio).toBeNull();
        expect(item.profession).toBeNull();
        expect(item.specialization).toBeNull();
        expect(item.lastLogin).toBeNull();
      }
    });

    it('should calculate totalPages correctly for exact division', async () => {
      // Arrange
      const users = createMockUsers(20);
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const result = await useCase.execute({ limit: 10 });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.totalPages).toBe(2);
      }
    });

    it('should handle empty search string', async () => {
      // Arrange
      const users = createMockUsers(3);
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const result = await useCase.execute({ search: '' });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items).toHaveLength(3);
      }
    });

    it('should handle whitespace-only search string', async () => {
      // Arrange
      const users = createMockUsers(3);
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const result = await useCase.execute({ search: '   ' });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Whitespace-only search should return empty results (no matches)
        expect(result.value.items).toHaveLength(0);
      }
    });
  });

  describe('Business rules', () => {
    it('should maintain data consistency in pagination', async () => {
      // Arrange
      const users = createMockUsers(25);
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act - Get all pages
      const page1 = await useCase.execute({ page: 1, limit: 10 });
      const page2 = await useCase.execute({ page: 2, limit: 10 });
      const page3 = await useCase.execute({ page: 3, limit: 10 });

      // Assert
      expect(page1.isRight() && page2.isRight() && page3.isRight()).toBe(true);
      if (page1.isRight() && page2.isRight() && page3.isRight()) {
        const allItems = [
          ...page1.value.items,
          ...page2.value.items,
          ...page3.value.items,
        ];
        expect(allItems).toHaveLength(25);
        // Check no duplicates
        const ids = allItems.map(item => item.identityId);
        expect(new Set(ids).size).toBe(25);
      }
    });

    it('should respect limit constraint', async () => {
      // Arrange
      const users = createMockUsers(50);
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const result = await useCase.execute({ limit: 25 });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.items.length).toBeLessThanOrEqual(25);
        expect(result.value.items).toHaveLength(25);
      }
    });

    it('should maintain consistent ordering across pages', async () => {
      // Arrange
      const users = Array.from({ length: 20 }, (_, i) => 
        createMockUser(`id${i}`, `user${i}@example.com`, `User ${String(i).padStart(2, '0')}`)
      );
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const page1 = await useCase.execute({ page: 1, limit: 10, orderBy: 'fullName', order: 'asc' });
      const page2 = await useCase.execute({ page: 2, limit: 10, orderBy: 'fullName', order: 'asc' });

      // Assert
      expect(page1.isRight() && page2.isRight()).toBe(true);
      if (page1.isRight() && page2.isRight()) {
        const lastOfPage1 = page1.value.items[9].fullName;
        const firstOfPage2 = page2.value.items[0].fullName;
        expect(lastOfPage1 < firstOfPage2).toBe(true);
      }
    });
  });

  describe('Performance considerations', () => {
    it('should handle large datasets efficiently', async () => {
      // Arrange
      const users = createMockUsers(1000);
      for (const user of users) {
        await viewRepo.create(user);
      }

      // Act
      const start = Date.now();
      const result = await useCase.execute({ page: 1, limit: 50 });
      const duration = Date.now() - start;

      // Assert
      expect(result.isRight()).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
      if (result.isRight()) {
        expect(result.value.items).toHaveLength(50);
        expect(result.value.total).toBe(1000);
      }
    });
  });

  describe('Type coercion', () => {
    it('should reject string numbers that fail validation', async () => {
      // Act
      const result = await useCase.execute({ 
        page: '2' as any,
        limit: '5' as any
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          // String values fail integer validation
          expect(result.value.details).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code: 'isInt',
                message: 'page must be an integer number',
                path: ['page']
              }),
              expect.objectContaining({
                code: 'isInt',
                message: 'limit must be an integer number',
                path: ['limit']
              })
            ])
          );
        }
      }
    });

    it('should reject non-numeric string values', async () => {
      // Act
      const result = await useCase.execute({ 
        page: 'abc' as any,
        limit: 'xyz' as any
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        // Non-numeric strings are converted to NaN by @Type decorator, which fails validation
      }
    });
  });
});

// Helper functions
function createMockUser(
  id: string,
  email: string = `user${id}@example.com`,
  fullName: string = `User ${id}`,
  role: string = 'student'
): UserAggregatedView {
  return {
    identityId: id,
    email,
    emailVerified: true,
    lastLogin: new Date(),
    lockedUntil: null,
    profileId: `profile-${id}`,
    fullName,
    nationalId: `00000000${id}`,
    phone: null,
    birthDate: null,
    profileImageUrl: null,
    bio: null,
    profession: null,
    specialization: null,
    preferredLanguage: 'en',
    timezone: 'UTC',
    authorizationId: `auth-${id}`,
    role,
    isActive: true,
    createdAt: new Date(),
    updatedAt: null,
  };
}

function createMockUsers(count: number): UserAggregatedView[] {
  return Array.from({ length: count }, (_, i) => 
    createMockUser(`id${i + 1}`)
  );
}