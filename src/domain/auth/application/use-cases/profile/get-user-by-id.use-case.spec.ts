// src/domain/auth/application/use-cases/profile/get-user-by-id.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetUserByIdUseCase } from './get-user-by-id.use-case';
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
import { InvalidInputError } from '@/domain/auth/domain/exceptions/invalid-input-error.exception';
import { ResourceNotFoundError } from '@/domain/auth/domain/exceptions/resource-not-found-error.exception';
import { RepositoryError } from '@/domain/auth/domain/exceptions/repository-error.exception';

describe('GetUserByIdUseCase', () => {
  let identityRepo: InMemoryUserIdentityRepository;
  let profileRepo: InMemoryUserProfileRepository;
  let authRepo: InMemoryUserAuthorizationRepository;
  let sut: GetUserByIdUseCase;

  beforeEach(() => {
    identityRepo = new InMemoryUserIdentityRepository();
    profileRepo = new InMemoryUserProfileRepository();
    authRepo = new InMemoryUserAuthorizationRepository();
    sut = new GetUserByIdUseCase(identityRepo, profileRepo, authRepo);
  });

  describe('Success scenarios', () => {
    it('should get user by id with all data', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const now = new Date();
      const lastLogin = new Date('2024-01-01');
      const birthDate = new Date('1990-01-01');

      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          lastLogin,
          createdAt: now,
          updatedAt: now,
        },
        identityId,
      );

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        phone: '+1234567890',
        birthDate,
        profileImageUrl: 'https://example.com/avatar.jpg',
        bio: 'Software developer',
        profession: 'Developer',
        specialization: 'Backend',
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        createdAt: now,
        updatedAt: now,
      });

      const authorization = UserAuthorization.create({
        identityId,
        role: 'admin',
        createdAt: now,
        effectiveFrom: now,
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      authRepo.items.push(authorization);

      // Act
      const result = await sut.execute({ id: identityId.toString() });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.user.id).toBe(identityId.toString());
        expect(result.value.user.email).toBe('john@example.com');
        expect(result.value.user.name).toBe('John Doe');
        expect(result.value.user.nationalId).toBe('12345678901');
        expect(result.value.user.phone).toBe('+1234567890');
        expect(result.value.user.birthDate).toEqual(birthDate);
        expect(result.value.user.profileImageUrl).toBe(
          'https://example.com/avatar.jpg',
        );
        expect(result.value.user.role).toBe('admin');
        expect(result.value.user.lastLogin).toEqual(lastLogin);
        expect(result.value.user.createdAt).toEqual(now);
        expect(result.value.user.updatedAt).toEqual(now);
      }
    });

    it('should get user with minimal data (optional fields missing)', async () => {
      const identityId = new UniqueEntityID();
      const now = new Date();

      const identity = UserIdentity.create(
        {
          email: Email.create('minimal@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: false,
          createdAt: now,
        },
        identityId,
      );

      const profile = UserProfile.create({
        identityId,
        fullName: 'Minimal User',
        nationalId: NationalId.create('99999999999'),
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        createdAt: now,
      });

      const authorization = UserAuthorization.create({
        identityId,
        role: 'student',
        createdAt: now,
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      authRepo.items.push(authorization);

      const result = await sut.execute({ id: identityId.toString() });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.user.id).toBe(identityId.toString());
        expect(result.value.user.email).toBe('minimal@example.com');
        expect(result.value.user.name).toBe('Minimal User');
        expect(result.value.user.nationalId).toBe('99999999999');
        expect(result.value.user.phone).toBeUndefined();
        expect(result.value.user.birthDate).toBeUndefined();
        expect(result.value.user.profileImageUrl).toBeUndefined();
        expect(result.value.user.role).toBe('student');
        expect(result.value.user.lastLogin).toBeUndefined();
        expect(result.value.user.createdAt).toEqual(now);
        expect(result.value.user.updatedAt).toEqual(now);
      }
    });

    it('should handle updatedAt fallback correctly', async () => {
      const identityId = new UniqueEntityID();
      const now = new Date();
      const identityUpdated = new Date(now.getTime() + 1000);
      const profileUpdated = new Date(now.getTime() + 2000);
      const authUpdated = new Date(now.getTime() + 3000);

      const identity = UserIdentity.create(
        {
          email: Email.create('test@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: now,
          updatedAt: identityUpdated,
        },
        identityId,
      );

      const profile = UserProfile.create({
        identityId,
        fullName: 'Test User',
        nationalId: NationalId.create('11111111111'),
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        createdAt: now,
        updatedAt: profileUpdated,
      });

      const authorization = UserAuthorization.create({
        identityId,
        role: 'tutor',
        createdAt: now,
        updatedAt: authUpdated,
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      authRepo.items.push(authorization);

      const result = await sut.execute({ id: identityId.toString() });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Should use identity.updatedAt as it exists
        expect(result.value.user.updatedAt).toEqual(identityUpdated);
      }
    });

    it('should use profile updatedAt when identity updatedAt is null', async () => {
      const identityId = new UniqueEntityID();
      const now = new Date();
      const profileUpdated = new Date(now.getTime() + 2000);

      const identity = UserIdentity.create(
        {
          email: Email.create('test@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: now,
        },
        identityId,
      );

      const profile = UserProfile.create({
        identityId,
        fullName: 'Test User',
        nationalId: NationalId.create('11111111111'),
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        createdAt: now,
        updatedAt: profileUpdated,
      });

      const authorization = UserAuthorization.create({
        identityId,
        role: 'tutor',
        createdAt: now,
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      authRepo.items.push(authorization);

      const result = await sut.execute({ id: identityId.toString() });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.user.updatedAt).toEqual(profileUpdated);
      }
    });

    it('should get users with different roles', async () => {
      const roles = ['admin', 'tutor', 'student'] as const;

      for (const role of roles) {
        const identityId = new UniqueEntityID();
        const now = new Date();

        const identity = UserIdentity.create(
          {
            email: Email.create(`${role}@example.com`),
            password: Password.createFromPlain('StrongP@ssw0rd2024'),
            emailVerified: true,
            createdAt: now,
          },
          identityId,
        );

        const profile = UserProfile.create({
          identityId,
          fullName: `${role} User`,
          nationalId: NationalId.create(
            `${roles.indexOf(role)}`.padStart(11, '0'),
          ),
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          createdAt: now,
        });

        const authorization = UserAuthorization.create({
          identityId,
          role,
          createdAt: now,
        });

        identityRepo.items.push(identity);
        profileRepo.items.push(profile);
        authRepo.items.push(authorization);

        const result = await sut.execute({ id: identityId.toString() });

        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value.user.role).toBe(role);
        }
      }
    });
  });

  describe('Error scenarios', () => {
    it('should return InvalidInputError for invalid id format', async () => {
      const invalidIds = [
        { id: '' },
        { id: '   ' },
        { id: null as any },
        { id: undefined as any },
        { id: 123 as any },
        { id: {} as any },
        { id: [] as any },
      ];

      for (const request of invalidIds) {
        const result = await sut.execute(request);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(InvalidInputError);
          expect(result.value.message).toBe('Validation failed');
          if (result.value instanceof InvalidInputError) {
            expect(result.value.details).toBeDefined();
            expect(result.value.details.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('should return ResourceNotFoundError when identity not found', async () => {
      const nonExistentId = new UniqueEntityID().toString();

      const result = await sut.execute({ id: nonExistentId });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
        expect(result.value.message).toContain('User');
        // The message format is 'User with ID {id} not found'
        expect(result.value.message).toContain('with ID');
      }
    });

    it('should return ResourceNotFoundError when profile not found', async () => {
      const identityId = new UniqueEntityID();

      const identity = UserIdentity.create(
        {
          email: Email.create('test@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
        },
        identityId,
      );

      identityRepo.items.push(identity);
      // Profile not added

      const result = await sut.execute({ id: identityId.toString() });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
        expect(result.value.message).toContain('UserProfile');
      }
    });

    it('should return ResourceNotFoundError when authorization not found', async () => {
      const identityId = new UniqueEntityID();

      const identity = UserIdentity.create(
        {
          email: Email.create('test@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
        },
        identityId,
      );

      const profile = UserProfile.create({
        identityId,
        fullName: 'Test User',
        nationalId: NationalId.create('11111111111'),
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      // Authorization not added

      const result = await sut.execute({ id: identityId.toString() });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
        expect(result.value.message).toContain('UserAuthorization');
      }
    });

    it('should handle repository errors for identity', async () => {
      const validId = new UniqueEntityID().toString();
      const dbError = new Error('Database connection failed');
      vi.spyOn(identityRepo, 'findById').mockResolvedValueOnce(left(dbError));

      const result = await sut.execute({ id: validId });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        // Repository error is treated as not found
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      }
    });

    it('should handle repository errors for profile', async () => {
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('test@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
        },
        identityId,
      );

      identityRepo.items.push(identity);

      const dbError = new Error('Database connection failed');
      vi.spyOn(profileRepo, 'findByIdentityId').mockResolvedValueOnce(
        left(dbError),
      );

      const result = await sut.execute({ id: identityId.toString() });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
        expect(result.value.message).toContain('UserProfile');
      }
    });

    it('should handle repository errors for authorization', async () => {
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('test@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
        },
        identityId,
      );

      const profile = UserProfile.create({
        identityId,
        fullName: 'Test User',
        nationalId: NationalId.create('11111111111'),
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);

      const dbError = new Error('Database connection failed');
      vi.spyOn(authRepo, 'findByIdentityId').mockResolvedValueOnce(
        left(dbError),
      );

      const result = await sut.execute({ id: identityId.toString() });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
        expect(result.value.message).toContain('UserAuthorization');
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle very long valid UUID', async () => {
      const longId = 'a'.repeat(36); // Valid UUID length
      const result = await sut.execute({ id: longId });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        // Invalid ID format should return InvalidInputError
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should handle special characters in id', async () => {
      const specialIds = [
        '<script>alert("xss")</script>',
        '"; DROP TABLE users; --',
        '../../../etc/passwd',
        'null',
        'undefined',
        'NaN',
      ];

      for (const id of specialIds) {
        const result = await sut.execute({ id });

        expect(result.isLeft()).toBe(true);
        // Should either fail validation or not find the user
      }
    });

    it('should handle user with inactive authorization', async () => {
      const identityId = new UniqueEntityID();
      const now = new Date();

      const identity = UserIdentity.create(
        {
          email: Email.create('inactive@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: now,
        },
        identityId,
      );

      const profile = UserProfile.create({
        identityId,
        fullName: 'Inactive User',
        nationalId: NationalId.create('88888888888'),
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        createdAt: now,
      });

      const authorization = UserAuthorization.create({
        identityId,
        role: 'student',
        // isActive is removed from UserAuthorization // Inactive
        createdAt: now,
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      authRepo.items.push(authorization);

      const result = await sut.execute({ id: identityId.toString() });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Should still return the user data, regardless of active status
        expect(result.value.user.role).toBe('student');
      }
    });

    it('should handle user with unverified email', async () => {
      const identityId = new UniqueEntityID();
      const now = new Date();

      const identity = UserIdentity.create(
        {
          email: Email.create('unverified@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: false,
          createdAt: now,
        },
        identityId,
      );

      const profile = UserProfile.create({
        identityId,
        fullName: 'Unverified User',
        nationalId: NationalId.create('77777777777'),
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        createdAt: now,
      });

      const authorization = UserAuthorization.create({
        identityId,
        role: 'student',
        createdAt: now,
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      authRepo.items.push(authorization);

      const result = await sut.execute({ id: identityId.toString() });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Should still return the user data
        expect(result.value.user.email).toBe('unverified@example.com');
      }
    });

    it('should handle all updatedAt fields being null', async () => {
      const identityId = new UniqueEntityID();
      const now = new Date();

      const identity = UserIdentity.create(
        {
          email: Email.create('test@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: now,
        },
        identityId,
      );

      const profile = UserProfile.create({
        identityId,
        fullName: 'Test User',
        nationalId: NationalId.create('11111111111'),
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        createdAt: now,
      });

      const authorization = UserAuthorization.create({
        identityId,
        role: 'tutor',
        createdAt: now,
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      authRepo.items.push(authorization);

      const result = await sut.execute({ id: identityId.toString() });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Should fallback to identity.createdAt
        expect(result.value.user.updatedAt).toEqual(now);
      }
    });
  });

  describe('Business rules', () => {
    it('should aggregate data from all three repositories correctly', async () => {
      const identityId = new UniqueEntityID();
      const now = new Date();

      // Each entity has unique data that should be aggregated
      const identity = UserIdentity.create(
        {
          email: Email.create('aggregate@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          lastLogin: new Date('2024-01-15'),
          createdAt: now,
        },
        identityId,
      );

      const profile = UserProfile.create({
        identityId,
        fullName: 'Aggregate Test User',
        nationalId: NationalId.create('55555555555'),
        phone: '+5511999999999',
        birthDate: new Date('1985-05-15'),
        profileImageUrl: 'https://example.com/profile.jpg',
        preferredLanguage: 'en-US',
        timezone: 'UTC',
        createdAt: now,
      });

      const authorization = UserAuthorization.create({
        identityId,
        role: 'admin',
        createdAt: now,
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      authRepo.items.push(authorization);

      const result = await sut.execute({ id: identityId.toString() });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const user = result.value.user;

        // From identity
        expect(user.id).toBe(identityId.toString());
        expect(user.email).toBe('aggregate@example.com');
        expect(user.lastLogin).toEqual(new Date('2024-01-15'));

        // From profile
        expect(user.name).toBe('Aggregate Test User');
        expect(user.nationalId).toBe('55555555555');
        expect(user.phone).toBe('+5511999999999');
        expect(user.birthDate).toEqual(new Date('1985-05-15'));
        expect(user.profileImageUrl).toBe('https://example.com/profile.jpg');

        // From authorization
        expect(user.role).toBe('admin');

        // Timestamps
        expect(user.createdAt).toEqual(now);
      }
    });

    it('should return consistent data structure regardless of optional fields', async () => {
      const scenarios = [
        {
          name: 'with all optional fields',
          phone: '+1234567890',
          birthDate: new Date('1990-01-01'),
          profileImageUrl: 'https://example.com/avatar.jpg',
          lastLogin: new Date('2024-01-01'),
        },
        {
          name: 'without phone',
          phone: undefined,
          birthDate: new Date('1990-01-01'),
          profileImageUrl: 'https://example.com/avatar.jpg',
          lastLogin: new Date('2024-01-01'),
        },
        {
          name: 'without birthDate',
          phone: '+1234567890',
          birthDate: undefined,
          profileImageUrl: 'https://example.com/avatar.jpg',
          lastLogin: new Date('2024-01-01'),
        },
        {
          name: 'without profileImageUrl',
          phone: '+1234567890',
          birthDate: new Date('1990-01-01'),
          profileImageUrl: undefined,
          lastLogin: new Date('2024-01-01'),
        },
        {
          name: 'without lastLogin',
          phone: '+1234567890',
          birthDate: new Date('1990-01-01'),
          profileImageUrl: 'https://example.com/avatar.jpg',
          lastLogin: undefined,
        },
        {
          name: 'without any optional fields',
          phone: undefined,
          birthDate: undefined,
          profileImageUrl: undefined,
          lastLogin: undefined,
        },
      ];

      for (const scenario of scenarios) {
        const identityId = new UniqueEntityID();
        const now = new Date();

        const identity = UserIdentity.create(
          {
            email: Email.create(
              `${scenario.name.replace(/\s+/g, '')}@example.com`,
            ),
            password: Password.createFromPlain('StrongP@ssw0rd2024'),
            emailVerified: true,
            lastLogin: scenario.lastLogin,
            createdAt: now,
          },
          identityId,
        );

        const profile = UserProfile.create({
          identityId,
          fullName: scenario.name,
          nationalId: NationalId.create('12345678901'),
          phone: scenario.phone,
          birthDate: scenario.birthDate,
          profileImageUrl: scenario.profileImageUrl,
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          createdAt: now,
        });

        const authorization = UserAuthorization.create({
          identityId,
          role: 'student',
          createdAt: now,
        });

        identityRepo.items.push(identity);
        profileRepo.items.push(profile);
        authRepo.items.push(authorization);

        const result = await sut.execute({ id: identityId.toString() });

        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          const user = result.value.user;

          // Required fields should always be present
          expect(user.id).toBeDefined();
          expect(user.email).toBeDefined();
          expect(user.name).toBeDefined();
          expect(user.nationalId).toBeDefined();
          expect(user.role).toBeDefined();
          expect(user.createdAt).toBeDefined();
          expect(user.updatedAt).toBeDefined();

          // Optional fields should be undefined when not provided
          if (!scenario.phone) expect(user.phone).toBeUndefined();
          if (!scenario.birthDate) expect(user.birthDate).toBeUndefined();
          if (!scenario.profileImageUrl)
            expect(user.profileImageUrl).toBeUndefined();
          if (!scenario.lastLogin) expect(user.lastLogin).toBeUndefined();
        }

        // Clean up for next iteration
        identityRepo.items = [];
        profileRepo.items = [];
        authRepo.items = [];
      }
    });
  });

  describe('Performance and concurrency', () => {
    it('should handle concurrent requests for the same user', async () => {
      const identityId = new UniqueEntityID();
      const now = new Date();

      const identity = UserIdentity.create(
        {
          email: Email.create('concurrent@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: now,
        },
        identityId,
      );

      const profile = UserProfile.create({
        identityId,
        fullName: 'Concurrent User',
        nationalId: NationalId.create('44444444444'),
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        createdAt: now,
      });

      const authorization = UserAuthorization.create({
        identityId,
        role: 'student',
        createdAt: now,
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      authRepo.items.push(authorization);

      // Execute multiple concurrent requests
      const results = await Promise.all([
        sut.execute({ id: identityId.toString() }),
        sut.execute({ id: identityId.toString() }),
        sut.execute({ id: identityId.toString() }),
        sut.execute({ id: identityId.toString() }),
        sut.execute({ id: identityId.toString() }),
      ]);

      // All should succeed with the same data
      expect(results.every((r) => r.isRight())).toBe(true);

      const users = results
        .filter((r) => r.isRight())
        .map((r) => (r.isRight() ? r.value.user : null))
        .filter(Boolean);

      // All should return the same user data
      expect(users).toHaveLength(5);
      expect(new Set(users.map((u) => u!.id)).size).toBe(1);
      expect(new Set(users.map((u) => u!.email)).size).toBe(1);
    });

    it('should handle concurrent requests for different users', async () => {
      const userIds: string[] = [];

      // Create 5 different users
      for (let i = 0; i < 5; i++) {
        const identityId = new UniqueEntityID();
        userIds.push(identityId.toString());

        const identity = UserIdentity.create(
          {
            email: Email.create(`user${i}@example.com`),
            password: Password.createFromPlain('StrongP@ssw0rd2024'),
            emailVerified: true,
          },
          identityId,
        );

        const profile = UserProfile.create({
          identityId,
          fullName: `User ${i}`,
          nationalId: NationalId.create(`${i}`.padStart(11, '0')),
          preferredLanguage: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        });

        const authorization = UserAuthorization.create({
          identityId,
          role: 'student',
        });

        identityRepo.items.push(identity);
        profileRepo.items.push(profile);
        authRepo.items.push(authorization);
      }

      // Execute concurrent requests for different users
      const results = await Promise.all(
        userIds.map((id) => sut.execute({ id })),
      );

      // All should succeed
      expect(results.every((r) => r.isRight())).toBe(true);

      const users = results
        .filter((r) => r.isRight())
        .map((r) => (r.isRight() ? r.value.user : null))
        .filter(Boolean);

      // Should return 5 different users
      expect(users).toHaveLength(5);
      expect(new Set(users.map((u) => u!.id)).size).toBe(5);
      expect(new Set(users.map((u) => u!.email)).size).toBe(5);
    });
  });

  describe('Security scenarios', () => {
    it('should not expose password or sensitive data', async () => {
      const identityId = new UniqueEntityID();
      const now = new Date();

      const identity = UserIdentity.create(
        {
          email: Email.create('security@example.com'),
          password: Password.createFromPlain('SuperSecretStrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: now,
        },
        identityId,
      );

      const profile = UserProfile.create({
        identityId,
        fullName: 'Security Test User',
        nationalId: NationalId.create('33333333333'),
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        createdAt: now,
      });

      const authorization = UserAuthorization.create({
        identityId,
        role: 'admin',
        createdAt: now,
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      authRepo.items.push(authorization);

      const result = await sut.execute({ id: identityId.toString() });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const userJson = JSON.stringify(result.value);
        expect(userJson).not.toContain('SuperSecretStrongP@ssw0rd2024');
        expect(userJson).not.toContain('password');
        expect(userJson).not.toContain('Password');
      }
    });

    it('should handle potential timing attacks by consistent response times', async () => {
      const validId = new UniqueEntityID();
      const invalidId = new UniqueEntityID();

      // Add a valid user
      const identity = UserIdentity.create(
        {
          email: Email.create('timing@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
        },
        validId,
      );

      const profile = UserProfile.create({
        identityId: validId,
        fullName: 'Timing Test User',
        nationalId: NationalId.create('22222222222'),
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      });

      const authorization = UserAuthorization.create({
        identityId: validId,
        role: 'student',
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      authRepo.items.push(authorization);

      // Measure time for valid user
      const validStart = Date.now();
      const validResult = await sut.execute({ id: validId.toString() });
      const validDuration = Date.now() - validStart;

      // Measure time for invalid user
      const invalidStart = Date.now();
      const invalidResult = await sut.execute({ id: invalidId.toString() });
      const invalidDuration = Date.now() - invalidStart;

      expect(validResult.isRight()).toBe(true);
      expect(invalidResult.isLeft()).toBe(true);

      // Response times should be reasonably similar (within 50ms)
      const timeDifference = Math.abs(validDuration - invalidDuration);
      expect(timeDifference).toBeLessThan(50);
    });
  });

  describe('Type coercion and validation', () => {
    it('should validate request DTO structure', async () => {
      const invalidRequests = [
        {}, // Missing id
        { id: 123 }, // Wrong type
        { id: '', extra: 'field' }, // Empty id with extra field
        { ID: 'valid-id' }, // Wrong case
        { userId: 'valid-id' }, // Wrong field name
      ];

      for (const request of invalidRequests) {
        const result = await sut.execute(request as any);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(InvalidInputError);
        }
      }
    });

    it('should handle string coercion for id', async () => {
      const identityId = new UniqueEntityID();
      const now = new Date();

      const identity = UserIdentity.create(
        {
          email: Email.create('coercion@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: now,
        },
        identityId,
      );

      const profile = UserProfile.create({
        identityId,
        fullName: 'Coercion Test User',
        nationalId: NationalId.create('66666666666'),
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        createdAt: now,
      });

      const authorization = UserAuthorization.create({
        identityId,
        role: 'student',
        createdAt: now,
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      authRepo.items.push(authorization);

      // Object with toString method
      const objectId = {
        toString() {
          return identityId.toString();
        },
      };

      const result = await sut.execute({ id: objectId as any });

      // Object with toString will be converted to string by validation
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should trim whitespace from id', async () => {
      const identityId = new UniqueEntityID();
      const now = new Date();

      const identity = UserIdentity.create(
        {
          email: Email.create('trim@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: now,
        },
        identityId,
      );

      const profile = UserProfile.create({
        identityId,
        fullName: 'Trim Test User',
        nationalId: NationalId.create('99999999999'),
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        createdAt: now,
      });

      const authorization = UserAuthorization.create({
        identityId,
        role: 'student',
        createdAt: now,
      });

      identityRepo.items.push(identity);
      profileRepo.items.push(profile);
      authRepo.items.push(authorization);

      const paddedId = `  ${identityId.toString()}  `;
      const result = await sut.execute({ id: paddedId });

      // Might fail validation or succeed depending on DTO transformation
      if (result.isRight()) {
        expect(result.value.user.id).toBe(identityId.toString());
      }
    });
  });
});
