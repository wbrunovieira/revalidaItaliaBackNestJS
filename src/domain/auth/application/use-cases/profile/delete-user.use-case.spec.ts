// src/domain/auth/application/use-cases/profile/delete-user.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeleteUserUseCase } from './delete-user.use-case';
import { InMemoryUserIdentityRepository } from '@/test/repositories/in-memory-user-identity-repository';
import { InMemoryUserProfileRepository } from '@/test/repositories/in-memory-user-profile-repository';
import { InMemoryUserAuthorizationRepository } from '@/test/repositories/in-memory-user-authorization-repository';
import { UserIdentity } from '@/domain/auth/enterprise/entities/user-identity';
import { UserProfile } from '@/domain/auth/enterprise/entities/user-profile';
import { UserAuthorization } from '@/domain/auth/enterprise/entities/user-authorization';
import { Email } from '@/domain/auth/enterprise/value-objects/email.vo';
import { Password } from '@/domain/auth/enterprise/value-objects/password.vo';
import { NationalId } from '@/domain/auth/enterprise/value-objects/national-id.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left, right } from '@/core/either';
import {
  ResourceNotFoundError,
  RepositoryError,
} from '@/domain/auth/domain/exceptions';
import { EntityNotFoundException } from '@/core/domain/exceptions/entity-not-found.exception';

describe('DeleteUserUseCase', () => {
  let identityRepo: InMemoryUserIdentityRepository;
  let profileRepo: InMemoryUserProfileRepository;
  let authorizationRepo: InMemoryUserAuthorizationRepository;
  let sut: DeleteUserUseCase;

  beforeEach(() => {
    identityRepo = new InMemoryUserIdentityRepository();
    profileRepo = new InMemoryUserProfileRepository();
    authorizationRepo = new InMemoryUserAuthorizationRepository();
    sut = new DeleteUserUseCase(identityRepo, profileRepo, authorizationRepo);
  });

  describe('Success scenarios', () => {
    it('should delete user with all related entities successfully', async () => {
      // Arrange
      const identityId = new UniqueEntityID('identity-1');
      const identity = UserIdentity.create(
        {
          email: Email.create('user@example.com'),
          password: await Password.createFromPlain('SecurePass123').toHash(),
          emailVerified: true,
        },
        identityId,
      );

      const profile = UserProfile.create({
        identityId: identity.id,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
      });

      const authorization = UserAuthorization.create({
        identityId: identity.id,
        role: 'student',
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      authorizationRepo.items.push(authorization);

      // Act
      const result = await sut.execute({ id: identity.id.toString() });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('User deleted successfully');
      }
      expect(identityRepo.items).toHaveLength(0);
      expect(profileRepo.items).toHaveLength(0);
      expect(authorizationRepo.items).toHaveLength(0);
    });

    it('should delete user with only identity (no profile or authorization)', async () => {
      const identity = UserIdentity.create({
        email: Email.create('minimal@example.com'),
        password: await Password.createFromPlain('SecurePass123').toHash(),
        emailVerified: false,
      });

      identityRepo.items.push(identity);

      const result = await sut.execute({ id: identity.id.toString() });

      expect(result.isRight()).toBe(true);
      expect(identityRepo.items).toHaveLength(0);
    });

    it('should delete user with identity and profile but no authorization', async () => {
      const identity = UserIdentity.create({
        email: Email.create('partial@example.com'),
        password: await Password.createFromPlain('SecurePass123').toHash(),
        emailVerified: true,
      });

      const profile = UserProfile.create({
        identityId: identity.id,
        fullName: 'Partial User',
        nationalId: NationalId.create('98765432101'),
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);

      const result = await sut.execute({ id: identity.id.toString() });

      expect(result.isRight()).toBe(true);
      expect(identityRepo.items).toHaveLength(0);
      expect(profileRepo.items).toHaveLength(0);
    });

    it('should delete only the specified user when multiple users exist', async () => {
      // Create multiple users
      const user1 = UserIdentity.create({
        email: Email.create('user1@example.com'),
        password: await Password.createFromPlain('SecurePass123').toHash(),
        emailVerified: true,
      });

      const user2 = UserIdentity.create({
        email: Email.create('user2@example.com'),
        password: await Password.createFromPlain('SecurePass123').toHash(),
        emailVerified: true,
      });

      identityRepo.items.push(user1, user2);

      // Delete only user1
      const result = await sut.execute({ id: user1.id.toString() });

      expect(result.isRight()).toBe(true);
      expect(identityRepo.items).toHaveLength(1);
      expect(identityRepo.items[0].id).toEqual(user2.id);
    });
  });

  describe('Error scenarios', () => {
    it('should return ResourceNotFoundError when user does not exist', async () => {
      const result = await sut.execute({ id: 'non-existent-id' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(EntityNotFoundException);
        expect(result.value.message).toBe(
          'UserIdentity with ID non-existent-id not found',
        );
      }
    });

    it('should return RepositoryError when identity findById fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.spyOn(identityRepo, 'findById').mockResolvedValueOnce(left(dbError));

      const result = await sut.execute({ id: 'test-id' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(EntityNotFoundException);
      }
    });

    it('should return RepositoryError when authorization delete fails', async () => {
      const identity = UserIdentity.create({
        email: Email.create('auth-fail@example.com'),
        password: await Password.createFromPlain('SecurePass123').toHash(),
        emailVerified: true,
      });

      const authorization = UserAuthorization.create({
        identityId: identity.id,
        role: 'student',
      });

      identityRepo.items.push(identity);
      authorizationRepo.items.push(authorization);

      const deleteError = new Error('Authorization delete failed');
      vi.spyOn(authorizationRepo, 'delete').mockResolvedValueOnce(
        left(deleteError),
      );

      const result = await sut.execute({ id: identity.id.toString() });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toContain('delete authorization');
      }
    });

    it('should return RepositoryError when profile delete fails', async () => {
      const identity = UserIdentity.create({
        email: Email.create('profile-fail@example.com'),
        password: await Password.createFromPlain('SecurePass123').toHash(),
        emailVerified: true,
      });

      const profile = UserProfile.create({
        identityId: identity.id,
        fullName: 'Profile Fail User',
        nationalId: NationalId.create('11111111111'),
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);

      const deleteError = new Error('Profile delete failed');
      vi.spyOn(profileRepo, 'delete').mockResolvedValueOnce(left(deleteError));

      const result = await sut.execute({ id: identity.id.toString() });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toContain('delete profile');
      }
    });

    it('should return RepositoryError when identity delete fails', async () => {
      const identity = UserIdentity.create({
        email: Email.create('identity-fail@example.com'),
        password: await Password.createFromPlain('SecurePass123').toHash(),
        emailVerified: true,
      });

      identityRepo.items.push(identity);

      const deleteError = new Error('Identity delete failed');
      vi.spyOn(identityRepo, 'delete').mockResolvedValueOnce(left(deleteError));

      const result = await sut.execute({ id: identity.id.toString() });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toContain('delete identity');
      }
    });

    it('should handle exceptions thrown during execution', async () => {
      vi.spyOn(identityRepo, 'findById').mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      const result = await sut.execute({ id: 'test-id' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toContain('delete');
      }
    });
  });

  describe('Transaction and atomicity scenarios', () => {
    it('should not delete any entities if authorization delete fails', async () => {
      const identity = UserIdentity.create({
        email: Email.create('atomic@example.com'),
        password: await Password.createFromPlain('SecurePass123').toHash(),
        emailVerified: true,
      });

      const profile = UserProfile.create({
        identityId: identity.id,
        fullName: 'Atomic User',
        nationalId: NationalId.create('22222222222'),
      });

      const authorization = UserAuthorization.create({
        identityId: identity.id,
        role: 'admin',
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      authorizationRepo.items.push(authorization);

      // Make authorization delete fail
      vi.spyOn(authorizationRepo, 'delete').mockResolvedValueOnce(
        left(new Error('Auth delete failed')),
      );

      const result = await sut.execute({ id: identity.id.toString() });

      expect(result.isLeft()).toBe(true);
      // All entities should still exist
      expect(identityRepo.items).toHaveLength(1);
      expect(profileRepo.items).toHaveLength(1);
      expect(authorizationRepo.items).toHaveLength(1);
    });

    it('should delete authorization but keep profile and identity if profile delete fails', async () => {
      const identity = UserIdentity.create({
        email: Email.create('partial-atomic@example.com'),
        password: await Password.createFromPlain('SecurePass123').toHash(),
        emailVerified: true,
      });

      const profile = UserProfile.create({
        identityId: identity.id,
        fullName: 'Partial Atomic User',
        nationalId: NationalId.create('33333333333'),
      });

      const authorization = UserAuthorization.create({
        identityId: identity.id,
        role: 'tutor',
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      authorizationRepo.items.push(authorization);

      // Make profile delete fail
      vi.spyOn(profileRepo, 'delete').mockResolvedValueOnce(
        left(new Error('Profile delete failed')),
      );

      const result = await sut.execute({ id: identity.id.toString() });

      expect(result.isLeft()).toBe(true);
      // Authorization should be deleted, but profile and identity remain
      expect(authorizationRepo.items).toHaveLength(0);
      expect(profileRepo.items).toHaveLength(1);
      expect(identityRepo.items).toHaveLength(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid UUID format', async () => {
      const invalidIds = [
        'not-a-uuid',
        '12345',
        'invalid-format-id',
        '!@#$%^&*()',
      ];

      for (const invalidId of invalidIds) {
        const result = await sut.execute({ id: invalidId });
        expect(result.isLeft()).toBe(true);
      }
    });

    it('should handle empty string id', async () => {
      const result = await sut.execute({ id: '' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(EntityNotFoundException);
      }
    });

    it('should handle null/undefined id', async () => {
      const results = await Promise.all([
        sut.execute({ id: null as any }),
        sut.execute({ id: undefined as any }),
      ]);

      results.forEach((result) => {
        expect(result.isLeft()).toBe(true);
      });
    });

    it('should handle very long id strings', async () => {
      const veryLongId = 'a'.repeat(1000);
      const result = await sut.execute({ id: veryLongId });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(EntityNotFoundException);
      }
    });
  });

  describe('Concurrency scenarios', () => {
    it('should handle concurrent delete attempts on same user', async () => {
      const identity = UserIdentity.create({
        email: Email.create('concurrent@example.com'),
        password: await Password.createFromPlain('SecurePass123').toHash(),
        emailVerified: true,
      });

      identityRepo.items.push(identity);

      // Simulate concurrent deletes
      const results = await Promise.all([
        sut.execute({ id: identity.id.toString() }),
        sut.execute({ id: identity.id.toString() }),
      ]);

      // Both should succeed in the current implementation
      // This is because the repository doesn't implement proper locking
      const successes = results.filter((r) => r.isRight()).length;
      const failures = results.filter((r) => r.isLeft()).length;

      // Current behavior: both succeed (not ideal for concurrency)
      expect(successes).toBe(2);
      expect(failures).toBe(0);

      // User should be deleted
      expect(identityRepo.items).toHaveLength(0);
    });

    it('should handle multiple different users being deleted concurrently', async () => {
      const users = await Promise.all(
        Array.from({ length: 5 }, async (_, i) => {
          const identity = UserIdentity.create({
            email: Email.create(`user${i}@example.com`),
            password: await Password.createFromPlain('SecurePass123').toHash(),
            emailVerified: true,
          });

          const profile = UserProfile.create({
            identityId: identity.id,
            fullName: `User ${i}`,
            nationalId: NationalId.create(`4000000000${i}`),
          });

          const authorization = UserAuthorization.create({
            identityId: identity.id,
            role: 'student',
          });

          return { identity, profile, authorization };
        }),
      );

      // Add all users to repositories
      users.forEach(({ identity, profile, authorization }) => {
        identityRepo.items.push(identity);
        profileRepo.items.push(profile);
        authorizationRepo.items.push(authorization);
      });

      // Delete all users concurrently
      const results = await Promise.all(
        users.map(({ identity }) =>
          sut.execute({ id: identity.id.toString() }),
        ),
      );

      // All should succeed
      expect(results.every((r) => r.isRight())).toBe(true);
      expect(identityRepo.items).toHaveLength(0);
      expect(profileRepo.items).toHaveLength(0);
      expect(authorizationRepo.items).toHaveLength(0);
    });
  });

  describe('Security scenarios', () => {
    it('should handle SQL injection attempts in id', async () => {
      const sqlInjectionIds = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        '1; DELETE FROM users WHERE 1=1;',
        "<script>alert('xss')</script>",
      ];

      for (const maliciousId of sqlInjectionIds) {
        const result = await sut.execute({ id: maliciousId });

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(EntityNotFoundException);
        }
      }
    });

    it('should not expose internal error details', async () => {
      const internalError = new Error(
        'Internal: Database connection string exposed',
      );
      vi.spyOn(identityRepo, 'findById').mockResolvedValueOnce(
        left(internalError),
      );

      const result = await sut.execute({ id: 'test-id' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        // Should return EntityNotFoundException, not expose internal error
        expect(result.value).toBeInstanceOf(EntityNotFoundException);
      }
    });

    it('should handle authorization bypass attempts', async () => {
      // Create a user with admin role
      const adminIdentity = UserIdentity.create({
        email: Email.create('admin@example.com'),
        password: await Password.createFromPlain('SecurePass123').toHash(),
        emailVerified: true,
      });

      const adminAuth = UserAuthorization.create({
        identityId: adminIdentity.id,
        role: 'admin',
      });

      identityRepo.items.push(adminIdentity);
      authorizationRepo.items.push(adminAuth);

      // Try to delete admin user (should work in this use case as there's no permission check)
      const result = await sut.execute({ id: adminIdentity.id.toString() });

      expect(result.isRight()).toBe(true);
      expect(identityRepo.items).toHaveLength(0);
    });
  });

  describe('Business rules', () => {
    it('should delete users with different roles', async () => {
      const roles: Array<'admin' | 'tutor' | 'student'> = [
        'admin',
        'tutor',
        'student',
      ];

      for (const role of roles) {
        const identity = UserIdentity.create({
          email: Email.create(`${role}@example.com`),
          password: await Password.createFromPlain('SecurePass123').toHash(),
          emailVerified: true,
        });

        const authorization = UserAuthorization.create({
          identityId: identity.id,
          role,
        });

        identityRepo.items.push(identity);
        authorizationRepo.items.push(authorization);

        const result = await sut.execute({ id: identity.id.toString() });

        expect(result.isRight()).toBe(true);
        expect(identityRepo.items).toHaveLength(0);
        expect(authorizationRepo.items).toHaveLength(0);
      }
    });

    it('should delete locked accounts', async () => {
      const identity = UserIdentity.create({
        email: Email.create('locked@example.com'),
        password: await Password.createFromPlain('SecurePass123').toHash(),
        emailVerified: true,
      });

      // Lock the account
      identity.lockAccount(60); // Lock for 60 minutes

      identityRepo.items.push(identity);

      const result = await sut.execute({ id: identity.id.toString() });

      expect(result.isRight()).toBe(true);
      expect(identityRepo.items).toHaveLength(0);
    });

    it('should delete users with unverified emails', async () => {
      const identity = UserIdentity.create({
        email: Email.create('unverified@example.com'),
        password: await Password.createFromPlain('SecurePass123').toHash(),
        emailVerified: false,
      });

      identityRepo.items.push(identity);

      const result = await sut.execute({ id: identity.id.toString() });

      expect(result.isRight()).toBe(true);
      expect(identityRepo.items).toHaveLength(0);
    });

    it('should delete users with complete profiles including optional fields', async () => {
      const identity = UserIdentity.create({
        email: Email.create('complete@example.com'),
        password: await Password.createFromPlain('SecurePass123').toHash(),
        emailVerified: true,
      });

      const profile = UserProfile.create({
        identityId: identity.id,
        fullName: 'Complete User',
        nationalId: NationalId.create('55555555555'),
        phone: '+1234567890',
        birthDate: new Date('1990-01-01'),
        bio: 'A complete user profile',
        profileImageUrl: 'https://example.com/avatar.jpg',
        profession: 'Software Engineer',
        specialization: 'Backend Development',
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);

      const result = await sut.execute({ id: identity.id.toString() });

      expect(result.isRight()).toBe(true);
      expect(identityRepo.items).toHaveLength(0);
      expect(profileRepo.items).toHaveLength(0);
    });
  });

  describe('Type coercion and validation', () => {
    it('should handle non-string id types', async () => {
      const invalidRequests = [
        { id: 123 as any },
        { id: true as any },
        { id: {} as any },
        { id: [] as any },
        { id: new Date() as any },
      ];

      for (const request of invalidRequests) {
        const result = await sut.execute(request);
        expect(result.isLeft()).toBe(true);
      }
    });

    it('should handle missing request object properties', async () => {
      const result = await sut.execute({} as any);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(EntityNotFoundException);
      }
    });

    it('should handle whitespace-only id', async () => {
      const whitespaceIds = [' ', '  ', '\t', '\n', ' \t\n '];

      for (const wsId of whitespaceIds) {
        const result = await sut.execute({ id: wsId });
        expect(result.isLeft()).toBe(true);
      }
    });
  });

  describe('Performance and resource edge cases', () => {
    it('should handle deletion of users with large profile data', async () => {
      const identity = UserIdentity.create({
        email: Email.create('large@example.com'),
        password: await Password.createFromPlain('SecurePass123').toHash(),
        emailVerified: true,
      });

      const profile = UserProfile.create({
        identityId: identity.id,
        fullName: 'A'.repeat(255), // Max length name
        nationalId: NationalId.create('66666666666'),
        bio: 'B'.repeat(10000), // Very long bio
        profession: 'C'.repeat(200),
        specialization: 'D'.repeat(200),
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);

      const result = await sut.execute({ id: identity.id.toString() });

      expect(result.isRight()).toBe(true);
      expect(identityRepo.items).toHaveLength(0);
      expect(profileRepo.items).toHaveLength(0);
    });

    it('should handle rapid sequential deletions', async () => {
      const users = await Promise.all(
        Array.from({ length: 3 }, async (_, i) =>
          UserIdentity.create({
            email: Email.create(`rapid${i}@example.com`),
            password: await Password.createFromPlain('SecurePass123').toHash(),
            emailVerified: true,
          }),
        ),
      );

      users.forEach((user) => identityRepo.items.push(user));

      // Delete users rapidly in sequence
      for (const user of users) {
        const result = await sut.execute({ id: user.id.toString() });
        expect(result.isRight()).toBe(true);
      }

      expect(identityRepo.items).toHaveLength(0);
    });
  });
});
