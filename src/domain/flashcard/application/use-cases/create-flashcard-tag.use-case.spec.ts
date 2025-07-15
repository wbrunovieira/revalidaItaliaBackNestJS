import { describe, it, expect, beforeEach, vi } from 'vitest';
import { left, right } from '@/core/either';
import { CreateFlashcardTagUseCase } from './create-flashcard-tag.use-case';
import { InMemoryFlashcardTagRepository } from '@/test/repositories/in-memory-flashcard-tag-repository';
import { CreateFlashcardTagRequest } from '../dtos/create-flashcard-tag-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { DuplicateFlashcardTagError } from './errors/duplicate-flashcard-tag-error';
import { FlashcardTag } from '../../enterprise/entities/flashcard-tag.entity';

describe('CreateFlashcardTagUseCase', () => {
  let useCase: CreateFlashcardTagUseCase;
  let mockRepository: InMemoryFlashcardTagRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = new InMemoryFlashcardTagRepository();
    useCase = new CreateFlashcardTagUseCase(mockRepository);
  });

  describe('Success Cases', () => {
    it('should create a flashcard tag with valid data', async () => {
      const request: CreateFlashcardTagRequest = {
        name: 'Farmacologia',
      };

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTag.name).toBe('Farmacologia');
        expect(result.value.flashcardTag.slug).toBe('farmacologia');
        expect(result.value.flashcardTag.id).toBeDefined();
        expect(result.value.flashcardTag.createdAt).toBeInstanceOf(Date);
        expect(result.value.flashcardTag.updatedAt).toBeInstanceOf(Date);
      }

      expect(mockRepository.items).toHaveLength(1);
      expect(mockRepository.items[0].name).toBe('Farmacologia');
    });

    it('should create a flashcard tag with custom slug', async () => {
      const request: CreateFlashcardTagRequest = {
        name: 'Farmacologia Avançada',
        slug: 'farm-avancada',
      };

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTag.name).toBe('Farmacologia Avançada');
        expect(result.value.flashcardTag.slug).toBe('farm-avancada');
      }
    });

    it('should trim whitespace from name', async () => {
      const request: CreateFlashcardTagRequest = {
        name: '  Anatomia  ',
      };

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTag.name).toBe('Anatomia');
      }
    });

    it('should handle special characters in name', async () => {
      const request: CreateFlashcardTagRequest = {
        name: 'Anatomia & Fisiologia',
      };

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTag.name).toBe('Anatomia & Fisiologia');
        expect(result.value.flashcardTag.slug).toBe('anatomia-fisiologia');
      }
    });
  });

  describe('Validation Errors', () => {
    it.each([
      {
        request: { name: '' },
        expectedField: 'name',
        expectedMessage: 'Name cannot be empty after trimming',
      },
      {
        request: { name: '  ' },
        expectedField: 'name',
        expectedMessage: 'Name cannot be empty after trimming',
      },
      {
        request: { name: 'AB' },
        expectedField: 'name',
        expectedMessage: 'Name must be at least 3 characters long',
      },
      {
        request: { name: 'A'.repeat(51) },
        expectedField: 'name',
        expectedMessage: 'Name cannot exceed 50 characters',
      },
      {
        request: { name: 'Valid Name', slug: 'AB' },
        expectedField: 'slug',
        expectedMessage: 'Slug must be at least 3 characters long',
      },
      {
        request: { name: 'Valid Name', slug: 'a'.repeat(51) },
        expectedField: 'slug',
        expectedMessage: 'Slug cannot exceed 50 characters',
      },
      {
        request: { name: 'Valid Name', slug: 'Invalid-SLUG' },
        expectedField: 'slug',
        expectedMessage: 'Slug must contain only lowercase letters, numbers, and hyphens',
      },
      {
        request: { name: 'Valid Name', slug: 'invalid slug' },
        expectedField: 'slug',
        expectedMessage: 'Slug must contain only lowercase letters, numbers, and hyphens',
      },
      {
        request: { name: 'Valid Name', slug: 'invalid_slug' },
        expectedField: 'slug',
        expectedMessage: 'Slug must contain only lowercase letters, numbers, and hyphens',
      },
    ])(
      'should return validation error for $request',
      async ({ request, expectedField, expectedMessage }) => {
        const result = await useCase.execute(request as CreateFlashcardTagRequest);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(InvalidInputError);
          const error = result.value as InvalidInputError;
          expect(error.details[expectedField]).toContain(expectedMessage);
        }

        expect(mockRepository.items).toHaveLength(0);
      },
    );

    it('should reject extra fields in request', async () => {
      const request = {
        name: 'Valid Name',
        extraField: 'not allowed',
      };

      const result = await useCase.execute(request as any);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });

  describe('Business Logic Errors', () => {
    it('should return error when name already exists', async () => {
      // Create an existing tag
      const existingTag = FlashcardTag.create({ name: 'Farmacologia' });
      mockRepository.items.push(existingTag);

      const request: CreateFlashcardTagRequest = {
        name: 'Farmacologia',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DuplicateFlashcardTagError);
        expect(result.value.message).toBe('FlashcardTag with this name already exists');
      }

      expect(mockRepository.items).toHaveLength(1); // Only the original tag
    });

    it('should return error when name already exists (case insensitive)', async () => {
      const existingTag = FlashcardTag.create({ name: 'farmacologia' });
      mockRepository.items.push(existingTag);

      const request: CreateFlashcardTagRequest = {
        name: 'FARMACOLOGIA',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DuplicateFlashcardTagError);
      }
    });

    it('should return error when custom slug already exists', async () => {
      const existingTag = FlashcardTag.create({ name: 'Existing Tag', slug: 'custom-slug' });
      mockRepository.items.push(existingTag);

      const request: CreateFlashcardTagRequest = {
        name: 'New Tag',
        slug: 'custom-slug',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        const error = result.value as InvalidInputError;
        expect(error.details.slug).toContain('Slug already exists');
      }
    });
  });

  describe('Repository Errors', () => {
    it('should handle repository error on name existence check', async () => {
      vi.spyOn(mockRepository, 'checkIfNameExists').mockResolvedValueOnce(
        left(new Error('Database connection error')),
      );

      const request: CreateFlashcardTagRequest = {
        name: 'Valid Name',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Failed to check name existence');
      }
    });

    it('should handle repository error on slug existence check', async () => {
      vi.spyOn(mockRepository, 'checkIfSlugExists').mockResolvedValueOnce(
        left(new Error('Database connection error')),
      );

      const request: CreateFlashcardTagRequest = {
        name: 'Valid Name',
        slug: 'valid-slug',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Failed to check slug existence');
      }
    });

    it('should handle repository error on create', async () => {
      vi.spyOn(mockRepository, 'create').mockResolvedValueOnce(
        left(new Error('Database write error')),
      );

      const request: CreateFlashcardTagRequest = {
        name: 'Valid Name',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Failed to create flashcard tag');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum valid name length', async () => {
      const request: CreateFlashcardTagRequest = {
        name: 'ABC',
      };

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTag.name).toBe('ABC');
      }
    });

    it('should handle maximum valid name length', async () => {
      const maxLengthName = 'A'.repeat(50);
      const request: CreateFlashcardTagRequest = {
        name: maxLengthName,
      };

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTag.name).toBe(maxLengthName);
      }
    });

    it('should handle minimum valid slug length', async () => {
      const request: CreateFlashcardTagRequest = {
        name: 'Valid Name',
        slug: 'abc',
      };

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTag.slug).toBe('abc');
      }
    });

    it('should handle maximum valid slug length', async () => {
      const maxLengthSlug = 'a'.repeat(50);
      const request: CreateFlashcardTagRequest = {
        name: 'Valid Name',
        slug: maxLengthSlug,
      };

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTag.slug).toBe(maxLengthSlug);
      }
    });

    it('should handle slug with numbers and hyphens', async () => {
      const request: CreateFlashcardTagRequest = {
        name: 'Valid Name',
        slug: 'test-123-slug',
      };

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTag.slug).toBe('test-123-slug');
      }
    });

    it('should generate unique slugs for similar names', async () => {
      const request1: CreateFlashcardTagRequest = { name: 'Test Name' };
      const request2: CreateFlashcardTagRequest = { name: 'Test Name 2' };

      const result1 = await useCase.execute(request1);
      const result2 = await useCase.execute(request2);

      expect(result1.isRight()).toBe(true);
      expect(result2.isRight()).toBe(true);

      if (result1.isRight() && result2.isRight()) {
        expect(result1.value.flashcardTag.slug).not.toBe(result2.value.flashcardTag.slug);
      }
    });
  });
});