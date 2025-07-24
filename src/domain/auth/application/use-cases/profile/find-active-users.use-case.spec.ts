// src/domain/auth/application/use-cases/profile/find-active-users.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FindActiveUsersUseCase } from './find-active-users.use-case';
import { InMemoryUserAggregatedViewRepository } from '@/test/repositories/in-memory-user-aggregated-view-repository';
import { UserAggregatedView } from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { UserRole } from '@/domain/auth/enterprise/entities/user-authorization';
import { left, right } from '@/core/either';
import { RepositoryError } from '@/domain/auth/domain/exceptions';

describe('FindActiveUsersUseCase', () => {
  let userViewRepo: InMemoryUserAggregatedViewRepository;
  let sut: FindActiveUsersUseCase;

  beforeEach(() => {
    userViewRepo = new InMemoryUserAggregatedViewRepository();
    sut = new FindActiveUsersUseCase(userViewRepo);
  });

  describe('Success scenarios', () => {
    it('should find active users with default parameters', async () => {
      // Arrange
      const now = new Date();
      const recentLogin = new Date();
      recentLogin.setDate(recentLogin.getDate() - 5); // 5 days ago
      const oldLogin = new Date();
      oldLogin.setDate(oldLogin.getDate() - 40); // 40 days ago

      const activeUser: UserAggregatedView = {
        identityId: 'identity-1',
        profileId: 'profile-1',
        authorizationId: 'auth-1',
        email: 'active@example.com',
        emailVerified: true,
        fullName: 'Active User',
        nationalId: '12345678901',
        phone: '+1234567890',
        role: 'student',
        isActive: true,
        lastLogin: recentLogin,
        createdAt: now,
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      const inactiveUser: UserAggregatedView = {
        identityId: 'identity-2',
        profileId: 'profile-2',
        authorizationId: 'auth-2',
        email: 'inactive@example.com',
        emailVerified: true,
        fullName: 'Inactive User',
        nationalId: '98765432101',
        role: 'student',
        isActive: true,
        lastLogin: oldLogin, // More than 30 days ago
        createdAt: now,
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      userViewRepo.items.push(activeUser, inactiveUser);

      // Act
      const result = await sut.execute();

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(1);
        expect(result.value.users[0].email).toBe('active@example.com');
        expect(result.value.total).toBe(1);
        expect(result.value.page).toBe(1);
        expect(result.value.pageSize).toBe(20);
      }
    });

    it('should filter by role when single role provided', async () => {
      const now = new Date();
      const recentLogin = new Date();
      recentLogin.setDate(recentLogin.getDate() - 5);

      const adminUser: UserAggregatedView = {
        identityId: 'admin-1',
        profileId: 'admin-profile-1',
        authorizationId: 'admin-auth-1',
        email: 'admin@example.com',
        emailVerified: true,
        fullName: 'Admin User',
        nationalId: '11111111111',
        role: 'admin',
        isActive: true,
        lastLogin: recentLogin,
        createdAt: now,
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      const tutorUser: UserAggregatedView = {
        identityId: 'tutor-1',
        profileId: 'tutor-profile-1',
        authorizationId: 'tutor-auth-1',
        email: 'tutor@example.com',
        emailVerified: true,
        fullName: 'Tutor User',
        nationalId: '22222222222',
        role: 'tutor',
        isActive: true,
        lastLogin: recentLogin,
        createdAt: now,
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      const studentUser: UserAggregatedView = {
        identityId: 'student-1',
        profileId: 'student-profile-1',
        authorizationId: 'student-auth-1',
        email: 'student@example.com',
        emailVerified: true,
        fullName: 'Student User',
        nationalId: '33333333333',
        role: 'student',
        isActive: true,
        lastLogin: recentLogin,
        createdAt: now,
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      userViewRepo.items.push(adminUser, tutorUser, studentUser);

      const result = await sut.execute({ roles: ['admin'] });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(1);
        expect(result.value.users[0].role).toBe('admin');
      }
    });

    it('should filter by multiple roles', async () => {
      const now = new Date();
      const recentLogin = new Date();
      recentLogin.setDate(recentLogin.getDate() - 5);

      const users: UserAggregatedView[] = [
        {
          identityId: 'admin-1',
          profileId: 'admin-profile-1',
          authorizationId: 'admin-auth-1',
          email: 'admin@example.com',
          emailVerified: true,
          fullName: 'Admin User',
          nationalId: '11111111111',
          role: 'admin',
          isActive: true,
          lastLogin: recentLogin,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        },
        {
          identityId: 'tutor-1',
          profileId: 'tutor-profile-1',
          authorizationId: 'tutor-auth-1',
          email: 'tutor@example.com',
          emailVerified: true,
          fullName: 'Tutor User',
          nationalId: '22222222222',
          role: 'tutor',
          isActive: true,
          lastLogin: recentLogin,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        },
        {
          identityId: 'student-1',
          profileId: 'student-profile-1',
          authorizationId: 'student-auth-1',
          email: 'student@example.com',
          emailVerified: true,
          fullName: 'Student User',
          nationalId: '33333333333',
          role: 'student',
          isActive: true,
          lastLogin: recentLogin,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        },
      ];

      userViewRepo.items.push(...users);

      const result = await sut.execute({ roles: ['admin', 'tutor'] });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(2);
        const roles = result.value.users.map((u) => u.role);
        expect(roles).toContain('admin');
        expect(roles).toContain('tutor');
        expect(roles).not.toContain('student');
      }
    });

    it('should respect custom activeDays parameter', async () => {
      const now = new Date();

      const user7Days: UserAggregatedView = {
        identityId: 'user-7',
        profileId: 'user-7-profile',
        authorizationId: 'user-7-auth',
        email: 'user7@example.com',
        emailVerified: true,
        fullName: 'User 7 Days',
        nationalId: '77777777777',
        role: 'student',
        isActive: true,
        lastLogin: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        createdAt: now,
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      const user15Days: UserAggregatedView = {
        identityId: 'user-15',
        profileId: 'user-15-profile',
        authorizationId: 'user-15-auth',
        email: 'user15@example.com',
        emailVerified: true,
        fullName: 'User 15 Days',
        nationalId: '15151515151',
        role: 'student',
        isActive: true,
        lastLogin: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        createdAt: now,
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      userViewRepo.items.push(user7Days, user15Days);

      // Test with 10 days threshold
      const result = await sut.execute({ activeDays: 10 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(1);
        expect(result.value.users[0].email).toBe('user7@example.com');
      }
    });

    it('should handle pagination correctly', async () => {
      const now = new Date();
      const recentLogin = new Date();
      recentLogin.setDate(recentLogin.getDate() - 5);

      // Create 25 active users
      for (let i = 1; i <= 25; i++) {
        const user: UserAggregatedView = {
          identityId: `user-${i}`,
          profileId: `user-${i}-profile`,
          authorizationId: `user-${i}-auth`,
          email: `user${i}@example.com`,
          emailVerified: true,
          fullName: `User ${i}`,
          nationalId: `1000000000${i}`,
          role: 'student',
          isActive: true,
          lastLogin: recentLogin,
          createdAt: now,
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
        expect(result1.value.page).toBe(1);
        expect(result1.value.pageSize).toBe(10);
      }

      // Test page 2
      const result2 = await sut.execute({ page: 2, pageSize: 10 });
      expect(result2.isRight()).toBe(true);
      if (result2.isRight()) {
        expect(result2.value.users).toHaveLength(10);
        expect(result2.value.page).toBe(2);
      }
    });

    it('should return users ordered by lastLogin descending', async () => {
      const now = new Date();

      const users: UserAggregatedView[] = [
        {
          identityId: 'user-1',
          profileId: 'user-1-profile',
          authorizationId: 'user-1-auth',
          email: 'user1@example.com',
          emailVerified: true,
          fullName: 'User 1',
          nationalId: '11111111111',
          role: 'student',
          isActive: true,
          lastLogin: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        },
        {
          identityId: 'user-2',
          profileId: 'user-2-profile',
          authorizationId: 'user-2-auth',
          email: 'user2@example.com',
          emailVerified: true,
          fullName: 'User 2',
          nationalId: '22222222222',
          role: 'student',
          isActive: true,
          lastLogin: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        },
        {
          identityId: 'user-3',
          profileId: 'user-3-profile',
          authorizationId: 'user-3-auth',
          email: 'user3@example.com',
          emailVerified: true,
          fullName: 'User 3',
          nationalId: '33333333333',
          role: 'student',
          isActive: true,
          lastLogin: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        },
      ];

      userViewRepo.items.push(...users);

      const result = await sut.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(3);
        // Should be ordered by lastLogin descending (most recent first)
        expect(result.value.users[0].email).toBe('user1@example.com');
        expect(result.value.users[1].email).toBe('user3@example.com');
        expect(result.value.users[2].email).toBe('user2@example.com');
      }
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
        expect(result.value.message).toContain('findActiveUsers');
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
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle users with no lastLogin', async () => {
      const now = new Date();

      const userNoLogin: UserAggregatedView = {
        identityId: 'no-login',
        profileId: 'no-login-profile',
        authorizationId: 'no-login-auth',
        email: 'nologin@example.com',
        emailVerified: true,
        fullName: 'No Login User',
        nationalId: '99999999999',
        role: 'student',
        isActive: true,
        lastLogin: null, // Never logged in
        createdAt: now,
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      userViewRepo.items.push(userNoLogin);

      const result = await sut.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(0); // Should not include users without lastLogin
      }
    });

    it('should handle inactive users with recent login', async () => {
      const now = new Date();
      const recentLogin = new Date();
      recentLogin.setDate(recentLogin.getDate() - 5);

      const inactiveUser: UserAggregatedView = {
        identityId: 'inactive',
        profileId: 'inactive-profile',
        authorizationId: 'inactive-auth',
        email: 'inactive@example.com',
        emailVerified: true,
        fullName: 'Inactive User',
        nationalId: '88888888888',
        role: 'student',
        isActive: false, // Inactive
        lastLogin: recentLogin,
        createdAt: now,
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      userViewRepo.items.push(inactiveUser);

      const result = await sut.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(0); // Should not include inactive users
      }
    });

    it('should handle empty repository', async () => {
      const result = await sut.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(0);
        expect(result.value.total).toBe(0);
      }
    });

    it('should handle invalid page and pageSize values', async () => {
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
          expect(result.value.page).toBeGreaterThanOrEqual(1);
          expect(result.value.pageSize).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it('should handle very large pageSize', async () => {
      const result = await sut.execute({ pageSize: 1000000 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.pageSize).toBe(1000000); // No max limit in current implementation
      }
    });

    it('should handle activeDays edge values', async () => {
      const now = new Date();
      const exactBoundary = new Date();
      exactBoundary.setDate(exactBoundary.getDate() - 30);
      exactBoundary.setMilliseconds(exactBoundary.getMilliseconds() + 1); // Just after boundary

      const userJustAfterBoundary: UserAggregatedView = {
        identityId: 'boundary',
        profileId: 'boundary-profile',
        authorizationId: 'boundary-auth',
        email: 'boundary@example.com',
        emailVerified: true,
        fullName: 'Boundary User',
        nationalId: '77777777777',
        role: 'student',
        isActive: true,
        lastLogin: exactBoundary,
        createdAt: now,
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      const userBeforeBoundary: UserAggregatedView = {
        identityId: 'before-boundary',
        profileId: 'before-boundary-profile',
        authorizationId: 'before-boundary-auth',
        email: 'before@example.com',
        emailVerified: true,
        fullName: 'Before Boundary User',
        nationalId: '66666666666',
        role: 'student',
        isActive: true,
        lastLogin: new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000), // 31 days ago
        createdAt: now,
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      userViewRepo.items.push(userJustAfterBoundary, userBeforeBoundary);

      const result = await sut.execute({ activeDays: 30 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(1); // Should include user just after boundary
        expect(result.value.users[0].email).toBe('boundary@example.com');
      }
    });
  });

  describe('Business rules', () => {
    it('should only return users who are both active and logged in recently', async () => {
      const now = new Date();
      const recentLogin = new Date();
      recentLogin.setDate(recentLogin.getDate() - 5);

      const scenarios = [
        { isActive: true, lastLogin: recentLogin, shouldInclude: true },
        { isActive: false, lastLogin: recentLogin, shouldInclude: false },
        { isActive: true, lastLogin: null, shouldInclude: false },
        { isActive: false, lastLogin: null, shouldInclude: false },
      ];

      scenarios.forEach((scenario, index) => {
        const user: UserAggregatedView = {
          identityId: `user-${index}`,
          profileId: `user-${index}-profile`,
          authorizationId: `user-${index}-auth`,
          email: `user${index}@example.com`,
          emailVerified: true,
          fullName: `User ${index}`,
          nationalId: `1000000000${index}`,
          role: 'student',
          isActive: scenario.isActive,
          lastLogin: scenario.lastLogin,
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
        const includedCount = scenarios.filter((s) => s.shouldInclude).length;
        expect(result.value.users).toHaveLength(includedCount);
      }
    });

    it('should handle all user roles correctly', async () => {
      const now = new Date();
      const recentLogin = new Date();
      recentLogin.setDate(recentLogin.getDate() - 5);

      const roles: UserRole[] = ['admin', 'tutor', 'student'];

      roles.forEach((role, index) => {
        const user: UserAggregatedView = {
          identityId: `${role}-user`,
          profileId: `${role}-profile`,
          authorizationId: `${role}-auth`,
          email: `${role}@example.com`,
          emailVerified: true,
          fullName: `${role} User`,
          nationalId: `2000000000${index}`,
          role,
          isActive: true,
          lastLogin: recentLogin,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        };
        userViewRepo.items.push(user);
      });

      // Test each role individually
      for (const role of roles) {
        const result = await sut.execute({ roles: [role] });

        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value.users).toHaveLength(1);
          expect(result.value.users[0].role).toBe(role);
        }
      }

      // Test all roles together
      const allResult = await sut.execute({ roles });
      expect(allResult.isRight()).toBe(true);
      if (allResult.isRight()) {
        expect(allResult.value.users).toHaveLength(3);
      }
    });

    it('should map all user fields correctly to response DTO', async () => {
      const now = new Date();
      const recentLogin = new Date();
      recentLogin.setDate(recentLogin.getDate() - 5);
      const birthDate = new Date('1990-01-01');

      const fullUser: UserAggregatedView = {
        identityId: 'full-user',
        profileId: 'full-user-profile',
        authorizationId: 'full-user-auth',
        email: 'full@example.com',
        emailVerified: true,
        fullName: 'Full User',
        nationalId: '12345678901',
        phone: '+1234567890',
        birthDate,
        profileImageUrl: 'https://example.com/avatar.jpg',
        role: 'admin',
        isActive: true,
        lastLogin: recentLogin,
        createdAt: now,
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      };

      userViewRepo.items.push(fullUser);

      const result = await sut.execute();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.users).toHaveLength(1);
        const user = result.value.users[0];

        expect(user.id).toBe('full-user');
        expect(user.email).toBe('full@example.com');
        expect(user.name).toBe('Full User');
        expect(user.nationalId).toBe('12345678901');
        expect(user.phone).toBe('+1234567890');
        expect(user.birthDate).toEqual(birthDate);
        expect(user.profileImageUrl).toBe('https://example.com/avatar.jpg');
        expect(user.role).toBe('admin');
        expect(user.lastLogin).toEqual(recentLogin);
        expect(user.createdAt).toEqual(now);
        expect(user.updatedAt).toEqual(now);
      }
    });

    it('should handle optional fields correctly', async () => {
      const now = new Date();
      const recentLogin = new Date();
      recentLogin.setDate(recentLogin.getDate() - 5);

      const minimalUser: UserAggregatedView = {
        identityId: 'minimal-user',
        profileId: 'minimal-user-profile',
        authorizationId: 'minimal-user-auth',
        email: 'minimal@example.com',
        emailVerified: true,
        fullName: 'Minimal User',
        nationalId: '99999999999',
        role: 'student',
        isActive: true,
        lastLogin: recentLogin,
        createdAt: now,
        updatedAt: now,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        // Optional fields not provided
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
        expect(user.updatedAt).toEqual(now); // Should default to createdAt
      }
    });
  });

  describe('Security scenarios', () => {
    it('should not expose sensitive data in error messages', async () => {
      const sensitiveError = new Error(
        'SELECT * FROM users WHERE password = "secret"',
      );
      vi.spyOn(userViewRepo, 'findForListing').mockResolvedValueOnce(
        left(sensitiveError),
      );

      const result = await sut.execute();

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).not.toContain('SELECT');
        expect(result.value.message).not.toContain('password');
        expect(result.value.message).not.toContain('secret');
      }
    });

    it('should handle SQL injection attempts in roles array', async () => {
      const maliciousRoles = [
        "admin' OR '1'='1",
        "'; DROP TABLE users; --",
        "<script>alert('xss')</script>",
      ] as any[];

      const result = await sut.execute({ roles: maliciousRoles });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Should safely handle invalid roles
        expect(result.value.users).toHaveLength(0);
      }
    });
  });

  describe('Performance and concurrency', () => {
    it('should handle large number of users efficiently', async () => {
      const now = new Date();
      const recentLogin = new Date();
      recentLogin.setDate(recentLogin.getDate() - 5);

      // Create 1000 users
      for (let i = 1; i <= 1000; i++) {
        const user: UserAggregatedView = {
          identityId: `user-${i}`,
          profileId: `user-${i}-profile`,
          authorizationId: `user-${i}-auth`,
          email: `user${i}@example.com`,
          emailVerified: true,
          fullName: `User ${i}`,
          nationalId: `${i}`.padStart(11, '0'),
          role: ['admin', 'tutor', 'student'][i % 3] as UserRole,
          isActive: i % 2 === 0, // Half are inactive
          lastLogin: i % 3 === 0 ? recentLogin : null, // 1/3 have recent login
          createdAt: now,
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
        // Only users that are active AND have recent login
        const expectedCount = Math.floor(1000 / 6); // 1/2 active * 1/3 recent login
        expect(result.value.total).toBeGreaterThan(0);
      }
    });

    it('should handle concurrent requests', async () => {
      const now = new Date();
      const recentLogin = new Date();
      recentLogin.setDate(recentLogin.getDate() - 5);

      // Add some test data
      for (let i = 1; i <= 10; i++) {
        const user: UserAggregatedView = {
          identityId: `user-${i}`,
          profileId: `user-${i}-profile`,
          authorizationId: `user-${i}-auth`,
          email: `user${i}@example.com`,
          emailVerified: true,
          fullName: `User ${i}`,
          nationalId: `${i}`.padStart(11, '0'),
          role: 'student',
          isActive: true,
          lastLogin: recentLogin,
          createdAt: now,
          updatedAt: now,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        };
        userViewRepo.items.push(user);
      }

      // Execute multiple concurrent requests
      const results = await Promise.all([
        sut.execute({ page: 1, pageSize: 5 }),
        sut.execute({ page: 2, pageSize: 5 }),
        sut.execute({ roles: ['student'] }),
        sut.execute({ activeDays: 10 }),
      ]);

      // All should succeed
      expect(results.every((r) => r.isRight())).toBe(true);
    });
  });

  describe('Type coercion and validation', () => {
    it('should handle non-array roles parameter', async () => {
      const result = await sut.execute({ roles: 'admin' as any });

      // Should not crash, should handle gracefully
      expect(result.isRight()).toBe(true);
    });

    it('should handle string numbers for numeric parameters', async () => {
      // Add some test data
      const now = new Date();
      const recentLogin = new Date();
      recentLogin.setDate(recentLogin.getDate() - 5);

      for (let i = 1; i <= 30; i++) {
        const user: UserAggregatedView = {
          identityId: `user-${i}`,
          profileId: `user-${i}-profile`,
          authorizationId: `user-${i}-auth`,
          email: `user${i}@example.com`,
          emailVerified: true,
          fullName: `User ${i}`,
          nationalId: `${i}`.padStart(11, '0'),
          role: 'student',
          isActive: true,
          lastLogin: recentLogin,
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
        activeDays: '7' as any,
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Strings are truthy so '2' && '2' > 0 is true, Math.floor('2') = 2
        expect(result.value.page).toBe(2);
        // Similarly, '10' && '10' > 0 is true, Math.floor('10') = 10
        expect(result.value.pageSize).toBe(10);
      }
    });

    it('should handle null/undefined parameters', async () => {
      const result = await sut.execute({
        roles: null as any,
        activeDays: undefined,
        page: null as any,
        pageSize: undefined,
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.page).toBe(1);
        expect(result.value.pageSize).toBe(20);
      }
    });
  });
});
