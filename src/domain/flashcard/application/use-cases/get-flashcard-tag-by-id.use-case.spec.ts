import { describe, it, expect, beforeEach, vi } from 'vitest';
import { left, right } from '@/core/either';
import { GetFlashcardTagByIdUseCase } from './get-flashcard-tag-by-id.use-case';
import { InMemoryFlashcardTagRepository } from '@/test/repositories/in-memory-flashcard-tag-repository';
import { GetFlashcardTagByIdRequest } from '../dtos/get-flashcard-tag-by-id-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { FlashcardTagNotFoundError } from './errors/flashcard-tag-not-found-error';
import { FlashcardTag } from '../../enterprise/entities/flashcard-tag.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

describe('GetFlashcardTagByIdUseCase', () => {
  let useCase: GetFlashcardTagByIdUseCase;
  let mockRepository: InMemoryFlashcardTagRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = new InMemoryFlashcardTagRepository();
    useCase = new GetFlashcardTagByIdUseCase(mockRepository);
  });

  describe('Success Cases', () => {
    it('should get a flashcard tag by valid ID', async () => {
      // Create a flashcard tag
      const flashcardTag = FlashcardTag.create(
        {
          name: 'Farmacologia',
          slug: 'farmacologia',
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001'),
      );
      mockRepository.items.push(flashcardTag);

      const request: GetFlashcardTagByIdRequest = {
        id: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTag.id).toBe(
          '550e8400-e29b-41d4-a716-446655440001',
        );
        expect(result.value.flashcardTag.name).toBe('Farmacologia');
        expect(result.value.flashcardTag.slug).toBe('farmacologia');
        expect(result.value.flashcardTag.createdAt).toBeInstanceOf(Date);
        expect(result.value.flashcardTag.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should get flashcard tag with special characters in name', async () => {
      const flashcardTag = FlashcardTag.create(
        {
          name: 'Anatomia & Fisiologia',
          slug: 'anatomia-fisiologia',
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002'),
      );
      mockRepository.items.push(flashcardTag);

      const request: GetFlashcardTagByIdRequest = {
        id: '550e8400-e29b-41d4-a716-446655440002',
      };

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTag.name).toBe('Anatomia & Fisiologia');
        expect(result.value.flashcardTag.slug).toBe('anatomia-fisiologia');
      }
    });

    it('should get flashcard tag with custom slug', async () => {
      const flashcardTag = FlashcardTag.create(
        {
          name: 'Medicina Legal',
          slug: 'med-legal',
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003'),
      );
      mockRepository.items.push(flashcardTag);

      const request: GetFlashcardTagByIdRequest = {
        id: '550e8400-e29b-41d4-a716-446655440003',
      };

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTag.name).toBe('Medicina Legal');
        expect(result.value.flashcardTag.slug).toBe('med-legal');
      }
    });
  });

  describe('Validation Errors', () => {
    it.each([
      {
        request: { id: '' },
        expectedField: 'id',
        expectedMessage: 'ID cannot be empty',
      },
      {
        request: { id: 'not-a-uuid' },
        expectedField: 'id',
        expectedMessage: 'ID must be a valid UUID',
      },
      {
        request: { id: '12345678-1234-1234-1234-12345678901' },
        expectedField: 'id',
        expectedMessage: 'ID must be a valid UUID',
      },
      {
        request: { id: '550e8400-e29b-41d4-a716-44665544000g' },
        expectedField: 'id',
        expectedMessage: 'ID must be a valid UUID',
      },
      {
        request: { id: 'g50e8400-e29b-41d4-a716-446655440001' },
        expectedField: 'id',
        expectedMessage: 'ID must be a valid UUID',
      },
    ])(
      'should return validation error for $request',
      async ({ request, expectedField, expectedMessage }) => {
        const result = await useCase.execute(
          request as GetFlashcardTagByIdRequest,
        );

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(InvalidInputError);
          const error = result.value as InvalidInputError;
          expect(error.details[expectedField]).toContain(expectedMessage);
        }
      },
    );

    it('should reject extra fields in request', async () => {
      const request = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        extraField: 'not allowed',
      };

      const result = await useCase.execute(request as any);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should reject request with missing id field', async () => {
      const request = {} as GetFlashcardTagByIdRequest;

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        const error = result.value as InvalidInputError;
        expect(error.details['id']).toBeDefined();
      }
    });
  });

  describe('Business Logic Errors', () => {
    it('should return error when flashcard tag not found', async () => {
      const request: GetFlashcardTagByIdRequest = {
        id: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(FlashcardTagNotFoundError);
        expect(result.value.message).toBe('FlashcardTag not found');
      }
    });

    it('should return error when ID exists but different case', async () => {
      const flashcardTag = FlashcardTag.create(
        { name: 'Test Tag' },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001'),
      );
      mockRepository.items.push(flashcardTag);

      const request: GetFlashcardTagByIdRequest = {
        id: '550E8400-E29B-41D4-A716-446655440001', // Uppercase UUID
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(FlashcardTagNotFoundError);
      }
    });
  });

  describe('Repository Errors', () => {
    it('should handle repository error on findById', async () => {
      vi.spyOn(mockRepository, 'findById').mockResolvedValueOnce(
        left(new Error('Database connection error')),
      );

      const request: GetFlashcardTagByIdRequest = {
        id: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Failed to find flashcard tag');
      }
    });

    it('should handle repository returning null wrapped in right', async () => {
      vi.spyOn(mockRepository, 'findById').mockResolvedValueOnce(
        right(null as any),
      );

      const request: GetFlashcardTagByIdRequest = {
        id: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(FlashcardTagNotFoundError);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle valid UUID v4 format', async () => {
      const flashcardTag = FlashcardTag.create(
        { name: 'Test Tag' },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001'),
      );
      mockRepository.items.push(flashcardTag);

      const request: GetFlashcardTagByIdRequest = {
        id: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
    });

    it('should handle nil UUID (all zeros)', async () => {
      const request: GetFlashcardTagByIdRequest = {
        id: '00000000-0000-0000-0000-000000000000',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(FlashcardTagNotFoundError);
      }
    });

    it('should handle max UUID (all Fs)', async () => {
      const flashcardTag = FlashcardTag.create(
        { name: 'Test Tag' },
        new UniqueEntityID('ffffffff-ffff-ffff-ffff-ffffffffffff'),
      );
      mockRepository.items.push(flashcardTag);

      const request: GetFlashcardTagByIdRequest = {
        id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      };

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTag.id).toBe(
          'ffffffff-ffff-ffff-ffff-ffffffffffff',
        );
      }
    });

    it('should find correct tag among multiple tags', async () => {
      // Create multiple tags
      for (let i = 1; i <= 5; i++) {
        const tag = FlashcardTag.create(
          { name: `Tag ${i}` },
          new UniqueEntityID(`550e8400-e29b-41d4-a716-44665544000${i}`),
        );
        mockRepository.items.push(tag);
      }

      const request: GetFlashcardTagByIdRequest = {
        id: '550e8400-e29b-41d4-a716-446655440003',
      };

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTag.name).toBe('Tag 3');
        expect(result.value.flashcardTag.id).toBe(
          '550e8400-e29b-41d4-a716-446655440003',
        );
      }
    });

    it('should return latest version when tag is updated', async () => {
      const flashcardTag = FlashcardTag.create(
        { name: 'Original Name' },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001'),
      );
      mockRepository.items.push(flashcardTag);

      // Wait a bit to ensure updatedAt will be different
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Update the tag using the update method
      flashcardTag.updateName('Updated Name');

      const request: GetFlashcardTagByIdRequest = {
        id: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTag.name).toBe('Updated Name');
        expect(result.value.flashcardTag.slug).toBe('updated-name');
        // Verify updatedAt was changed
        expect(result.value.flashcardTag.updatedAt.getTime()).toBeGreaterThan(
          result.value.flashcardTag.createdAt.getTime(),
        );
      }
    });
  });
});
