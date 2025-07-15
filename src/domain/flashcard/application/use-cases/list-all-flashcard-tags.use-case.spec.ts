import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListAllFlashcardTagsUseCase } from './list-all-flashcard-tags.use-case';
import { InMemoryFlashcardTagRepository } from '../../../../test/repositories/in-memory-flashcard-tag-repository';
import { FlashcardTag } from '../../enterprise/entities/flashcard-tag.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

describe('ListAllFlashcardTagsUseCase', () => {
  let useCase: ListAllFlashcardTagsUseCase;
  let flashcardTagRepository: InMemoryFlashcardTagRepository;

  beforeEach(() => {
    flashcardTagRepository = new InMemoryFlashcardTagRepository();
    useCase = new ListAllFlashcardTagsUseCase(flashcardTagRepository);
  });

  describe('Success Cases', () => {
    it('should successfully list all flashcard tags when repository has data', async () => {
      // Arrange
      const flashcardTag1 = FlashcardTag.create(
        { name: 'Farmacologia' },
        new UniqueEntityID('1'),
      );
      const flashcardTag2 = FlashcardTag.create(
        { name: 'Anatomia' },
        new UniqueEntityID('2'),
      );
      const flashcardTag3 = FlashcardTag.create(
        { name: 'Fisiologia' },
        new UniqueEntityID('3'),
      );

      flashcardTagRepository.items.push(flashcardTag1, flashcardTag2, flashcardTag3);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTags).toHaveLength(3);
        expect(result.value.flashcardTags[0].name).toBe('Anatomia'); // Ordenado por nome
        expect(result.value.flashcardTags[1].name).toBe('Farmacologia');
        expect(result.value.flashcardTags[2].name).toBe('Fisiologia');
      }
    });

    it('should return empty array when no flashcard tags exist', async () => {
      // Arrange
      // Repository vazio

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTags).toHaveLength(0);
        expect(result.value.flashcardTags).toEqual([]);
      }
    });

    it('should return flashcard tags with correct response object structure', async () => {
      // Arrange
      const flashcardTag = FlashcardTag.create(
        { name: 'Test Tag', slug: 'test-tag' },
        new UniqueEntityID('test-id'),
      );
      flashcardTagRepository.items.push(flashcardTag);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const responseTag = result.value.flashcardTags[0];
        expect(responseTag).toHaveProperty('id');
        expect(responseTag).toHaveProperty('name');
        expect(responseTag).toHaveProperty('slug');
        expect(responseTag).toHaveProperty('createdAt');
        expect(responseTag).toHaveProperty('updatedAt');
        expect(responseTag.id).toBe('test-id');
        expect(responseTag.name).toBe('Test Tag');
        expect(responseTag.slug).toBe('test-tag');
      }
    });

    it('should handle single flashcard tag correctly', async () => {
      // Arrange
      const flashcardTag = FlashcardTag.create(
        { name: 'Single Tag' },
        new UniqueEntityID('single-id'),
      );
      flashcardTagRepository.items.push(flashcardTag);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTags).toHaveLength(1);
        expect(result.value.flashcardTags[0].name).toBe('Single Tag');
      }
    });

    it('should handle large number of flashcard tags', async () => {
      // Arrange
      const tags = [];
      for (let i = 1; i <= 100; i++) {
        const tag = FlashcardTag.create(
          { name: `Tag ${i.toString().padStart(3, '0')}` },
          new UniqueEntityID(`id-${i}`),
        );
        tags.push(tag);
      }
      flashcardTagRepository.items.push(...tags);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTags).toHaveLength(100);
        // Verificar se está ordenado por nome
        expect(result.value.flashcardTags[0].name).toBe('Tag 001');
        expect(result.value.flashcardTags[99].name).toBe('Tag 100');
      }
    });
  });

  describe('Validation Errors', () => {
    it('should reject request with extra fields', async () => {
      // Arrange
      const invalidRequest = {
        unexpectedField: 'value',
      } as any;

      // Act
      const result = await useCase.execute(invalidRequest);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toBe('Validation failed');
        expect(result.value.details).toBeDefined();
      }
    });

    it('should accept empty request object', async () => {
      // Arrange
      const request = {};

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
    });
  });

  describe('Repository Errors', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      vi.spyOn(flashcardTagRepository, 'findAll').mockResolvedValue(
        { isLeft: () => true, value: new Error(errorMessage) } as any,
      );

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toBe('Failed to retrieve flashcard tags');
      }
    });

    it('should handle unexpected repository errors', async () => {
      // Arrange
      vi.spyOn(flashcardTagRepository, 'findAll').mockRejectedValue(
        new Error('Unexpected error'),
      );

      // Act & Assert
      await expect(useCase.execute({})).rejects.toThrow('Unexpected error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle tags with special characters in names', async () => {
      // Arrange
      const specialTag = FlashcardTag.create(
        { name: 'Anatomia & Fisiologia' },
        new UniqueEntityID('special-id'),
      );
      flashcardTagRepository.items.push(specialTag);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTags[0].name).toBe('Anatomia & Fisiologia');
        expect(result.value.flashcardTags[0].slug).toBe('anatomia-fisiologia');
      }
    });

    it('should handle tags with unicode characters', async () => {
      // Arrange
      const unicodeTag = FlashcardTag.create(
        { name: 'Médico Português' },
        new UniqueEntityID('unicode-id'),
      );
      flashcardTagRepository.items.push(unicodeTag);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTags[0].name).toBe('Médico Português');
        expect(result.value.flashcardTags[0].slug).toBe('medico-portugues');
      }
    });

    it('should handle tags with very long names', async () => {
      // Arrange
      const longName = 'A'.repeat(200);
      const longTag = FlashcardTag.create(
        { name: longName },
        new UniqueEntityID('long-id'),
      );
      flashcardTagRepository.items.push(longTag);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTags[0].name).toBe(longName);
        expect(result.value.flashcardTags[0].slug.length).toBeLessThanOrEqual(50);
      }
    });

    it('should handle tags with identical names (edge case)', async () => {
      // Arrange
      const tag1 = FlashcardTag.create(
        { name: 'Duplicate Name', slug: 'duplicate-1' },
        new UniqueEntityID('1'),
      );
      const tag2 = FlashcardTag.create(
        { name: 'Duplicate Name', slug: 'duplicate-2' },
        new UniqueEntityID('2'),
      );
      flashcardTagRepository.items.push(tag1, tag2);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcardTags).toHaveLength(2);
        expect(result.value.flashcardTags[0].name).toBe('Duplicate Name');
        expect(result.value.flashcardTags[1].name).toBe('Duplicate Name');
        expect(result.value.flashcardTags[0].slug).toBe('duplicate-1');
        expect(result.value.flashcardTags[1].slug).toBe('duplicate-2');
      }
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data integrity in response objects', async () => {
      // Arrange
      const originalTag = FlashcardTag.create(
        { name: 'Original Tag' },
        new UniqueEntityID('original-id'),
      );
      flashcardTagRepository.items.push(originalTag);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const responseTag = result.value.flashcardTags[0];
        
        // Verificar que os dados não foram modificados
        expect(responseTag.name).toBe(originalTag.name);
        expect(responseTag.slug).toBe(originalTag.slug);
        expect(responseTag.id).toBe(originalTag.id.toString());
        expect(responseTag.createdAt).toBe(originalTag.createdAt);
        expect(responseTag.updatedAt).toBe(originalTag.updatedAt);
      }
    });

    it('should return consistent timestamps', async () => {
      // Arrange
      const tag = FlashcardTag.create(
        { name: 'Timestamp Test' },
        new UniqueEntityID('timestamp-id'),
      );
      flashcardTagRepository.items.push(tag);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const responseTag = result.value.flashcardTags[0];
        expect(responseTag.createdAt).toBeInstanceOf(Date);
        expect(responseTag.updatedAt).toBeInstanceOf(Date);
        expect(responseTag.createdAt.getTime()).toBeLessThanOrEqual(
          responseTag.updatedAt.getTime(),
        );
      }
    });
  });
});