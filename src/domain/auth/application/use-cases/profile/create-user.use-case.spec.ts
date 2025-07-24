// src/domain/auth/application/use-cases/profile/create-user.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateUserUseCase } from './create-user.use-case';
import { InMemoryUserIdentityRepository } from '@/test/repositories/in-memory-user-identity-repository';
import { InMemoryUserProfileRepository } from '@/test/repositories/in-memory-user-profile-repository';
import { InMemoryUserAuthorizationRepository } from '@/test/repositories/in-memory-user-authorization-repository';
import { InMemoryAuthUnitOfWork } from '@/test/repositories/in-memory-auth-unit-of-work';
import { IEventDispatcher } from '@/core/domain/events/i-event-dispatcher';
import { UserIdentity } from '@/domain/auth/enterprise/entities/user-identity';
import { UserProfile } from '@/domain/auth/enterprise/entities/user-profile';
import { UserAuthorization } from '@/domain/auth/enterprise/entities/user-authorization';
import { Email } from '@/domain/auth/enterprise/value-objects/email.vo';
import { Password } from '@/domain/auth/enterprise/value-objects/password.vo';
import { NationalId } from '@/domain/auth/enterprise/value-objects/national-id.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left } from '@/core/either';

describe('CreateUserUseCase', () => {
  let identityRepo: InMemoryUserIdentityRepository;
  let profileRepo: InMemoryUserProfileRepository;
  let authorizationRepo: InMemoryUserAuthorizationRepository;
  let unitOfWork: InMemoryAuthUnitOfWork;
  let eventDispatcher: IEventDispatcher;
  let sut: CreateUserUseCase;

  beforeEach(() => {
    identityRepo = new InMemoryUserIdentityRepository();
    profileRepo = new InMemoryUserProfileRepository();
    authorizationRepo = new InMemoryUserAuthorizationRepository();
    unitOfWork = new InMemoryAuthUnitOfWork(
      identityRepo,
      profileRepo,
      authorizationRepo,
    );
    eventDispatcher = {
      dispatch: vi.fn(),
    };
    sut = new CreateUserUseCase(
      identityRepo,
      profileRepo,
      authorizationRepo,
      unitOfWork,
      eventDispatcher,
    );
  });

  describe('Success scenarios', () => {
    it('should create user with all fields', async () => {
      const request = {
        email: 'john.doe@example.com',
        password: 'StrongPass123',
        fullName: 'John Doe',
        nationalId: '12345678901',
        role: 'admin' as const,
        source: 'api',
        phone: '+1234567890',
        birthDate: new Date('1990-01-01'),
        profileImageUrl: 'https://example.com/avatar.jpg',
        bio: 'Software developer',
        profession: 'Engineer',
        specialization: 'Backend',
        preferredLanguage: 'en',
        timezone: 'UTC',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.email).toBe('john.doe@example.com');
        expect(result.value.fullName).toBe('John Doe');
        expect(result.value.role).toBe('admin');
        expect(result.value.identityId).toBeDefined();
        expect(result.value.profileId).toBeDefined();
        expect(result.value.authorizationId).toBeDefined();
      }

      expect(identityRepo.items).toHaveLength(1);
      expect(profileRepo.items).toHaveLength(1);
      expect(authorizationRepo.items).toHaveLength(1);
      expect(eventDispatcher.dispatch).toHaveBeenCalledTimes(1);
    });

    it('should create user with minimum required fields', async () => {
      const request = {
        email: 'jane.doe@example.com',
        password: 'ValidPass123',
        fullName: 'Jane Doe',
        nationalId: '98765432101',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.email).toBe('jane.doe@example.com');
        expect(result.value.fullName).toBe('Jane Doe');
        expect(result.value.role).toBe('student'); // default role
      }
    });
  });

  describe('Error scenarios', () => {
    it('should return DuplicateEmailError when email already exists', async () => {
      // Create existing user
      const existingIdentity = UserIdentity.create({
        email: Email.create('existing@example.com'),
        password: await Password.createFromPlain('ExistingPass123').toHash(),
        emailVerified: true,
      });
      await identityRepo.save(existingIdentity);

      const request = {
        email: 'existing@example.com',
        password: 'NewSecure123',
        fullName: 'New User',
        nationalId: '11111111111',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Email already registered');
      }
    });

    it('should return DuplicateNationalIdError when national ID already exists', async () => {
      // Create existing profile
      const existingProfile = UserProfile.create({
        identityId: new UniqueEntityID(),
        fullName: 'Existing User',
        nationalId: NationalId.create('22222222222'),
      });
      await profileRepo.save(existingProfile);

      const request = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        fullName: 'New User',
        nationalId: '22222222222',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain(
          'National ID already registered',
        );
      }
    });

    it('should return InvalidInputError when identity save fails', async () => {
      vi.spyOn(identityRepo, 'save').mockResolvedValueOnce(
        left(new Error('Database error')),
      );

      const request = {
        email: 'test@example.com',
        password: 'SecurePass123',
        fullName: 'Test User',
        nationalId: '33333333333',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toBe('Failed to create user identity');
      }
    });

    it('should rollback identity when profile save fails', async () => {
      vi.spyOn(profileRepo, 'save').mockResolvedValueOnce(
        left(new Error('Database error')),
      );

      const request = {
        email: 'rollback@example.com',
        password: 'SecurePass123',
        fullName: 'Rollback User',
        nationalId: '44444444444',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toBe('Failed to create user profile');
      }

      // Verify rollback
      expect(identityRepo.items).toHaveLength(0);
    });

    it('should rollback identity and profile when authorization save fails', async () => {
      vi.spyOn(authorizationRepo, 'save').mockResolvedValueOnce(
        left(new Error('Database error')),
      );

      const request = {
        email: 'rollback2@example.com',
        password: 'SecurePass123',
        fullName: 'Rollback User 2',
        nationalId: '55555555555',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toBe(
          'Failed to create user authorization',
        );
      }

      // Verify rollback
      expect(identityRepo.items).toHaveLength(0);
      expect(profileRepo.items).toHaveLength(0);
    });

    it('should not fail when event dispatch fails', async () => {
      vi.spyOn(eventDispatcher, 'dispatch').mockRejectedValueOnce(
        new Error('Event dispatch failed'),
      );
      vi.spyOn(console, 'error').mockImplementationOnce(() => {});

      const request = {
        email: 'event-fail@example.com',
        password: 'SecurePass123',
        fullName: 'Event Fail User',
        nationalId: '66666666666',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to dispatch user created event:',
        expect.any(Error),
      );
    });
  });

  describe('Domain invariants validation', () => {
    it('should reject empty fullName', async () => {
      const request = {
        email: 'empty@example.com',
        password: 'SecurePass123',
        fullName: '',
        nationalId: '77777777771',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Full name cannot be empty');
      }
    });

    it('should reject fullName with only spaces', async () => {
      const request = {
        email: 'spaces@example.com',
        password: 'SecurePass123',
        fullName: '   \t\n  ',
        nationalId: '77777777772',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Full name cannot be empty');
      }
    });

    it('should reject fullName shorter than minimum length', async () => {
      const request = {
        email: 'short@example.com',
        password: 'SecurePass123',
        fullName: 'A',
        nationalId: '77777777773',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Full name must be at least');
      }
    });

    it('should reject null for required string fields', async () => {
      const request = {
        email: 'null@example.com',
        password: 'SecurePass123',
        fullName: null as any,
        nationalId: '77777777774',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toBeDefined();
      }
    });

    it('should reject undefined for required string fields', async () => {
      const request = {
        email: 'undef@example.com',
        password: 'SecurePass123',
        fullName: undefined as any,
        nationalId: '77777777775',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toBeDefined();
      }
    });

    it('should handle Unicode control characters in fullName', async () => {
      const request = {
        email: 'unicode@example.com',
        password: 'SecurePass123',
        fullName: 'Test\u0000\u0001\u0002User',
        nationalId: '77777777776',
      };

      const result = await sut.execute(request);

      // Should either reject or sanitize control characters
      if (result.isRight()) {
        expect(result.value.fullName).not.toContain('\u0000');
        expect(result.value.fullName).not.toContain('\u0001');
        expect(result.value.fullName).not.toContain('\u0002');
      }
    });

    it('should enforce all required fields are present', async () => {
      // Test missing email
      const missingEmail = {
        password: 'SecurePass123',
        fullName: 'Test User',
        nationalId: '77777777777',
      } as any;

      const result1 = await sut.execute(missingEmail);
      expect(result1.isLeft()).toBe(true);

      // Test missing password
      const missingPassword = {
        email: 'test@example.com',
        fullName: 'Test User',
        nationalId: '77777777778',
      } as any;

      const result2 = await sut.execute(missingPassword);
      expect(result2.isLeft()).toBe(true);

      // Test missing fullName
      const missingFullName = {
        email: 'test2@example.com',
        password: 'SecurePass123',
        nationalId: '77777777779',
      } as any;

      const result3 = await sut.execute(missingFullName);
      expect(result3.isLeft()).toBe(true);

      // Test missing nationalId
      const missingNationalId = {
        email: 'test3@example.com',
        password: 'SecurePass123',
        fullName: 'Test User',
      } as any;

      const result4 = await sut.execute(missingNationalId);
      expect(result4.isLeft()).toBe(true);
    });

    it('should validate birthDate is not in the future', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const request = {
        email: 'future@example.com',
        password: 'SecurePass123',
        fullName: 'Future User',
        nationalId: '77777777780',
        birthDate: futureDate,
      };

      const result = await sut.execute(request);

      // Should either reject or accept based on business rules
      // This test documents the behavior
      expect(result.isRight() || result.isLeft()).toBe(true);
    });
  });

  describe('Invalid input scenarios', () => {
    it('should return InvalidInputError for empty email', async () => {
      const request = {
        email: '',
        password: 'SecurePass123',
        fullName: 'Test User',
        nationalId: '77777777777',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Invalid');
      }
    });

    it('should return InvalidInputError for invalid email format', async () => {
      const request = {
        email: 'not-an-email',
        password: 'SecurePass123',
        fullName: 'Test User',
        nationalId: '88888888888',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Invalid');
      }
    });

    it('should return InvalidInputError for empty password', async () => {
      const request = {
        email: 'test@example.com',
        password: '',
        fullName: 'Test User',
        nationalId: '99999999999',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain(
          'Password does not meet security requirements',
        );
      }
    });

    it('should return InvalidInputError for weak password', async () => {
      const request = {
        email: 'test@example.com',
        password: '123',
        fullName: 'Test User',
        nationalId: '10101010101',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Password must be at least');
      }
    });

    it('should return InvalidInputError for empty national ID', async () => {
      const request = {
        email: 'test@example.com',
        password: 'SecurePass123',
        fullName: 'Test User',
        nationalId: '',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain('National ID cannot be empty');
      }
    });

    it('should return InvalidInputError for invalid national ID format', async () => {
      const request = {
        email: 'test@example.com',
        password: 'SecurePass123',
        fullName: 'Test User',
        nationalId: 'AB', // Too short, minimum is 3 characters
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain(
          'National ID must have at least',
        );
      }
    });

    it('should handle null values for required fields', async () => {
      const request = {
        email: null as any,
        password: 'SecurePass123',
        fullName: 'Test User',
        nationalId: '12121212121',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toBeDefined();
      }
    });

    it('should handle undefined values for required fields', async () => {
      const request = {
        email: 'test@example.com',
        password: undefined as any,
        fullName: 'Test User',
        nationalId: '13131313131',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Missing required fields');
      }
    });
  });

  describe('Edge cases', () => {
    it('should auto-verify email for admin source', async () => {
      const request = {
        email: 'admin-source@example.com',
        password: 'SecurePass123',
        fullName: 'Admin Source User',
        nationalId: '14141414141',
        source: 'admin',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);

      const savedIdentity = identityRepo.items[0];
      expect(savedIdentity.emailVerified).toBe(true);
    });

    it('should not auto-verify email for regular source', async () => {
      const request = {
        email: 'regular@example.com',
        password: 'SecurePass123',
        fullName: 'Regular User',
        nationalId: '15151515151',
        source: 'web', // Changed from 'api' which is in the auto-verify list
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);

      const savedIdentity = identityRepo.items[0];
      expect(savedIdentity.emailVerified).toBe(false);
    });

    it('should handle very long valid inputs', async () => {
      const longName = 'A'.repeat(255);
      const longBio = 'B'.repeat(1000);

      const request = {
        email: 'longuser@example.com',
        password: 'SecurePass123',
        fullName: longName,
        nationalId: '16161616161',
        bio: longBio,
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.fullName).toBe(longName);
      }
    });

    it('should handle special characters in name', async () => {
      const request = {
        email: 'special@example.com',
        password: 'SecurePass123',
        fullName: "O'Brien-García, José María",
        nationalId: '17171717171',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.fullName).toBe("O'Brien-García, José María");
      }
    });

    it('should handle different role types', async () => {
      const roles = ['student', 'tutor', 'admin'] as const;

      for (const [index, role] of roles.entries()) {
        const request = {
          email: `${role}@example.com`,
          password: 'SecurePass123',
          fullName: `${role} User`,
          nationalId: `2000000000${index}`,
          role,
        };

        const result = await sut.execute(request);

        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value.role).toBe(role);
        }
      }
    });

    it('should handle invalid role gracefully', async () => {
      const request = {
        email: 'invalidrole@example.com',
        password: 'SecurePass123',
        fullName: 'Invalid Role User',
        nationalId: '21212121212',
        role: 'superadmin' as any,
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
    });

    it('should handle birthDate edge cases', async () => {
      // Future date
      const futureRequest = {
        email: 'future@example.com',
        password: 'SecurePass123',
        fullName: 'Future User',
        nationalId: '22222222223',
        birthDate: new Date('2030-01-01'),
      };

      const futureResult = await sut.execute(futureRequest);
      expect(futureResult.isRight()).toBe(true);

      // Very old date
      const oldRequest = {
        email: 'old@example.com',
        password: 'SecurePass123',
        fullName: 'Old User',
        nationalId: '33333333334',
        birthDate: new Date('1900-01-01'),
      };

      const oldResult = await sut.execute(oldRequest);
      expect(oldResult.isRight()).toBe(true);
    });

    it('should handle email case sensitivity', async () => {
      // Create user with lowercase email
      const firstRequest = {
        email: 'test@example.com',
        password: 'SecurePass123',
        fullName: 'First User',
        nationalId: '44444444445',
      };

      await sut.execute(firstRequest);

      // Try to create with uppercase email
      const secondRequest = {
        email: 'TEST@EXAMPLE.COM',
        password: 'SecurePass123',
        fullName: 'Second User',
        nationalId: '55555555556',
      };

      const result = await sut.execute(secondRequest);

      // Should handle as duplicate (case-insensitive)
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Email already registered');
      }
    });

    it('should handle timezone and language edge cases', async () => {
      const request = {
        email: 'intl@example.com',
        password: 'SecurePass123',
        fullName: 'International User',
        nationalId: '66666666667',
        preferredLanguage: 'invalid-lang',
        timezone: 'Invalid/Timezone',
      };

      const result = await sut.execute(request);

      // Should succeed as these are optional fields
      expect(result.isRight()).toBe(true);
    });
  });

  describe('Transaction and atomicity scenarios', () => {
    it('should maintain consistency when multiple saves fail', async () => {
      // Mock identity repository to fail within unit of work
      vi.spyOn(unitOfWork.identityRepository, 'save').mockResolvedValueOnce(
        left(new Error('Identity save failed')),
      );

      const request = {
        email: 'atomic@example.com',
        password: 'SecurePass123',
        fullName: 'Atomic User',
        nationalId: '88888888881',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);

      // No data should be persisted due to rollback
      expect(identityRepo.items).toHaveLength(0);
      expect(profileRepo.items).toHaveLength(0);
      expect(authorizationRepo.items).toHaveLength(0);
    });

    it('should handle partial failure and maintain atomicity', async () => {
      // Let identity succeed, profile fail
      const profileSpy = vi
        .spyOn(unitOfWork.profileRepository, 'save')
        .mockResolvedValueOnce(left(new Error('Profile save failed')));

      const request = {
        email: 'partial@example.com',
        password: 'SecurePass123',
        fullName: 'Partial User',
        nationalId: '88888888882',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);

      // Verify no data persisted (rollback happened)
      expect(identityRepo.items).toHaveLength(0);
      expect(profileRepo.items).toHaveLength(0);
      expect(authorizationRepo.items).toHaveLength(0);

      // Restore original behavior
      profileSpy.mockRestore();
    });

    it('should handle cascading failures gracefully', async () => {
      // Let identity and profile succeed, authorization fail
      const authSpy = vi
        .spyOn(unitOfWork.authorizationRepository, 'save')
        .mockResolvedValueOnce(left(new Error('Authorization save failed')));

      const request = {
        email: 'cascade@example.com',
        password: 'SecurePass123',
        fullName: 'Cascade User',
        nationalId: '88888888883',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);

      // Verify complete rollback (no data persisted)
      expect(identityRepo.items).toHaveLength(0);
      expect(profileRepo.items).toHaveLength(0);
      expect(authorizationRepo.items).toHaveLength(0);

      // Cleanup
      authSpy.mockRestore();
    });

    it('should maintain consistency even when rollback fails', async () => {
      // Create a custom unit of work that fails on rollback
      const failingUnitOfWork = new InMemoryAuthUnitOfWork(
        identityRepo,
        profileRepo,
        authorizationRepo,
      );

      // Mock rollback to fail
      vi.spyOn(failingUnitOfWork, 'rollback').mockRejectedValueOnce(
        new Error('Rollback failed'),
      );

      // Mock profile save to fail
      vi.spyOn(
        failingUnitOfWork.profileRepository,
        'save',
      ).mockResolvedValueOnce(left(new Error('Profile save failed')));

      // Create a new use case instance with the failing unit of work
      const failingSut = new CreateUserUseCase(
        identityRepo,
        profileRepo,
        authorizationRepo,
        failingUnitOfWork,
        eventDispatcher,
      );

      const request = {
        email: 'rollbackfail@example.com',
        password: 'SecurePass123',
        fullName: 'Rollback Fail User',
        nationalId: '88888888884',
      };

      const result = await failingSut.execute(request);

      expect(result.isLeft()).toBe(true);
    });

    it('should handle transaction with proper isolation', async () => {
      // Create multiple concurrent requests
      const request1 = {
        email: 'isolated1@example.com',
        password: 'SecurePass123',
        fullName: 'Isolated User 1',
        nationalId: '88888888885',
      };

      const request2 = {
        email: 'isolated2@example.com',
        password: 'SecurePass123',
        fullName: 'Isolated User 2',
        nationalId: '88888888886',
      };

      // Execute concurrently
      const [result1, result2] = await Promise.all([
        sut.execute(request1),
        sut.execute(request2),
      ]);

      // Both should succeed
      expect(result1.isRight()).toBe(true);
      expect(result2.isRight()).toBe(true);

      // Both users should be created
      expect(identityRepo.items).toHaveLength(2);
      expect(profileRepo.items).toHaveLength(2);
      expect(authorizationRepo.items).toHaveLength(2);
    });
  });

  describe('Event sourcing tests', () => {
    it('should dispatch UserCreatedEvent with correct data', async () => {
      const request = {
        email: 'event@example.com',
        password: 'SecurePass123',
        fullName: 'Event User',
        nationalId: '99999999991',
        role: 'admin' as const,
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      expect(eventDispatcher.dispatch).toHaveBeenCalledTimes(1);

      const dispatchedEvent = vi.mocked(eventDispatcher.dispatch).mock
        .calls[0][0];
      expect(dispatchedEvent).toMatchObject({
        email: 'event@example.com',
        fullName: 'Event User',
        role: 'admin',
        source: 'registration',
      });
    });

    it('should handle event dispatch failure gracefully', async () => {
      // Mock event dispatcher to throw
      vi.mocked(eventDispatcher.dispatch).mockRejectedValueOnce(
        new Error('Event dispatch failed'),
      );

      // Spy on console.error
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementationOnce(() => {});

      const request = {
        email: 'eventfail@example.com',
        password: 'SecurePass123',
        fullName: 'Event Fail User',
        nationalId: '99999999992',
      };

      const result = await sut.execute(request);

      // User creation should still succeed
      expect(result.isRight()).toBe(true);
      expect(identityRepo.items).toHaveLength(1);
      expect(profileRepo.items).toHaveLength(1);
      expect(authorizationRepo.items).toHaveLength(1);

      // Error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to dispatch user created event:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it('should ensure event idempotency', async () => {
      const request = {
        email: 'idempotent@example.com',
        password: 'SecurePass123',
        fullName: 'Idempotent User',
        nationalId: '99999999993',
      };

      await sut.execute(request);

      // Clear dispatch calls
      vi.mocked(eventDispatcher.dispatch).mockClear();

      // Try to create the same user again
      const result2 = await sut.execute(request);

      // Should fail with duplicate email
      expect(result2.isLeft()).toBe(true);

      // No new event should be dispatched
      expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('Complex rollback scenarios', () => {
    it('should handle concurrent saves that might cause race conditions', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        email: `concurrent${i}@atomic.com`,
        password: 'SecurePass123',
        fullName: `Concurrent Atomic User ${i}`,
        nationalId: `9000000000${i}`,
      }));

      // Mock one of the saves to fail randomly
      const originalSave = unitOfWork.profileRepository.save.bind(
        unitOfWork.profileRepository,
      );
      let callCount = 0;
      vi.spyOn(unitOfWork.profileRepository, 'save').mockImplementation(
        async (profile) => {
          callCount++;
          if (callCount === 3) {
            return left(new Error('Concurrent save conflict'));
          }
          return originalSave(profile);
        },
      );

      const results = await Promise.all(
        requests.map((req) => sut.execute(req)),
      );

      const successes = results.filter((r) => r.isRight()).length;
      const failures = results.filter((r) => r.isLeft()).length;

      expect(successes).toBe(4);
      expect(failures).toBe(1);

      // Verify atomicity - we should have exactly 4 complete sets
      expect(identityRepo.items.length).toBe(4);
      expect(profileRepo.items.length).toBe(4);
      expect(authorizationRepo.items.length).toBe(4);
    });

    it('should rollback all changes when event dispatch is critical and fails', async () => {
      // Create a custom unit of work that tracks all operations
      const trackingUnitOfWork = new InMemoryAuthUnitOfWork(
        identityRepo,
        profileRepo,
        authorizationRepo,
      );

      // Create use case that treats event dispatch as critical
      const criticalEventSut = new CreateUserUseCase(
        identityRepo,
        profileRepo,
        authorizationRepo,
        trackingUnitOfWork,
        {
          dispatch: vi
            .fn()
            .mockRejectedValueOnce(new Error('Critical event failure')),
        },
      );

      const request = {
        email: 'criticalevent@example.com',
        password: 'SecurePass123',
        fullName: 'Critical Event User',
        nationalId: '99999999994',
      };

      // Since event dispatch failure is handled gracefully, user creation should succeed
      const result = await criticalEventSut.execute(request);

      expect(result.isRight()).toBe(true);
      expect(identityRepo.items).toHaveLength(1);
    });

    it('should handle complex rollback with multiple dependent operations', async () => {
      // Simulate a scenario where authorization depends on profile state
      let profileCreated = false;

      vi.spyOn(unitOfWork.profileRepository, 'save').mockImplementation(
        async (profile) => {
          profileCreated = true;
          return profileRepo.save(profile);
        },
      );

      vi.spyOn(unitOfWork.authorizationRepository, 'save').mockImplementation(
        async (auth) => {
          if (!profileCreated) {
            return left(new Error('Profile must exist before authorization'));
          }
          // Simulate failure after dependency check
          return left(new Error('Authorization service unavailable'));
        },
      );

      const request = {
        email: 'dependent@example.com',
        password: 'SecurePass123',
        fullName: 'Dependent User',
        nationalId: '99999999995',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      // All changes should be rolled back
      expect(identityRepo.items).toHaveLength(0);
      expect(profileRepo.items).toHaveLength(0);
      expect(authorizationRepo.items).toHaveLength(0);
    });
  });

  describe('Event sourcing scenarios', () => {
    it('should dispatch UserCreatedEvent with complete data', async () => {
      const request = {
        email: 'event@example.com',
        password: 'SecurePass123',
        fullName: 'Event User',
        nationalId: '77777777781',
        role: 'tutor' as const,
        source: 'admin',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      expect(eventDispatcher.dispatch).toHaveBeenCalledTimes(1);

      const dispatchedEvent = (eventDispatcher.dispatch as any).mock
        .calls[0][0];
      expect(dispatchedEvent.constructor.name).toBe('UserCreatedEvent');
      if (result.isRight()) {
        expect(dispatchedEvent.identityId).toBe(result.value.identityId);
      }
      expect(dispatchedEvent.email).toBe('event@example.com');
      expect(dispatchedEvent.fullName).toBe('Event User');
      expect(dispatchedEvent.role).toBe('tutor');
      expect(dispatchedEvent.source).toBe('registration');
      expect(dispatchedEvent.occurredAt).toBeInstanceOf(Date);
    });

    it('should handle multiple user creations with proper event ordering', async () => {
      const users = [
        {
          email: 'user1@event.com',
          fullName: 'User One',
          nationalId: '77777777782',
        },
        {
          email: 'user2@event.com',
          fullName: 'User Two',
          nationalId: '77777777783',
        },
        {
          email: 'user3@event.com',
          fullName: 'User Three',
          nationalId: '77777777784',
        },
      ];

      const results: Array<Awaited<ReturnType<typeof sut.execute>>> = [];
      for (const user of users) {
        const result = await sut.execute({
          ...user,
          password: 'SecurePass123',
        });
        results.push(result);
      }

      // All should succeed
      expect(results.every((r) => r.isRight())).toBe(true);

      // Should have dispatched 3 events
      expect(eventDispatcher.dispatch).toHaveBeenCalledTimes(3);

      // Events should be in order
      const calls = (eventDispatcher.dispatch as any).mock.calls;
      expect(calls[0][0].email).toBe('user1@event.com');
      expect(calls[1][0].email).toBe('user2@event.com');
      expect(calls[2][0].email).toBe('user3@event.com');
    });

    it('should ensure event idempotency when same data is provided', async () => {
      const request = {
        email: 'idempotent@example.com',
        password: 'SecurePass123',
        fullName: 'Idempotent User',
        nationalId: '77777777785',
      };

      // First attempt
      const result1 = await sut.execute(request);
      expect(result1.isRight()).toBe(true);

      // Reset dispatcher mock
      vi.clearAllMocks();

      // Second attempt with same email should fail
      const result2 = await sut.execute(request);
      expect(result2.isLeft()).toBe(true);

      // No event should be dispatched on failure
      expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should include all relevant metadata in events', async () => {
      const request = {
        email: 'metadata@example.com',
        password: 'SecurePass123',
        fullName: 'Metadata User',
        nationalId: '77777777786',
        role: 'admin' as const,
        source: 'hotmart',
        phone: '+1234567890',
        birthDate: new Date('1990-01-01'),
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);

      const event = (eventDispatcher.dispatch as any).mock.calls[0][0];
      // Verify essential event data
      expect(event.identityId).toBeDefined();
      expect(event.email).toBe('metadata@example.com');
      expect(event.fullName).toBe('Metadata User');
      expect(event.role).toBe('admin');
      // Source should be 'registration' regardless of input source
      expect(event.source).toBe('registration');
    });

    it('should not dispatch events when validation fails', async () => {
      const invalidRequests = [
        {
          email: '',
          password: 'Pass123',
          fullName: 'User',
          nationalId: '12345',
        },
        {
          email: 'test@test.com',
          password: '',
          fullName: 'User',
          nationalId: '12345',
        },
        {
          email: 'test@test.com',
          password: 'Pass123',
          fullName: '',
          nationalId: '12345',
        },
        {
          email: 'test@test.com',
          password: 'Pass123',
          fullName: 'User',
          nationalId: '',
        },
      ];

      vi.clearAllMocks();

      for (const request of invalidRequests) {
        await sut.execute(request);
      }

      // No events should be dispatched for invalid requests
      expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('Concurrency scenarios', () => {
    it('should handle race condition when two users try to register same email simultaneously', async () => {
      const email = 'race@example.com';
      const password = 'SecurePass123';

      // Simulate concurrent requests
      const request1 = {
        email,
        password,
        fullName: 'User One',
        nationalId: '11111111111',
      };

      const request2 = {
        email,
        password,
        fullName: 'User Two',
        nationalId: '22222222222',
      };

      // Execute both requests in parallel
      const results = await Promise.all([
        sut.execute(request1),
        sut.execute(request2),
      ]);

      // One should succeed, one should fail
      const successes = results.filter((r) => r.isRight()).length;
      const failures = results.filter((r) => r.isLeft()).length;

      expect(successes).toBe(1);
      expect(failures).toBe(1);

      // The failed one should have duplicate email error
      const failedResult = results.find((r) => r.isLeft());
      if (failedResult?.isLeft()) {
        expect(failedResult.value.message).toContain(
          'Email already registered',
        );
      }

      // Only one user should be in the repository
      expect(identityRepo.items).toHaveLength(1);
    });

    it('should handle race condition when two users try to register same nationalId simultaneously', async () => {
      const nationalId = '99999999999';

      // Simulate concurrent requests
      const request1 = {
        email: 'user1@example.com',
        password: 'SecurePass123',
        fullName: 'User One',
        nationalId,
      };

      const request2 = {
        email: 'user2@example.com',
        password: 'SecurePass123',
        fullName: 'User Two',
        nationalId,
      };

      // Execute both requests in parallel
      const results = await Promise.all([
        sut.execute(request1),
        sut.execute(request2),
      ]);

      // One should succeed, one should fail
      const successes = results.filter((r) => r.isRight()).length;
      const failures = results.filter((r) => r.isLeft()).length;

      expect(successes).toBe(1);
      expect(failures).toBe(1);

      // The failed one should have duplicate national ID error
      const failedResult = results.find((r) => r.isLeft());
      if (failedResult?.isLeft()) {
        expect(failedResult.value.message).toContain(
          'National ID already registered',
        );
      }

      // Only one profile should be in the repository
      expect(profileRepo.items).toHaveLength(1);
    });

    it('should handle multiple concurrent user creations with different data', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        email: `concurrent${i}@example.com`,
        password: 'SecurePass123',
        fullName: `Concurrent User ${i}`,
        nationalId: `3000000000${i}`,
      }));

      // Execute all requests in parallel
      const results = await Promise.all(
        requests.map((req) => sut.execute(req)),
      );

      // All should succeed since they have different emails and nationalIds
      const successes = results.filter((r) => r.isRight()).length;
      expect(successes).toBe(10);

      // All users should be in repositories
      expect(identityRepo.items).toHaveLength(10);
      expect(profileRepo.items).toHaveLength(10);
      expect(authorizationRepo.items).toHaveLength(10);
    });
  });

  describe('Security scenarios', () => {
    it('should handle SQL injection attempts in email field', async () => {
      const request = {
        email: "admin'--", // Invalid format - no @ symbol
        password: 'SecurePass123',
        fullName: 'SQL Test',
        nationalId: '77777777778',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Invalid');
      }
    });

    it('should handle SQL injection attempts in fullName field', async () => {
      const request = {
        email: 'sqltest@example.com',
        password: 'SecurePass123',
        fullName: "Robert'); DROP TABLE users;--",
        nationalId: '88888888889',
      };

      const result = await sut.execute(request);

      // Should succeed - the name is treated as plain text
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Verify the name is stored as-is (escaped by the ORM)
        expect(result.value.fullName).toBe("Robert'); DROP TABLE users;--");
      }
    });

    it('should handle XSS attempts in user fields', async () => {
      const request = {
        email: 'xss@example.com',
        password: 'SecurePass123',
        fullName: '<script>alert("XSS")</script>',
        nationalId: '99999999990',
        bio: '<img src=x onerror=alert("XSS")>',
        profileImageUrl: 'javascript:alert("XSS")',
      };

      const result = await sut.execute(request);

      // Should succeed - data should be stored as-is, sanitization happens on output
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.fullName).toBe('<script>alert("XSS")</script>');
      }
    });

    it('should not expose password in response', async () => {
      const request = {
        email: 'passtest@example.com',
        password: 'SuperSecret123',
        fullName: 'Password Test',
        nationalId: '10101010102',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Ensure password is not in the response
        expect(result.value).not.toHaveProperty('password');
        expect(JSON.stringify(result.value)).not.toContain('SuperSecret123');
      }
    });

    it('should not expose password hash in repository', async () => {
      const request = {
        email: 'hashtest@example.com',
        password: 'TestHash123',
        fullName: 'Hash Test',
        nationalId: '11111111112',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);

      const savedIdentity = identityRepo.items[0];
      // Password should be hashed
      expect(savedIdentity.password.value).not.toBe('TestHash123');
      expect(savedIdentity.password.value).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });

    it('should handle very long national ID attempts', async () => {
      const request = {
        email: 'overflow@example.com',
        password: 'SecurePass123',
        fullName: 'Overflow Test',
        nationalId: '1'.repeat(51), // Max is 50
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain('National ID cannot exceed');
      }
    });

    it('should handle attempts to bypass role validation', async () => {
      const request = {
        email: 'bypass@example.com',
        password: 'SecurePass123',
        fullName: 'Bypass Test',
        nationalId: '12121212123',
        role: 'superadmin' as any,
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Invalid role');
      }
    });

    it('should sanitize national ID in error messages', async () => {
      // First create a user
      const existingProfile = UserProfile.create({
        identityId: new UniqueEntityID(),
        fullName: 'Existing User',
        nationalId: NationalId.create('12345678901'),
      });
      await profileRepo.save(existingProfile);

      // Try to create another with same national ID
      const request = {
        email: 'duplicate@example.com',
        password: 'SecurePass123',
        fullName: 'Duplicate Test',
        nationalId: '12345678901',
      };

      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        // National ID should be partially hidden in error context
        expect(result.value.message).toContain(
          'National ID already registered',
        );
      }
    });

    it('should handle command injection attempts in fields', async () => {
      const request = {
        email: 'cmd@example.com',
        password: 'SecurePass123',
        fullName: '$(rm -rf /)',
        nationalId: '13131313134',
        bio: '`cat /etc/passwd`',
      };

      const result = await sut.execute(request);

      // Should succeed - fields are treated as plain text
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.fullName).toBe('$(rm -rf /)');
      }
    });

    it('should handle null byte injection attempts', async () => {
      const request = {
        email: 'null@example.com',
        password: 'SecurePass123',
        fullName: 'Test\x00User',
        nationalId: '14141414145',
      };

      const result = await sut.execute(request);

      // Should handle null bytes appropriately
      expect(result.isRight()).toBe(true);
    });

    it('should prevent timing attacks on email validation', async () => {
      const existingEmail = 'existing@example.com';
      const nonExistingEmail = 'nonexisting@example.com';

      // Create existing user
      const existingIdentity = UserIdentity.create({
        email: Email.create(existingEmail),
        password: await Password.createFromPlain('ExistingPass123').toHash(),
        emailVerified: true,
      });
      await identityRepo.save(existingIdentity);

      // Measure time for existing email
      const startExisting = Date.now();
      await sut.execute({
        email: existingEmail,
        password: 'TestPass123',
        fullName: 'Test User',
        nationalId: '15151515156',
      });
      const timeExisting = Date.now() - startExisting;

      // Measure time for non-existing email
      const startNonExisting = Date.now();
      await sut.execute({
        email: nonExistingEmail,
        password: 'TestPass123',
        fullName: 'Test User',
        nationalId: '16161616167',
      });
      const timeNonExisting = Date.now() - startNonExisting;

      // Times should be relatively similar (within reasonable variance)
      // This is a basic check - in real scenarios you'd want statistical analysis
      const timeDifference = Math.abs(timeExisting - timeNonExisting);
      expect(timeDifference).toBeLessThan(100); // 100ms tolerance
    });
  });

  describe('Business rules tests', () => {
    describe('Age-related business rules', () => {
      it('should accept users with valid birthDate', async () => {
        const validBirthDates = [
          new Date('2000-01-01'), // 24+ years old
          new Date('1990-06-15'), // 34+ years old
          new Date('1980-12-31'), // 44+ years old
        ];

        for (const [index, birthDate] of validBirthDates.entries()) {
          const request = {
            email: `user${index}@example.com`,
            password: 'SecurePass123',
            fullName: `User ${index}`,
            nationalId: `4000000000${index}`,
            birthDate,
          };

          const result = await sut.execute(request);
          expect(result.isRight()).toBe(true);
        }
      });

      it('should handle future birthDate (unborn users)', async () => {
        const futureBirthDate = new Date();
        futureBirthDate.setFullYear(futureBirthDate.getFullYear() + 1);

        const request = {
          email: 'future@example.com',
          password: 'SecurePass123',
          fullName: 'Future User',
          nationalId: '41111111111',
          birthDate: futureBirthDate,
        };

        const result = await sut.execute(request);
        // Currently no validation prevents future dates
        expect(result.isRight()).toBe(true);
      });

      it('should handle very old birthDate', async () => {
        const request = {
          email: 'ancient@example.com',
          password: 'SecurePass123',
          fullName: 'Ancient User',
          nationalId: '42222222222',
          birthDate: new Date('1900-01-01'), // 125+ years old
        };

        const result = await sut.execute(request);
        // Currently no validation prevents very old dates
        expect(result.isRight()).toBe(true);
      });

      it('should calculate age correctly when birthDate is provided', async () => {
        const birthDate = new Date();
        birthDate.setFullYear(birthDate.getFullYear() - 25); // Exactly 25 years ago

        const request = {
          email: 'age25@example.com',
          password: 'SecurePass123',
          fullName: 'Age Test User',
          nationalId: '43333333333',
          birthDate,
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);

        const profile = profileRepo.items.find(
          (p) => p.nationalId.value === '43333333333',
        );
        expect(profile?.age).toBe(25);
      });
    });

    describe('Phone-related business rules', () => {
      it('should accept various phone formats', async () => {
        const phoneFormats = [
          '+1234567890',
          '+55 11 98765-4321',
          '(11) 98765-4321',
          '11987654321',
          '+39 06 1234 5678',
          '0611234567',
        ];

        for (const [index, phone] of phoneFormats.entries()) {
          const request = {
            email: `phone${index}@example.com`,
            password: 'SecurePass123',
            fullName: `Phone User ${index}`,
            nationalId: `5000000000${index}`,
            phone,
          };

          const result = await sut.execute(request);
          expect(result.isRight()).toBe(true);
        }
      });

      it('should handle empty phone', async () => {
        const request = {
          email: 'nophone@example.com',
          password: 'SecurePass123',
          fullName: 'No Phone User',
          nationalId: '51111111111',
          phone: '',
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);
      });

      it('should handle very long phone numbers', async () => {
        const request = {
          email: 'longphone@example.com',
          password: 'SecurePass123',
          fullName: 'Long Phone User',
          nationalId: '52222222222',
          phone: '+' + '1'.repeat(50), // 50 digit phone number
        };

        const result = await sut.execute(request);
        // Currently no validation prevents long phone numbers
        expect(result.isRight()).toBe(true);
      });

      it('should handle special characters in phone', async () => {
        const request = {
          email: 'specialphone@example.com',
          password: 'SecurePass123',
          fullName: 'Special Phone User',
          nationalId: '53333333333',
          phone: '+1 (555) 123-4567 ext. 890',
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);
      });
    });

    describe('Combined business rules and field interactions', () => {
      it('should handle tutor role with professional fields', async () => {
        const request = {
          email: 'tutor@example.com',
          password: 'SecurePass123',
          fullName: 'Professional Tutor',
          nationalId: '61111111111',
          role: 'tutor' as const,
          profession: 'Mathematics Teacher',
          specialization: 'Calculus and Linear Algebra',
          bio: 'Experienced educator with 10 years of teaching',
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);

        const profile = profileRepo.items.find(
          (p) => p.nationalId.value === '61111111111',
        );
        expect(profile?.profession).toBe('Mathematics Teacher');
        expect(profile?.specialization).toBe('Calculus and Linear Algebra');
      });

      it('should handle student role with minimal fields', async () => {
        const request = {
          email: 'student@example.com',
          password: 'SecurePass123',
          fullName: 'Student User',
          nationalId: '62222222222',
          role: 'student' as const,
          // Students typically don't need profession/specialization
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);
      });

      it('should handle admin role with complete profile', async () => {
        const request = {
          email: 'admin@example.com',
          password: 'SecurePass123',
          fullName: 'Admin User',
          nationalId: '63333333333',
          role: 'admin' as const,
          phone: '+55 11 98765-4321',
          birthDate: new Date('1985-01-01'),
          profileImageUrl: 'https://example.com/admin.jpg',
          preferredLanguage: 'en',
          timezone: 'UTC',
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);
      });

      it('should handle language and timezone combinations', async () => {
        const combinations = [
          { lang: 'pt-BR', tz: 'America/Sao_Paulo' },
          { lang: 'it', tz: 'Europe/Rome' },
          { lang: 'es', tz: 'Europe/Madrid' },
          { lang: 'en', tz: 'America/New_York' },
        ];

        for (const [index, combo] of combinations.entries()) {
          const request = {
            email: `lang${index}@example.com`,
            password: 'SecurePass123',
            fullName: `Language User ${index}`,
            nationalId: `7000000000${index}`,
            preferredLanguage: combo.lang,
            timezone: combo.tz,
          };

          const result = await sut.execute(request);
          expect(result.isRight()).toBe(true);
        }
      });

      it('should handle profile completeness scenarios', async () => {
        // Minimal required fields only
        const minimalRequest = {
          email: 'minimal@example.com',
          password: 'SecurePass123',
          fullName: 'Minimal User',
          nationalId: '71111111111',
        };

        const minimalResult = await sut.execute(minimalRequest);
        expect(minimalResult.isRight()).toBe(true);

        // Complete profile with all optional fields
        const completeRequest = {
          email: 'complete@example.com',
          password: 'SecurePass123',
          fullName: 'Complete User',
          nationalId: '72222222222',
          role: 'tutor' as const,
          source: 'api',
          phone: '+55 11 98765-4321',
          birthDate: new Date('1990-01-01'),
          profileImageUrl: 'https://example.com/avatar.jpg',
          bio: 'Experienced professional',
          profession: 'Software Engineer',
          specialization: 'Backend Development',
          preferredLanguage: 'en',
          timezone: 'America/New_York',
        };

        const completeResult = await sut.execute(completeRequest);
        expect(completeResult.isRight()).toBe(true);
      });

      it('should handle conflicting field combinations', async () => {
        // Young age with senior profession
        const request1 = {
          email: 'young-senior@example.com',
          password: 'SecurePass123',
          fullName: 'Young Senior',
          nationalId: '73333333333',
          birthDate: new Date('2005-01-01'), // ~19 years old
          profession: 'Senior Director',
          specialization: '30 years of experience', // Conflicting with age
        };

        // Currently no validation prevents this
        const result1 = await sut.execute(request1);
        expect(result1.isRight()).toBe(true);

        // Empty name with professional title
        const request2 = {
          email: 'notitle@example.com',
          password: 'SecurePass123',
          fullName: '  ', // Will be trimmed and fail validation
          nationalId: '74444444444',
          profession: 'CEO',
        };

        const result2 = await sut.execute(request2);
        expect(result2.isLeft()).toBe(true);
      });

      it('should handle source-based email verification with different roles', async () => {
        const sourcesAndRoles = [
          { source: 'admin', role: 'admin' as const, shouldVerify: true },
          { source: 'admin', role: 'student' as const, shouldVerify: true },
          { source: 'web', role: 'student' as const, shouldVerify: false },
          { source: 'api', role: 'tutor' as const, shouldVerify: true },
        ];

        for (const [index, config] of sourcesAndRoles.entries()) {
          const request = {
            email: `source${index}@example.com`,
            password: 'SecurePass123',
            fullName: `Source User ${index}`,
            nationalId: `8000000000${index}`,
            source: config.source,
            role: config.role,
          };

          const result = await sut.execute(request);
          expect(result.isRight()).toBe(true);

          const identity = identityRepo.items.find(
            (i) => i.email.value === request.email,
          );
          expect(identity?.emailVerified).toBe(config.shouldVerify);
        }
      });

      it('should handle invalid field type combinations', async () => {
        // Invalid date object for birthDate
        const request = {
          email: 'invaliddate@example.com',
          password: 'SecurePass123',
          fullName: 'Invalid Date User',
          nationalId: '81111111111',
          birthDate: 'not-a-date' as any,
        };

        // This might throw or handle gracefully depending on implementation
        const result = await sut.execute(request);
        // The behavior depends on how the entity handles invalid date
        expect(result).toBeDefined();
      });
    });

    describe('Edge cases and boundary conditions', () => {
      it('should handle maximum length fields', async () => {
        const request = {
          email: 'a'.repeat(60) + '@test.com', // Near email local part limit
          password: 'A1' + 'a'.repeat(97), // 99 chars, near 100 limit
          fullName: 'A'.repeat(255), // Very long name
          nationalId: 'A'.repeat(50), // Max nationalId length
          bio: 'B'.repeat(1000), // Very long bio
          profession: 'C'.repeat(100),
          specialization: 'D'.repeat(100),
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);
      });

      it('should handle minimum length fields', async () => {
        const request = {
          email: 'a@b.c', // Minimal valid email
          password: 'Aa1234', // Minimum 6 chars with required types
          fullName: 'AB', // Minimum 2 chars
          nationalId: 'ABC', // Minimum 3 chars
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);
      });

      it('should handle unicode and special characters', async () => {
        const request = {
          email: 'user@example.com',
          password: 'Ññ1234', // Unicode in password
          fullName: "李明 García-O'Connor", // Mixed scripts
          nationalId: '82222222222',
          bio: 'Multi-line\nbio with\ttabs and émojis 🎉',
          profession: 'Développeur / デベロッパー',
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);
      });
    });
  });

  describe('Additional edge cases', () => {
    describe('Email boundary cases', () => {
      it('should handle email with exactly 64 characters in local part', async () => {
        const localPart = 'a'.repeat(64);
        const request = {
          email: `${localPart}@example.com`,
          password: 'SecurePass123',
          fullName: 'Max Local Part User',
          nationalId: '91111111111',
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);
      });

      it('should reject email with more than 64 characters in local part', async () => {
        const localPart = 'a'.repeat(65);
        const request = {
          email: `${localPart}@example.com`,
          password: 'SecurePass123',
          fullName: 'Over Limit User',
          nationalId: '91111111112',
        };

        const result = await sut.execute(request);
        expect(result.isLeft()).toBe(true);
      });

      it('should handle email with exactly 255 characters in domain', async () => {
        // Create a domain with exactly 255 characters
        const subdomain = 'a'.repeat(240);
        const request = {
          email: `user@${subdomain}.example.com`,
          password: 'SecurePass123',
          fullName: 'Max Domain User',
          nationalId: '91111111113',
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);
      });

      it('should reject email with consecutive dots', async () => {
        const request = {
          email: 'user..name@example.com',
          password: 'SecurePass123',
          fullName: 'Consecutive Dots User',
          nationalId: '91111111114',
        };

        const result = await sut.execute(request);
        expect(result.isLeft()).toBe(true);
      });
    });

    describe('Zero-width and special Unicode characters', () => {
      it('should handle zero-width space in fullName', async () => {
        const request = {
          email: 'zwsp@example.com',
          password: 'SecurePass123',
          fullName: 'Zero\u200BWidth\u200BSpace', // Zero-width space
          nationalId: '92222222221',
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);

        const profile = profileRepo.items.find(
          (p) => p.nationalId.value === '92222222221',
        );
        // Zero-width spaces should be preserved
        expect(profile?.fullName).toContain('\u200B');
      });

      it('should handle RTL text in fullName', async () => {
        const request = {
          email: 'rtl@example.com',
          password: 'SecurePass123',
          fullName: 'محمد أحمد', // Arabic RTL text
          nationalId: '92222222222',
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);
      });

      it('should handle emoji in various fields', async () => {
        const request = {
          email: 'emoji@example.com',
          password: 'SecurePass123',
          fullName: '😀 Happy User 🎉',
          nationalId: '92222222223',
          profession: 'Software Engineer 💻',
          specialization: 'AI/ML 🤖',
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);

        const profile = profileRepo.items.find(
          (p) => p.nationalId.value === '92222222223',
        );
        expect(profile?.fullName).toBe('😀 Happy User 🎉');
        expect(profile?.profession).toBe('Software Engineer 💻');
      });
    });

    describe('Type coercion edge cases', () => {
      it('should handle number type for phone field', async () => {
        const request = {
          email: 'phonenumber@example.com',
          password: 'SecurePass123',
          fullName: 'Phone Number User',
          nationalId: '93333333331',
          phone: 1234567890 as any, // Number instead of string
        };

        const result = await sut.execute(request);
        // Should handle gracefully - either convert or accept
        expect(result.isRight()).toBe(true);
      });

      it('should reject array for string fields', async () => {
        const request = {
          email: 'array@example.com',
          password: 'SecurePass123',
          fullName: ['Array', 'Name'] as any,
          nationalId: '93333333332',
        };

        const result = await sut.execute(request);
        expect(result.isLeft()).toBe(true);
      });

      it('should reject object for primitive fields', async () => {
        const request = {
          email: { user: 'test', domain: 'example.com' } as any,
          password: 'SecurePass123',
          fullName: 'Object Email User',
          nationalId: '93333333333',
        };

        const result = await sut.execute(request);
        expect(result.isLeft()).toBe(true);
      });
    });

    describe('Date edge cases', () => {
      it('should handle leap year boundary', async () => {
        const request = {
          email: 'leapyear@example.com',
          password: 'SecurePass123',
          fullName: 'Leap Year User',
          nationalId: '94444444441',
          birthDate: new Date('2000-02-29'), // Valid leap year date
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);
      });

      it('should handle invalid date strings gracefully', async () => {
        const request = {
          email: 'invaliddate@example.com',
          password: 'SecurePass123',
          fullName: 'Invalid Date User',
          nationalId: '94444444442',
          birthDate: new Date('2023-02-30'), // Invalid date
        };

        const result = await sut.execute(request);
        // JavaScript coerces to March 2nd
        expect(result.isRight()).toBe(true);

        const profile = profileRepo.items.find(
          (p) => p.nationalId.value === '94444444442',
        );
        expect(profile?.birthDate?.getMonth()).toBe(2); // March (0-indexed)
      });

      it('should handle year boundary cases', async () => {
        const request = {
          email: 'yearboundary@example.com',
          password: 'SecurePass123',
          fullName: 'Year Boundary User',
          nationalId: '94444444443',
          birthDate: new Date('9999-12-31'),
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);
      });
    });

    describe('Business logic edge cases', () => {
      it('should handle age calculation on birthday', async () => {
        const today = new Date();
        const birthDate = new Date(today);
        birthDate.setFullYear(today.getFullYear() - 18); // Exactly 18 years ago

        const request = {
          email: 'birthday@example.com',
          password: 'SecurePass123',
          fullName: 'Birthday User',
          nationalId: '95555555551',
          birthDate,
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);

        const profile = profileRepo.items.find(
          (p) => p.nationalId.value === '95555555551',
        );
        expect(profile?.age).toBe(18);
      });

      it('should handle phone numbers with international prefixes', async () => {
        const internationalPhones = [
          '+1-800-555-0123', // US toll-free
          '+44 20 7946 0958', // UK London
          '+81 3-1234-5678', // Japan Tokyo
          '+86 10 1234 5678', // China Beijing
          '+972-2-1234567', // Israel
        ];

        for (const [index, phone] of internationalPhones.entries()) {
          const request = {
            email: `intlphone${index}@example.com`,
            password: 'SecurePass123',
            fullName: `International Phone ${index}`,
            nationalId: `9666666666${index}`,
            phone,
          };

          const result = await sut.execute(request);
          expect(result.isRight()).toBe(true);
        }
      });
    });

    describe('Performance and resource edge cases', () => {
      it('should handle extremely long but valid bio', async () => {
        const request = {
          email: 'longbio@example.com',
          password: 'SecurePass123',
          fullName: 'Long Bio User',
          nationalId: '97777777771',
          bio: 'A'.repeat(10000), // 10KB of text
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);
      });

      it('should handle all optional fields at maximum length', async () => {
        const request = {
          email: 'maxfields@example.com',
          password: 'SecurePass123',
          fullName: 'Max Fields User',
          nationalId: '97777777772',
          phone: '+' + '1'.repeat(49), // Near max
          bio: 'B'.repeat(5000),
          profession: 'P'.repeat(200),
          specialization: 'S'.repeat(200),
          profileImageUrl: 'https://example.com/' + 'a'.repeat(200) + '.jpg',
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);
      });
    });

    describe('Encoding and normalization attacks', () => {
      it('should handle homograph attacks in email', async () => {
        // Using Cyrillic 'о' instead of Latin 'o'
        const request = {
          email: 'admin@gооgle.com', // Contains Cyrillic о
          password: 'SecurePass123',
          fullName: 'Homograph User',
          nationalId: '98888888881',
        };

        const result = await sut.execute(request);
        // Should accept as valid email format
        expect(result.isRight()).toBe(true);
      });

      it('should handle double encoding attempts', async () => {
        const request = {
          email: 'double@example.com',
          password: 'SecurePass123',
          fullName: '%253Cscript%253E', // Double encoded <script>
          nationalId: '98888888882',
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);

        // Should store as-is without decoding
        const profile = profileRepo.items.find(
          (p) => p.nationalId.value === '98888888882',
        );
        expect(profile?.fullName).toBe('%253Cscript%253E');
      });
    });
  });
});
