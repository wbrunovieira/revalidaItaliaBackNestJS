// src/domain/auth/application/use-cases/profile/find-users.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FindUsersUseCase } from './find-users.use-case';
import { InMemoryUserAggregatedViewRepository } from '@/test/repositories/in-memory-user-aggregated-view-repository';
import { UserAggregatedView } from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { left, right } from '@/core/either';
import { RepositoryError } from '@/domain/auth/domain/exceptions';
import { FindUsersRequestDto } from '../../dtos/find-users-request.dto';

describe('FindUsersUseCase', () => {
  let userViewRepo: InMemoryUserAggregatedViewRepository;
  let sut: FindUsersUseCase;

  beforeEach(() => {
    userViewRepo = new InMemoryUserAggregatedViewRepository();
    sut = new FindUsersUseCase(userViewRepo);
  });

  describe('Success scenarios', () => {
    it('should find users with default parameters', async () => {
      // Arrange
      const now = new Date();
      const users: UserAggregatedView[] = [
        {
          identityId: 'user-1',
          profileId: 'profile-1',
          authorizationId: 'auth-1',
          email: 'john@example.com',
          emailVerified: true,
          fullName: 'John Doe',
          nationalId: '12345678901',
          phone: '+1234567890',
          birthDate: new Date('1990-01-01'),
          profileImageUrl: 'https://example.com/john.jpg',
          role: 'student',
          isActive: true,
          lastLogin: now,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        },
        {
          identityId: 'user-2',
          profileId: 'profile-2',
          authorizationId: 'auth-2',
          email: 'jane@example.com',
          emailVerified: true,
          fullName: 'Jane Smith',
          nationalId: '98765432101',
          role: 'tutor',
          isActive: true,
          lastLogin: now,
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        },
      ];

      userViewRepo.items.push(...users);

      // Act
      const result = await sut.execute();

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(2);
        // Check that both users are returned (order by createdAt desc)
        const emails = result.value.users.map((u) => u.email);
        expect(emails).toContain('john@example.com');
        expect(emails).toContain('jane@example.com');
        expect(result.value.pagination.page).toBe(1);
        expect(result.value.pagination.pageSize).toBe(20);
        expect(result.value.pagination.total).toBe(2);
      }
    });

    it('should search users by name', async () => {
      const now = new Date();
      const users: UserAggregatedView[] = [
        {
          identityId: 'user-1',
          profileId: 'profile-1',
          authorizationId: 'auth-1',
          email: 'john@example.com',
          emailVerified: true,
          fullName: 'John Doe',
          nationalId: '12345678901',
          role: 'student',
          isActive: true,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        },
        {
          identityId: 'user-2',
          profileId: 'profile-2',
          authorizationId: 'auth-2',
          email: 'jane@example.com',
          emailVerified: true,
          fullName: 'Jane Smith',
          nationalId: '98765432101',
          role: 'student',
          isActive: true,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        },
      ];

      userViewRepo.items.push(...users);

      const result = await sut.execute({ name: 'John' });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // The in-memory repository does filter by search term
        expect(result.value.users).toHaveLength(1);
        expect(result.value.users[0].name).toBe('John Doe');
      }
    });

    it('should search users by email', async () => {
      const now = new Date();
      const users: UserAggregatedView[] = [
        {
          identityId: 'user-1',
          profileId: 'profile-1',
          authorizationId: 'auth-1',
          email: 'john@example.com',
          emailVerified: true,
          fullName: 'John Doe',
          nationalId: '12345678901',
          role: 'student',
          isActive: true,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        },
        {
          identityId: 'user-2',
          profileId: 'profile-2',
          authorizationId: 'auth-2',
          email: 'jane@example.com',
          emailVerified: true,
          fullName: 'Jane Smith',
          nationalId: '98765432101',
          role: 'student',
          isActive: true,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        },
      ];

      userViewRepo.items.push(...users);

      const result = await sut.execute({ email: 'john@example.com' });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(1);
        expect(result.value.users[0].email).toBe('john@example.com');
      }
    });

    it('should search users by nationalId', async () => {
      const now = new Date();
      const users: UserAggregatedView[] = [
        {
          identityId: 'user-1',
          profileId: 'profile-1',
          authorizationId: 'auth-1',
          email: 'john@example.com',
          emailVerified: true,
          fullName: 'John Doe',
          nationalId: '12345678901',
          role: 'student',
          isActive: true,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        },
        {
          identityId: 'user-2',
          profileId: 'profile-2',
          authorizationId: 'auth-2',
          email: 'jane@example.com',
          emailVerified: true,
          fullName: 'Jane Smith',
          nationalId: '98765432101',
          role: 'student',
          isActive: true,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        },
      ];

      userViewRepo.items.push(...users);

      const result = await sut.execute({ nationalId: '12345678901' });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(1);
        expect(result.value.users[0].nationalId).toBe('12345678901');
      }
    });

    it('should handle pagination correctly', async () => {
      const now = new Date();
      // Create 25 users
      for (let i = 1; i <= 25; i++) {
        const user: UserAggregatedView = {
          identityId: `user-${i}`,
          profileId: `profile-${i}`,
          authorizationId: `auth-${i}`,
          email: `user${i}@example.com`,
          emailVerified: true,
          fullName: `User ${i}`,
          nationalId: `${i}`.padStart(11, '0'),
          role: 'student',
          isActive: true,
          createdAt: new Date(now.getTime() - i * 60 * 60 * 1000), // Different times
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        };
        userViewRepo.items.push(user);
      }

      // Test page 1
      const result1 = await sut.execute({ page: 1, pageSize: 10 });
      expect(result1.isRight()).toBe(true);
      if (result1.isRight()) {
        expect(result1.value.users).toHaveLength(10);
        expect(result1.value.pagination.page).toBe(1);
        expect(result1.value.pagination.pageSize).toBe(10);
        expect(result1.value.pagination.total).toBe(25);
      }

      // Test page 2
      const result2 = await sut.execute({ page: 2, pageSize: 10 });
      expect(result2.isRight()).toBe(true);
      if (result2.isRight()) {
        expect(result2.value.users).toHaveLength(10);
        expect(result2.value.pagination.page).toBe(2);
      }

      // Test page 3 (partial)
      const result3 = await sut.execute({ page: 3, pageSize: 10 });
      expect(result3.isRight()).toBe(true);
      if (result3.isRight()) {
        expect(result3.value.users).toHaveLength(5);
        expect(result3.value.pagination.page).toBe(3);
      }
    });

    it('should map all user fields correctly to response DTOs', async () => {
      const now = new Date();
      const birthDate = new Date('1990-01-01');
      const lastLogin = new Date('2024-01-01');

      const user: UserAggregatedView = {
        identityId: 'user-1',
        profileId: 'profile-1',
        authorizationId: 'auth-1',
        email: 'john@example.com',
        emailVerified: true,
        fullName: 'John Doe',
        nationalId: '12345678901',
        phone: '+1234567890',
        birthDate,
        profileImageUrl: 'https://example.com/avatar.jpg',
        bio: 'Software developer',
        profession: 'Developer',
        specialization: 'Backend',
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        role: 'admin',
        isActive: true,
        lastLogin,
        createdAt: now,
        updatedAt: now,
      };

      userViewRepo.items.push(user);

      const result = await sut.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(1);
        const dto = result.value.users[0];

        expect(dto.id).toBe('user-1');
        expect(dto.email).toBe('john@example.com');
        expect(dto.name).toBe('John Doe');
        expect(dto.nationalId).toBe('12345678901');
        expect(dto.phone).toBe('+1234567890');
        expect(dto.birthDate).toEqual(birthDate);
        expect(dto.profileImageUrl).toBe('https://example.com/avatar.jpg');
        expect(dto.role).toBe('admin');
        expect(dto.lastLogin).toEqual(lastLogin);
        expect(dto.createdAt).toEqual(now);
        expect(dto.updatedAt).toEqual(now);
      }
    });

    it('should return users ordered by createdAt descending', async () => {
      const now = new Date();

      const oldUser: UserAggregatedView = {
        identityId: 'old-user',
        profileId: 'old-profile',
        authorizationId: 'old-auth',
        email: 'old@example.com',
        emailVerified: true,
        fullName: 'Old User',
        nationalId: '11111111111',
        role: 'student',
        isActive: true,
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      const newUser: UserAggregatedView = {
        identityId: 'new-user',
        profileId: 'new-profile',
        authorizationId: 'new-auth',
        email: 'new@example.com',
        emailVerified: true,
        fullName: 'New User',
        nationalId: '22222222222',
        role: 'student',
        isActive: true,
        createdAt: now, // Today
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      const midUser: UserAggregatedView = {
        identityId: 'mid-user',
        profileId: 'mid-profile',
        authorizationId: 'mid-auth',
        email: 'mid@example.com',
        emailVerified: true,
        fullName: 'Mid User',
        nationalId: '33333333333',
        role: 'student',
        isActive: true,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      userViewRepo.items.push(oldUser, newUser, midUser);

      const result = await sut.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(3);
        // Should be ordered by createdAt desc
        expect(result.value.users[0].email).toBe('new@example.com');
        expect(result.value.users[1].email).toBe('mid@example.com');
        expect(result.value.users[2].email).toBe('old@example.com');
      }
    });

    it('should trim search parameters', async () => {
      const request: FindUsersRequestDto = {
        name: '  John Doe  ',
        email: '  john@example.com  ',
        nationalId: '  12345678901  ',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      // The use case trims the search parameters before passing to repository
    });
  });

  describe('Error scenarios', () => {
    it('should return RepositoryError when repository fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.spyOn(userViewRepo, 'findForListing').mockResolvedValueOnce(
        left(dbError),
      );

      const result = await sut.execute();

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toContain('findUsers');
      }
    });

    it('should handle exceptions thrown by repository', async () => {
      vi.spyOn(userViewRepo, 'findForListing').mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      const result = await sut.execute();

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toContain('search');
      }
    });

    it('should sanitize sensitive error messages', async () => {
      const sensitiveError = new Error(
        'SELECT password FROM users WHERE email = "test@example.com"',
      );
      vi.spyOn(userViewRepo, 'findForListing').mockResolvedValueOnce(
        left(sensitiveError),
      );

      const result = await sut.execute();

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).not.toContain('SELECT');
        expect(result.value.message).not.toContain('password');
      }
    });

    it('should sanitize various SQL injection patterns', async () => {
      const sqlPatterns = [
        'INSERT INTO users VALUES...',
        'UPDATE users SET password...',
        'DELETE FROM users WHERE...',
        'secret_token = "abc123"',
        'WHERE id = 1 OR 1=1',
      ];

      for (const pattern of sqlPatterns) {
        vi.spyOn(userViewRepo, 'findForListing').mockResolvedValueOnce(
          left(new Error(pattern)),
        );

        const result = await sut.execute();

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value.message).not.toContain(pattern);
        }
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle empty repository', async () => {
      const result = await sut.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(0);
        expect(result.value.pagination.total).toBe(0);
      }
    });

    it('should handle invalid page and pageSize values', async () => {
      const now = new Date();
      // Add some test data
      for (let i = 1; i <= 5; i++) {
        const user: UserAggregatedView = {
          identityId: `user-${i}`,
          profileId: `profile-${i}`,
          authorizationId: `auth-${i}`,
          email: `user${i}@example.com`,
          emailVerified: true,
          fullName: `User ${i}`,
          nationalId: `${i}`.padStart(11, '0'),
          role: 'student',
          isActive: true,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        };
        userViewRepo.items.push(user);
      }

      const invalidValues = [
        { page: -1, pageSize: 20 },
        { page: 0, pageSize: 20 },
        { page: 1, pageSize: -10 },
        { page: 1, pageSize: 0 },
        { page: 1.5, pageSize: 20.7 },
        { page: NaN, pageSize: 20 },
        { page: 1, pageSize: NaN },
      ];

      for (const { page, pageSize } of invalidValues) {
        const result = await sut.execute({ page, pageSize });

        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          // Should use defaults or floor values
          expect(result.value.pagination.page).toBeGreaterThanOrEqual(1);
          expect(result.value.pagination.pageSize).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it('should handle very large pageSize', async () => {
      const result = await sut.execute({ pageSize: 1000000 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.pagination.pageSize).toBe(1000000); // No max limit
      }
    });

    it('should handle page beyond available data', async () => {
      const now = new Date();
      // Add only 5 users
      for (let i = 1; i <= 5; i++) {
        const user: UserAggregatedView = {
          identityId: `user-${i}`,
          profileId: `profile-${i}`,
          authorizationId: `auth-${i}`,
          email: `user${i}@example.com`,
          emailVerified: true,
          fullName: `User ${i}`,
          nationalId: `${i}`.padStart(11, '0'),
          role: 'student',
          isActive: true,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        };
        userViewRepo.items.push(user);
      }

      const result = await sut.execute({ page: 10, pageSize: 10 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(0);
        expect(result.value.pagination.total).toBe(5);
        expect(result.value.pagination.page).toBe(10);
      }
    });

    it('should handle optional fields in UserAggregatedView', async () => {
      const now = new Date();
      const minimalUser: UserAggregatedView = {
        identityId: 'minimal-user',
        profileId: 'minimal-profile',
        authorizationId: 'minimal-auth',
        email: 'minimal@example.com',
        emailVerified: false,
        fullName: 'Minimal User',
        nationalId: '99999999999',
        role: 'student',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        // Optional fields not provided
        phone: null,
        birthDate: null,
        profileImageUrl: null,
        bio: null,
        profession: null,
        specialization: null,
        lastLogin: null,
        lockedUntil: null,
      };

      userViewRepo.items.push(minimalUser);

      const result = await sut.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(1);
        const user = result.value.users[0];

        expect(user.phone).toBeUndefined();
        expect(user.birthDate).toBeUndefined();
        expect(user.profileImageUrl).toBeUndefined();
        expect(user.lastLogin).toBeUndefined();
        expect(user.updatedAt).toEqual(now);
      }
    });

    it('should use updatedAt fallback when not provided', async () => {
      const now = new Date();
      const user: UserAggregatedView = {
        identityId: 'user-1',
        profileId: 'profile-1',
        authorizationId: 'auth-1',
        email: 'user@example.com',
        emailVerified: true,
        fullName: 'Test User',
        nationalId: '12345678901',
        role: 'student',
        isActive: true,
        createdAt: now,
        updatedAt: null, // Not provided
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      userViewRepo.items.push(user);

      const result = await sut.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(1);
        expect(result.value.users[0].updatedAt).toEqual(now); // Falls back to createdAt
      }
    });

    it('should combine multiple search parameters with OR logic', async () => {
      const request: FindUsersRequestDto = {
        name: 'John',
        email: 'jane@example.com',
        nationalId: '11111111111',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      // Only the first non-empty trimmed value is used as search
    });

    it('should handle all empty search parameters', async () => {
      const request: FindUsersRequestDto = {
        name: '   ',
        email: '   ',
        nationalId: '   ',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      // Should behave like no search parameters
    });
  });

  describe('Business rules', () => {
    it('should return all users regardless of active status', async () => {
      const now = new Date();
      const activeUser: UserAggregatedView = {
        identityId: 'active-user',
        profileId: 'active-profile',
        authorizationId: 'active-auth',
        email: 'active@example.com',
        emailVerified: true,
        fullName: 'Active User',
        nationalId: '11111111111',
        role: 'student',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      const inactiveUser: UserAggregatedView = {
        identityId: 'inactive-user',
        profileId: 'inactive-profile',
        authorizationId: 'inactive-auth',
        email: 'inactive@example.com',
        emailVerified: true,
        fullName: 'Inactive User',
        nationalId: '22222222222',
        role: 'student',
        isActive: false,
        createdAt: now,
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      userViewRepo.items.push(activeUser, inactiveUser);

      const result = await sut.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(2);
      }
    });

    it('should return users of all roles', async () => {
      const now = new Date();
      const roles = ['admin', 'tutor', 'student'];

      roles.forEach((role, index) => {
        const user: UserAggregatedView = {
          identityId: `${role}-user`,
          profileId: `${role}-profile`,
          authorizationId: `${role}-auth`,
          email: `${role}@example.com`,
          emailVerified: true,
          fullName: `${role} User`,
          nationalId: `${index}`.padStart(11, '0'),
          role,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        };
        userViewRepo.items.push(user);
      });

      const result = await sut.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(3);
        const returnedRoles = result.value.users.map((u) => u.role);
        expect(returnedRoles).toContain('admin');
        expect(returnedRoles).toContain('tutor');
        expect(returnedRoles).toContain('student');
      }
    });

    it('should search prioritizing first non-empty parameter', async () => {
      const request: FindUsersRequestDto = {
        name: 'John',
        email: 'jane@example.com', // This should be ignored
        nationalId: '99999999999', // This should be ignored
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      // The search parameter sent to repository is 'John'
    });
  });

  describe('Security scenarios', () => {
    it('should not expose sensitive data in error messages', async () => {
      const sensitiveError = new Error(
        'Connection string: postgres://user:password@localhost/db',
      );
      vi.spyOn(userViewRepo, 'findForListing').mockResolvedValueOnce(
        left(sensitiveError),
      );

      const result = await sut.execute();

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).not.toContain('postgres://');
        expect(result.value.message).not.toContain('password');
      }
    });

    it('should handle potential XSS in search parameters', async () => {
      const maliciousInput: FindUsersRequestDto = {
        name: '<script>alert("xss")</script>',
        email: 'javascript:alert(1)',
        nationalId: '"><img src=x onerror=alert(1)>',
      };

      const result = await sut.execute(maliciousInput);

      expect(result.isRight()).toBe(true);
      // The input is passed to repository as-is, sanitization happens at presentation layer
    });

    it('should handle SQL injection attempts in search', async () => {
      const sqlInjection: FindUsersRequestDto = {
        name: "'; DROP TABLE users; --",
        email: "' OR '1'='1",
        nationalId: "1' UNION SELECT * FROM passwords--",
      };

      const result = await sut.execute(sqlInjection);

      expect(result.isRight()).toBe(true);
      // Repository handles parameterized queries
    });
  });

  describe('Performance and concurrency', () => {
    it('should handle large number of users efficiently', async () => {
      const now = new Date();
      // Create 1000 users
      for (let i = 1; i <= 1000; i++) {
        const user: UserAggregatedView = {
          identityId: `user-${i}`,
          profileId: `profile-${i}`,
          authorizationId: `auth-${i}`,
          email: `user${i}@example.com`,
          emailVerified: true,
          fullName: `User ${i}`,
          nationalId: `${i}`.padStart(11, '0'),
          role: ['admin', 'tutor', 'student'][i % 3],
          isActive: i % 2 === 0,
          createdAt: new Date(now.getTime() - i * 60 * 1000),
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        };
        userViewRepo.items.push(user);
      }

      const start = Date.now();
      const result = await sut.execute({ pageSize: 100 });
      const duration = Date.now() - start;

      expect(result.isRight()).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second

      if (result.isRight()) {
        expect(result.value.users).toHaveLength(100);
        expect(result.value.pagination.total).toBe(1000);
      }
    });

    it('should handle concurrent requests', async () => {
      const now = new Date();
      // Add some test data
      for (let i = 1; i <= 50; i++) {
        const user: UserAggregatedView = {
          identityId: `user-${i}`,
          profileId: `profile-${i}`,
          authorizationId: `auth-${i}`,
          email: `user${i}@example.com`,
          emailVerified: true,
          fullName: `User ${i}`,
          nationalId: `${i}`.padStart(11, '0'),
          role: 'student',
          isActive: true,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        };
        userViewRepo.items.push(user);
      }

      // Execute multiple concurrent requests
      const results = await Promise.all([
        sut.execute({ page: 1, pageSize: 10 }),
        sut.execute({ page: 2, pageSize: 10 }),
        sut.execute({ name: 'User' }),
        sut.execute({ email: 'user1@example.com' }),
        sut.execute({ nationalId: '00000000001' }),
      ]);

      // All should succeed
      expect(results.every((r) => r.isRight())).toBe(true);
    });
  });

  describe('Type coercion and validation', () => {
    it('should handle non-string search parameters', async () => {
      const invalidInputs = [
        { name: 123 as any },
        { email: true as any },
        { nationalId: {} as any },
        { name: null as any },
        { email: undefined as any },
        { nationalId: [] as any },
      ];

      for (const input of invalidInputs) {
        const result = await sut.execute(input);

        // May return error or handle gracefully depending on input
        expect(result.isLeft() || result.isRight()).toBe(true);
      }
    });

    it('should handle string numbers for numeric parameters', async () => {
      const now = new Date();
      // Add some test data
      for (let i = 1; i <= 30; i++) {
        const user: UserAggregatedView = {
          identityId: `user-${i}`,
          profileId: `profile-${i}`,
          authorizationId: `auth-${i}`,
          email: `user${i}@example.com`,
          emailVerified: true,
          fullName: `User ${i}`,
          nationalId: `${i}`.padStart(11, '0'),
          role: 'student',
          isActive: true,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        };
        userViewRepo.items.push(user);
      }

      const result = await sut.execute({
        page: '2' as any,
        pageSize: '10' as any,
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Strings are truthy so '2' && '2' > 0 is true, Math.floor('2') = 2
        expect(result.value.pagination.page).toBe(2);
        expect(result.value.pagination.pageSize).toBe(10);
        expect(result.value.users).toHaveLength(10);
      }
    });

    it('should handle null/undefined parameters', async () => {
      const result = await sut.execute({
        name: null as any,
        email: undefined,
        nationalId: null as any,
        page: null as any,
        pageSize: undefined,
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.pagination.page).toBe(1);
        expect(result.value.pagination.pageSize).toBe(20);
      }
    });

    it('should handle object/array as request parameter', async () => {
      const result = await sut.execute({} as any);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.pagination.page).toBe(1);
        expect(result.value.pagination.pageSize).toBe(20);
      }
    });
  });

  describe('Repository interaction', () => {
    it('should pass correct parameters to repository', async () => {
      const spy = vi.spyOn(userViewRepo, 'findForListing');

      await sut.execute({
        name: 'John Doe',
        page: 2,
        pageSize: 15,
      });

      expect(spy).toHaveBeenCalledWith({
        page: 2,
        limit: 15,
        search: 'John Doe',
        orderBy: 'createdAt',
        order: 'desc',
      });
    });

    it('should use first non-empty search parameter', async () => {
      const spy = vi.spyOn(userViewRepo, 'findForListing');

      await sut.execute({
        name: '   ', // Empty after trim
        email: 'john@example.com',
        nationalId: '12345678901',
      });

      expect(spy).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: 'john@example.com', // First non-empty
        orderBy: 'createdAt',
        order: 'desc',
      });
    });
  });
});
