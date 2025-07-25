// src/domain/auth/application/use-cases/profile/update-own-profile.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateOwnProfileUseCase } from './update-own-profile.use-case';
import { InMemoryUserIdentityRepository } from '@/test/repositories/in-memory-user-identity-repository';
import { InMemoryUserProfileRepository } from '@/test/repositories/in-memory-user-profile-repository';
import { UserIdentity } from '@/domain/auth/enterprise/entities/user-identity';
import { UserProfile } from '@/domain/auth/enterprise/entities/user-profile';
import { Email } from '@/domain/auth/enterprise/value-objects/email.vo';
import { Password } from '@/domain/auth/enterprise/value-objects/password.vo';
import { NationalId } from '@/domain/auth/enterprise/value-objects/national-id.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left, right } from '@/core/either';
import {
  InvalidInputError,
  ResourceNotFoundError,
  DuplicateEmailError,
  DuplicateNationalIdError,
  RepositoryError,
} from '@/domain/auth/domain/exceptions';

describe('UpdateOwnProfileUseCase', () => {
  let useCase: UpdateOwnProfileUseCase;
  let identityRepo: InMemoryUserIdentityRepository;
  let profileRepo: InMemoryUserProfileRepository;

  beforeEach(() => {
    identityRepo = new InMemoryUserIdentityRepository();
    profileRepo = new InMemoryUserProfileRepository();
    useCase = new UpdateOwnProfileUseCase(identityRepo, profileRepo);
  });

  describe('Success cases', () => {
    it('should update only name', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        name: 'John Updated Doe',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.profile.fullName).toBe('John Updated Doe');
        expect(result.value.identity.email).toBe('john@example.com');
        expect(result.value.profile.nationalId).toBe('12345678901');
      }
    });

    it('should update only email', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        email: 'john.updated@example.com',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.identity.email).toBe('john.updated@example.com');
        expect(result.value.profile.fullName).toBe('John Doe');
      }
    });

    it('should update only nationalId', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        nationalId: '98765432101',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.profile.nationalId).toBe('98765432101');
        expect(result.value.profile.fullName).toBe('John Doe');
      }
    });

    it('should update phone number', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        phone: '+1234567890',
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        phone: '+9876543210',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.profile.phone).toBe('+9876543210');
      }
    });

    it('should update birth date', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const birthDate = '1990-01-01';
      const result = await useCase.execute({
        identityId: identityId.toString(),
        birthDate,
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.profile.birthDate).toEqual(new Date(birthDate));
      }
    });

    it('should update profile image URL', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        profileImageUrl: 'https://example.com/avatar.jpg',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.profile.profileImageUrl).toBe(
          'https://example.com/avatar.jpg',
        );
      }
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        name: 'John Updated',
        email: 'john.new@example.com',
        phone: '+1234567890',
        birthDate: '1990-01-01',
        profileImageUrl: 'https://example.com/avatar.jpg',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.identity.email).toBe('john.new@example.com');
        expect(result.value.profile.fullName).toBe('John Updated');
        expect(result.value.profile.phone).toBe('+1234567890');
        expect(result.value.profile.birthDate).toEqual(new Date('1990-01-01'));
        expect(result.value.profile.profileImageUrl).toBe(
          'https://example.com/avatar.jpg',
        );
      }
    });

    it('should handle null values to clear optional fields', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        phone: '+1234567890',
        birthDate: new Date('1990-01-01'),
        profileImageUrl: 'https://example.com/old.jpg',
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        phone: null as any,
        birthDate: null as any,
        profileImageUrl: null as any,
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.profile.phone).toBeNull();
        expect(result.value.profile.birthDate).toBeNull();
        expect(result.value.profile.profileImageUrl).toBeNull();
      }
    });

    it('should not update email if same value is provided', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const email = 'john@example.com';
      const identity = UserIdentity.create(
        {
          email: Email.create(email),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        email: email, // Same email
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.identity.email).toBe(email);
      }
    });

    it('should not update nationalId if same value is provided', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const nationalId = '12345678901';
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create(nationalId),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        nationalId: nationalId, // Same nationalId
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.profile.nationalId).toBe(nationalId);
      }
    });
  });

  describe('Error cases', () => {
    it('should return InvalidInputError for invalid UUID', async () => {
      // Act
      const result = await useCase.execute({
        identityId: 'invalid-uuid',
        name: 'John Doe',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'isUuid',
            message: 'identityId must be a UUID',
            path: ['identityId'],
          });
        }
      }
    });

    it('should return InvalidInputError for invalid email format', async () => {
      // Arrange
      const identityId = new UniqueEntityID();

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        email: 'invalid-email',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'isEmail',
            message: 'email must be an email',
            path: ['email'],
          });
        }
      }
    });

    it('should return InvalidInputError for name too short', async () => {
      // Arrange
      const identityId = new UniqueEntityID();

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        name: 'J',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'minLength',
            message: 'name must be longer than or equal to 2 characters',
            path: ['name'],
          });
        }
      }
    });

    it('should return InvalidInputError for name too long', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const longName = 'a'.repeat(256);

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        name: longName,
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'maxLength',
            message: 'name must be shorter than or equal to 255 characters',
            path: ['name'],
          });
        }
      }
    });

    it('should return InvalidInputError for invalid URL format', async () => {
      // Arrange
      const identityId = new UniqueEntityID();

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        profileImageUrl: 'not-a-url',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'matches',
            message: 'profileImageUrl must be a URL address',
            path: ['profileImageUrl'],
          });
        }
      }
    });

    it('should return InvalidInputError when no fields are provided', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe(
          'At least one field must be provided for update',
        );
      }
    });

    it('should return ResourceNotFoundError when identity does not exist', async () => {
      // Arrange
      const identityId = new UniqueEntityID();

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        name: 'John Doe',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
        expect(result.value.message).toContain('UserIdentity');
        expect(result.value.message).toContain(identityId.toString());
      }
    });

    it('should return ResourceNotFoundError when profile does not exist', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);
      // Profile not created

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        name: 'John Doe',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
        expect(result.value.message).toContain('UserProfile');
      }
    });

    it('should return DuplicateEmailError when email already exists', async () => {
      // Arrange
      const identityId1 = new UniqueEntityID();
      const identityId2 = new UniqueEntityID();

      const identity1 = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId1,
      );
      await identityRepo.create(identity1);

      const identity2 = UserIdentity.create(
        {
          email: Email.create('jane@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId2,
      );
      await identityRepo.create(identity2);

      const profile = UserProfile.create({
        identityId: identityId1,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        identityId: identityId1.toString(),
        email: 'jane@example.com', // Email already used by identity2
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DuplicateEmailError);
        expect(result.value.message).toBe(
          'Conflict in User: Email already registered',
        );
      }
    });

    it('should return DuplicateNationalIdError when nationalId already exists', async () => {
      // Arrange
      const identityId1 = new UniqueEntityID();
      const identityId2 = new UniqueEntityID();

      const identity1 = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId1,
      );
      await identityRepo.create(identity1);

      const identity2 = UserIdentity.create(
        {
          email: Email.create('jane@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId2,
      );
      await identityRepo.create(identity2);

      const profile1 = UserProfile.create({
        identityId: identityId1,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile1);

      const profile2 = UserProfile.create({
        identityId: identityId2,
        fullName: 'Jane Doe',
        nationalId: NationalId.create('98765432101'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile2);

      // Act
      const result = await useCase.execute({
        identityId: identityId1.toString(),
        nationalId: '98765432101', // NationalId already used by profile2
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DuplicateNationalIdError);
        expect(result.value.message).toBe(
          'Conflict in User: National ID already registered',
        );
      }
    });

    it('should return InvalidInputError for invalid email value object', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Mock Email.create to throw
      const originalCreate = Email.create;
      Email.create = vi.fn(() => {
        throw new Error('Invalid email format');
      });

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        email: 'invalid@',
      });

      // Restore
      Email.create = originalCreate;

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Validation failed');
      }
    });

    it('should return InvalidInputError for invalid nationalId value object', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Mock NationalId.create to throw
      const originalCreate = NationalId.create;
      NationalId.create = vi.fn(() => {
        throw new Error('Invalid national ID must be 11 digits');
      });

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        nationalId: '123',
      });

      // Restore
      NationalId.create = originalCreate;

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe(
          'Invalid format for field: nationalId',
        );
      }
    });

    it('should return RepositoryError when identity save fails', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Mock save to fail
      vi.spyOn(identityRepo, 'save').mockResolvedValueOnce(
        left(new Error('Database error')),
      );

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        email: 'newemail@example.com',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        if (result.value instanceof RepositoryError) {
          expect(result.value.context.operation).toBe('save identity');
        }
      }
    });

    it('should return RepositoryError when profile save fails', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Mock save to fail
      vi.spyOn(profileRepo, 'save').mockResolvedValueOnce(
        left(new Error('Database error')),
      );

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        name: 'New Name',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        if (result.value instanceof RepositoryError) {
          expect(result.value.context.operation).toBe('save profile');
        }
      }
    });

    it('should return RepositoryError when email check fails', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Mock findByEmail to throw
      vi.spyOn(identityRepo, 'findByEmail').mockRejectedValueOnce(
        new Error('Database error'),
      );

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        email: 'newemail@example.com',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        if (result.value instanceof RepositoryError) {
          expect(result.value.context.operation).toBe('findByEmail');
        }
      }
    });

    it('should return RepositoryError when nationalId check fails', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Mock findByNationalId to throw
      vi.spyOn(profileRepo, 'findByNationalId').mockRejectedValueOnce(
        new Error('Database error'),
      );

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        nationalId: '98765432101',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        if (result.value instanceof RepositoryError) {
          expect(result.value.context.operation).toBe('findByNationalId');
        }
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings as validation error', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        phone: '+1234567890',
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        name: '', // Empty string fails MinLength validation
        phone: '',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Validation failed');
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'minLength',
            message: 'name must be longer than or equal to 2 characters',
            path: ['name'],
          });
        }
      }
    });

    it('should handle identity repository returning null', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      vi.spyOn(identityRepo, 'findById').mockResolvedValueOnce(right(null));

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        name: 'John Doe',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      }
    });

    it('should handle profile repository returning null', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      vi.spyOn(profileRepo, 'findByIdentityId').mockResolvedValueOnce(
        right(null),
      );

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        name: 'John Doe',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      }
    });

    it('should handle identity repository returning error', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      vi.spyOn(identityRepo, 'findById').mockResolvedValueOnce(
        left(new Error('Database error')),
      );

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        name: 'John Doe',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      }
    });

    it('should handle profile repository returning error', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      vi.spyOn(profileRepo, 'findByIdentityId').mockResolvedValueOnce(
        left(new Error('Database error')),
      );

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        name: 'John Doe',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      }
    });

    it('should update only fields that have changed', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const originalEmail = 'john@example.com';
      const originalName = 'John Doe';
      const originalNationalId = '12345678901';

      const identity = UserIdentity.create(
        {
          email: Email.create(originalEmail),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: originalName,
        nationalId: NationalId.create(originalNationalId),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      const saveSpy = vi.spyOn(identityRepo, 'save');

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        email: originalEmail, // Same email
        name: 'John Updated', // Different name
      });

      // Assert
      expect(result.isRight()).toBe(true);
      expect(saveSpy).toHaveBeenCalled(); // Identity saved because email was in request
    });

    it('should handle date string conversion correctly', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const birthDateString = '1990-12-25T10:30:00.000Z';
      const result = await useCase.execute({
        identityId: identityId.toString(),
        birthDate: birthDateString,
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.profile.birthDate).toBeInstanceOf(Date);
        expect(result.value.profile.birthDate?.toISOString()).toBe(
          birthDateString,
        );
      }
    });
  });

  describe('Business rules', () => {
    it('should allow user to update their own profile', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(), // User updating their own profile
        name: 'John Smith',
      });

      // Assert
      expect(result.isRight()).toBe(true);
    });

    it('should maintain data consistency between identity and profile', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        email: 'john.new@example.com',
        name: 'John New',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Verify data from repositories
        const savedIdentity = await identityRepo.findById(
          identityId.toString(),
        );
        const savedProfile = await profileRepo.findByIdentityId(
          identityId.toString(),
        );

        expect(savedIdentity.isRight()).toBe(true);
        expect(savedProfile.isRight()).toBe(true);

        if (savedIdentity.isRight() && savedIdentity.value) {
          expect(savedIdentity.value.email.value).toBe('john.new@example.com');
        }

        if (savedProfile.isRight() && savedProfile.value) {
          expect(savedProfile.value.fullName).toBe('John New');
        }
      }
    });

    it('should not allow duplicate emails across different users', async () => {
      // Arrange
      const identityId1 = new UniqueEntityID();
      const identityId2 = new UniqueEntityID();

      // Create two users
      const identity1 = UserIdentity.create(
        {
          email: Email.create('user1@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId1,
      );
      await identityRepo.create(identity1);

      const identity2 = UserIdentity.create(
        {
          email: Email.create('user2@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId2,
      );
      await identityRepo.create(identity2);

      const profile1 = UserProfile.create({
        identityId: identityId1,
        fullName: 'User One',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile1);

      // Act - Try to update user1's email to user2's email
      const result = await useCase.execute({
        identityId: identityId1.toString(),
        email: 'user2@example.com',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DuplicateEmailError);
      }
    });

    it('should not allow duplicate nationalIds across different users', async () => {
      // Arrange
      const identityId1 = new UniqueEntityID();
      const identityId2 = new UniqueEntityID();

      // Create two users
      const identity1 = UserIdentity.create(
        {
          email: Email.create('user1@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId1,
      );
      await identityRepo.create(identity1);

      const identity2 = UserIdentity.create(
        {
          email: Email.create('user2@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId2,
      );
      await identityRepo.create(identity2);

      const profile1 = UserProfile.create({
        identityId: identityId1,
        fullName: 'User One',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile1);

      const profile2 = UserProfile.create({
        identityId: identityId2,
        fullName: 'User Two',
        nationalId: NationalId.create('98765432101'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile2);

      // Act - Try to update user1's nationalId to user2's nationalId
      const result = await useCase.execute({
        identityId: identityId1.toString(),
        nationalId: '98765432101',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DuplicateNationalIdError);
      }
    });
  });

  describe('Security', () => {
    it('should validate identityId is a valid UUID', async () => {
      // Act
      const result = await useCase.execute({
        identityId: '../../etc/passwd',
        name: 'Hacker',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should sanitize URLs for profileImageUrl', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        identityId: identityId.toString(),
        profileImageUrl: 'javascript:alert("XSS")',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });

  describe('Performance', () => {
    it('should handle updates efficiently', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act
      const start = Date.now();
      const result = await useCase.execute({
        identityId: identityId.toString(),
        name: 'John Updated',
        email: 'john.updated@example.com',
        phone: '+1234567890',
      });
      const duration = Date.now() - start;

      // Assert
      expect(result.isRight()).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe('Type coercion', () => {
    it('should reject non-string values for string fields', async () => {
      // Act
      const result = await useCase.execute({
        identityId: new UniqueEntityID().toString(),
        name: 123 as any,
        email: true as any,
        phone: {} as any,
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should handle date string formats correctly', async () => {
      // Arrange
      const identityId = new UniqueEntityID();
      const identity = UserIdentity.create(
        {
          email: Email.create('john@example.com'),
          password: Password.createFromPlain('StrongP@ssw0rd2024'),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        identityId,
      );
      await identityRepo.create(identity);

      const profile = UserProfile.create({
        identityId,
        fullName: 'John Doe',
        nationalId: NationalId.create('12345678901'),
        createdAt: new Date(),
      });
      await profileRepo.create(profile);

      // Act - Valid ISO date string
      const result = await useCase.execute({
        identityId: identityId.toString(),
        birthDate: '1990-01-01T00:00:00.000Z',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.profile.birthDate).toBeInstanceOf(Date);
      }
    });
  });
});
