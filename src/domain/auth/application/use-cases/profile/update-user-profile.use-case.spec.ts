// src/domain/auth/application/use-cases/profile/update-user-profile.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateUserProfileUseCase } from './update-user-profile.use-case';
import { InMemoryUserProfileRepository } from '@/test/repositories/in-memory-user-profile-repository';
import { MockEventDispatcher } from '@/test/mocks/mock-event-dispatcher';
import { UserProfile } from '@/domain/auth/enterprise/entities/user-profile';
import { NationalId } from '@/domain/auth/enterprise/value-objects/national-id.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left, right } from '@/core/either';
import {
  InvalidInputError,
  ResourceNotFoundError,
  RepositoryError,
} from '@/domain/auth/domain/exceptions';
import { UserProfileUpdatedEvent } from '@/domain/auth/enterprise/events/user-profile-updated.event';

describe('UpdateUserProfileUseCase', () => {
  let useCase: UpdateUserProfileUseCase;
  let profileRepo: InMemoryUserProfileRepository;
  let eventDispatcher: MockEventDispatcher;

  beforeEach(() => {
    profileRepo = new InMemoryUserProfileRepository();
    eventDispatcher = new MockEventDispatcher();
    useCase = new UpdateUserProfileUseCase(profileRepo, eventDispatcher);
  });

  describe('Success cases', () => {
    it('should update only fullName', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: 'John Updated Doe',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.fullName).toBe('John Updated Doe');
        expect(result.value.profileId).toBe(profileId.toString());
      }
    });

    it('should update phone number', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        phone: '+1234567890',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.phone).toBe('+1234567890');
      }
    });

    it('should update birth date', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const birthDate = '1990-01-01';
      const result = await useCase.execute({
        profileId: profileId.toString(),
        birthDate,
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.birthDate).toEqual(new Date(birthDate));
      }
    });

    it('should update profile image URL', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        profileImageUrl: 'https://example.com/avatar.jpg',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.profileImageUrl).toBe(
          'https://example.com/avatar.jpg',
        );
      }
    });

    it('should update bio', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        bio: 'Software engineer passionate about clean code',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.bio).toBe(
          'Software engineer passionate about clean code',
        );
      }
    });

    it('should update profession', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        profession: 'Software Engineer',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.profession).toBe('Software Engineer');
      }
    });

    it('should update specialization', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        specialization: 'Backend Development',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.specialization).toBe('Backend Development');
      }
    });

    it('should update preferred language', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        preferredLanguage: 'pt-BR',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.preferredLanguage).toBe('pt-BR');
      }
    });

    it('should update timezone', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        timezone: 'America/Sao_Paulo',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.timezone).toBe('America/Sao_Paulo');
      }
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: 'John Updated',
        phone: '+1234567890',
        birthDate: '1990-01-01',
        profileImageUrl: 'https://example.com/avatar.jpg',
        bio: 'Updated bio',
        profession: 'Senior Engineer',
        specialization: 'Cloud Architecture',
        preferredLanguage: 'pt-BR',
        timezone: 'America/New_York',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.fullName).toBe('John Updated');
        expect(result.value.phone).toBe('+1234567890');
        expect(result.value.birthDate).toEqual(new Date('1990-01-01'));
        expect(result.value.profileImageUrl).toBe(
          'https://example.com/avatar.jpg',
        );
        expect(result.value.bio).toBe('Updated bio');
        expect(result.value.profession).toBe('Senior Engineer');
        expect(result.value.specialization).toBe('Cloud Architecture');
        expect(result.value.preferredLanguage).toBe('pt-BR');
        expect(result.value.timezone).toBe('America/New_York');
      }
    });

    it('should handle null values to clear optional fields', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          phone: '+1234567890',
          birthDate: new Date('1990-01-01'),
          profileImageUrl: 'https://example.com/old.jpg',
          bio: 'Old bio',
          profession: 'Engineer',
          specialization: 'Backend',
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        phone: null,
        birthDate: null,
        profileImageUrl: null,
        bio: null,
        profession: null,
        specialization: null,
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.phone).toBeNull();
        expect(result.value.birthDate).toBeNull();
        expect(result.value.profileImageUrl).toBeNull();
        expect(result.value.bio).toBeNull();
        expect(result.value.profession).toBeNull();
        expect(result.value.specialization).toBeNull();
      }
    });

    it('should dispatch event when fields are updated', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: 'John Updated',
        phone: '+1234567890',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      expect(eventDispatcher.dispatchedEvents).toHaveLength(1);
      const event = eventDispatcher
        .dispatchedEvents[0] as UserProfileUpdatedEvent;
      expect(event.userId).toBe(identityId.toString());
      expect(event.changedFields).toContain('fullName');
      expect(event.changedFields).toContain('phone');
    });

    it('should not dispatch event when no fields are changed', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: 'John Doe', // Same value
      });

      // Assert
      expect(result.isRight()).toBe(true);
      expect(eventDispatcher.dispatchedEvents).toHaveLength(0);
    });

    it('should handle event dispatch failure gracefully', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Mock event dispatcher to throw error
      vi.spyOn(eventDispatcher, 'dispatch').mockRejectedValueOnce(
        new Error('Event dispatch failed'),
      );
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: 'John Updated',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to dispatch profile updated event:',
        expect.any(Error),
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Error cases', () => {
    it('should return InvalidInputError for invalid UUID', async () => {
      // Act
      const result = await useCase.execute({
        profileId: 'invalid-uuid',
        fullName: 'John Doe',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'isUuid',
            message: 'profileId must be a UUID',
            path: ['profileId'],
          });
        }
      }
    });

    it('should return InvalidInputError for fullName too short', async () => {
      // Arrange
      const profileId = new UniqueEntityID();

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: 'J',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'minLength',
            message: 'fullName must be longer than or equal to 2 characters',
            path: ['fullName'],
          });
        }
      }
    });

    it('should return InvalidInputError for fullName too long', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const longName = 'a'.repeat(256);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: longName,
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'maxLength',
            message: 'fullName must be shorter than or equal to 255 characters',
            path: ['fullName'],
          });
        }
      }
    });

    it('should return InvalidInputError for invalid URL format', async () => {
      // Arrange
      const profileId = new UniqueEntityID();

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        profileImageUrl: 'not-a-url',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'isUrl',
            message: 'profileImageUrl must be a URL address',
            path: ['profileImageUrl'],
          });
        }
      }
    });

    it('should return InvalidInputError for bio too long', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const longBio = 'a'.repeat(501);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        bio: longBio,
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'maxLength',
            message: 'bio must be shorter than or equal to 500 characters',
            path: ['bio'],
          });
        }
      }
    });

    it('should return InvalidInputError for invalid preferred language', async () => {
      // Arrange
      const profileId = new UniqueEntityID();

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        preferredLanguage: 'invalid-lang',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'isIn',
            message:
              'preferredLanguage must be one of the following values: pt-BR, it, es, en',
            path: ['preferredLanguage'],
          });
        }
      }
    });

    it('should return InvalidInputError for invalid timezone', async () => {
      // Arrange
      const profileId = new UniqueEntityID();

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        timezone: 'Invalid/Timezone',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toContainEqual({
            code: 'isTimeZone',
            message: 'timezone must be a valid IANA time-zone',
            path: ['timezone'],
          });
        }
      }
    });

    it('should return InvalidInputError when no fields are provided', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
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

    it('should return ResourceNotFoundError when profile does not exist', async () => {
      // Arrange
      const profileId = new UniqueEntityID();

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: 'John Doe',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
        expect(result.value.message).toContain('Profile');
        expect(result.value.message).toContain(profileId.toString());
      }
    });

    it('should return RepositoryError when save fails', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Mock save to fail
      vi.spyOn(profileRepo, 'save').mockResolvedValueOnce(
        left(new Error('Database error')),
      );

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: 'New Name',
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

    it('should return RepositoryError when findById throws', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      vi.spyOn(profileRepo, 'findById').mockRejectedValueOnce(
        new Error('Database error'),
      );

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: 'John Doe',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        if (result.value instanceof RepositoryError) {
          expect(result.value.context.operation).toBe('updateProfile');
        }
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle profile repository returning null', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      vi.spyOn(profileRepo, 'findById').mockResolvedValueOnce(right(null));

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: 'John Doe',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      }
    });

    it('should handle profile repository returning error', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      vi.spyOn(profileRepo, 'findById').mockResolvedValueOnce(
        left(new Error('Database error')),
      );

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: 'John Doe',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      }
    });

    it('should handle empty strings as validation error', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: '', // Empty string fails MinLength validation
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Validation failed');
      }
    });

    it('should handle date string conversion correctly', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const birthDateString = '1990-12-25T10:30:00.000Z';
      const result = await useCase.execute({
        profileId: profileId.toString(),
        birthDate: birthDateString,
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.birthDate).toBeInstanceOf(Date);
        expect(result.value.birthDate?.toISOString()).toBe(birthDateString);
      }
    });

    it('should compare dates correctly for event dispatching', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const existingDate = new Date('1990-01-01');
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          birthDate: existingDate,
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act - Update with different date
      const result = await useCase.execute({
        profileId: profileId.toString(),
        birthDate: '1991-01-01',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      expect(eventDispatcher.dispatchedEvents).toHaveLength(1);
      const event = eventDispatcher
        .dispatchedEvents[0] as UserProfileUpdatedEvent;
      expect(event.changedFields).toContain('birthDate');
    });

    it('should handle all supported languages', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      const languages = ['pt-BR', 'it', 'es', 'en'];

      for (const lang of languages) {
        // Act
        const result = await useCase.execute({
          profileId: profileId.toString(),
          preferredLanguage: lang,
        });

        // Assert
        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value.preferredLanguage).toBe(lang);
        }
      }
    });

    it('should not update fields that are not provided', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          phone: '+1234567890',
          bio: 'Original bio',
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act - Only update fullName
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: 'John Updated',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.fullName).toBe('John Updated');
        expect(result.value.phone).toBe('+1234567890'); // Unchanged
        expect(result.value.bio).toBe('Original bio'); // Unchanged
      }
    });
  });

  describe('Business rules', () => {
    it('should allow updating profile with valid data', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: 'John Smith',
        profession: 'Software Engineer',
      });

      // Assert
      expect(result.isRight()).toBe(true);
    });

    it('should track all changed fields in event', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          phone: '+1111111111',
          bio: 'Old bio',
          profession: 'Developer',
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: 'John Updated',
        phone: '+2222222222',
        bio: 'New bio',
        profession: 'Senior Developer',
        preferredLanguage: 'pt-BR',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      expect(eventDispatcher.dispatchedEvents).toHaveLength(1);
      const event = eventDispatcher
        .dispatchedEvents[0] as UserProfileUpdatedEvent;
      expect(event.changedFields).toHaveLength(5);
      expect(event.changedFields).toContain('fullName');
      expect(event.changedFields).toContain('phone');
      expect(event.changedFields).toContain('bio');
      expect(event.changedFields).toContain('profession');
      expect(event.changedFields).toContain('preferredLanguage');
    });

    it('should maintain data consistency after update', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: 'John Updated',
        phone: '+1234567890',
      });

      // Assert
      expect(result.isRight()).toBe(true);

      // Verify data from repository
      const savedProfile = await profileRepo.findById(profileId.toString());
      expect(savedProfile.isRight()).toBe(true);
      if (savedProfile.isRight() && savedProfile.value) {
        expect(savedProfile.value.fullName).toBe('John Updated');
        expect(savedProfile.value.phone).toBe('+1234567890');
        expect(savedProfile.value.nationalId.value).toBe('12345678901'); // Unchanged
      }
    });
  });

  describe('Security', () => {
    it('should validate profileId is a valid UUID', async () => {
      // Act
      const result = await useCase.execute({
        profileId: '../../etc/passwd',
        fullName: 'Hacker',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should sanitize URLs for profileImageUrl', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        profileImageUrl: 'javascript:alert("XSS")',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should validate timezone against IANA database', async () => {
      // Arrange
      const profileId = new UniqueEntityID();

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        timezone: 'Fake/Timezone',
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
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act
      const start = Date.now();
      const result = await useCase.execute({
        profileId: profileId.toString(),
        fullName: 'John Updated',
        phone: '+1234567890',
        bio: 'Updated bio',
      });
      const duration = Date.now() - start;

      // Assert
      expect(result.isRight()).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle large bio text', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      const largeBio = 'Lorem ipsum '.repeat(40); // ~480 characters

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        bio: largeBio,
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.bio).toBe(largeBio);
      }
    });
  });

  describe('Type coercion', () => {
    it('should reject non-string values for string fields', async () => {
      // Act
      const result = await useCase.execute({
        profileId: new UniqueEntityID().toString(),
        fullName: 123 as any,
        phone: true as any,
        bio: {} as any,
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should handle date string formats correctly', async () => {
      // Arrange
      const profileId = new UniqueEntityID();
      const identityId = new UniqueEntityID();
      const profile = UserProfile.create(
        {
          identityId,
          fullName: 'John Doe',
          nationalId: NationalId.create('12345678901'),
          preferredLanguage: 'en',
          timezone: 'UTC',
          createdAt: new Date(),
        },
        profileId,
      );
      await profileRepo.create(profile);

      // Act - Valid ISO date string
      const result = await useCase.execute({
        profileId: profileId.toString(),
        birthDate: '1990-01-01T00:00:00.000Z',
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.birthDate).toBeInstanceOf(Date);
      }
    });

    it('should reject invalid date formats', async () => {
      // Arrange
      const profileId = new UniqueEntityID();

      // Act
      const result = await useCase.execute({
        profileId: profileId.toString(),
        birthDate: 'not-a-date' as any,
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });
});
