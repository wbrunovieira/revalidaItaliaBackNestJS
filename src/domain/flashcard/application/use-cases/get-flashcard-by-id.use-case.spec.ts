// src/domain/flashcard/application/use-cases/get-flashcard-by-id.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetFlashcardByIdUseCase } from './get-flashcard-by-id.use-case';
import { InMemoryFlashcardRepository } from '@/test/repositories/in-memory-flashcard-repository';
import { InMemoryFlashcardTagRepository } from '@/test/repositories/in-memory-flashcard-tag-repository';
import { Flashcard } from '../../enterprise/entities/flashcard.entity';
import { FlashcardTag } from '../../enterprise/entities/flashcard-tag.entity';
import { FlashcardContentVO } from '../../enterprise/value-objects/flashcard-content.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { InvalidInputError } from './errors/invalid-input-error';
import { FlashcardNotFoundError } from './errors/flashcard-not-found-error';
import { RepositoryError } from './errors/repository-error';

describe('GetFlashcardByIdUseCase', () => {
  let useCase: GetFlashcardByIdUseCase;
  let flashcardRepository: InMemoryFlashcardRepository;
  let flashcardTagRepository: InMemoryFlashcardTagRepository;

  beforeEach(() => {
    flashcardRepository = new InMemoryFlashcardRepository();
    flashcardTagRepository = new InMemoryFlashcardTagRepository();
    useCase = new GetFlashcardByIdUseCase(flashcardRepository, flashcardTagRepository);
  });

  describe('Success scenarios', () => {
    it('should get a flashcard by ID without filters', async () => {
      // Arrange
      const flashcard = Flashcard.create({
        slug: 'test-flashcard',
        question: FlashcardContentVO.createText('What is DDD?'),
        answer: FlashcardContentVO.createText('Domain-Driven Design'),
        argumentId: new UniqueEntityID('argument-id'),
        tagIds: [],
      });
      await flashcardRepository.create(flashcard);

      // Act
      const result = await useCase.execute({
        id: flashcard.id.toString(),
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcard.id).toBe(flashcard.id.toString());
        expect(result.value.flashcard.slug).toBe('test-flashcard');
        expect(result.value.flashcard.question).toEqual({
          type: 'TEXT',
          content: 'What is DDD?',
        });
        expect(result.value.flashcard.answer).toEqual({
          type: 'TEXT',
          content: 'Domain-Driven Design',
        });
        expect(result.value.flashcard.argumentId).toBe('argument-id');
        expect(result.value.flashcard.tags).toBeUndefined();
      }
    });

    it('should get a flashcard with tags when includeTags is true', async () => {
      // Arrange
      const tag1 = FlashcardTag.create({
        name: 'Architecture',
        slug: 'architecture',
      });
      const tag2 = FlashcardTag.create({
        name: 'Design Patterns',
        slug: 'design-patterns',
      });
      await flashcardTagRepository.create(tag1);
      await flashcardTagRepository.create(tag2);

      const flashcard = Flashcard.create({
        slug: 'test-flashcard',
        question: FlashcardContentVO.createText('What is DDD?'),
        answer: FlashcardContentVO.createText('Domain-Driven Design'),
        argumentId: new UniqueEntityID('argument-id'),
        tagIds: [tag1.id, tag2.id],
      });
      await flashcardRepository.create(flashcard);

      // Act
      const result = await useCase.execute({
        id: flashcard.id.toString(),
        filters: {
          includeTags: true,
        },
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcard.tags).toBeDefined();
        expect(result.value.flashcard.tags).toHaveLength(2);
        expect(result.value.flashcard.tags![0].name).toBe('Architecture');
        expect(result.value.flashcard.tags![1].name).toBe('Design Patterns');
      }
    });

    it('should get a flashcard without tags when includeTags is false', async () => {
      // Arrange
      const tag = FlashcardTag.create({
        name: 'Architecture',
        slug: 'architecture',
      });
      await flashcardTagRepository.create(tag);

      const flashcard = Flashcard.create({
        slug: 'test-flashcard',
        question: FlashcardContentVO.createText('What is DDD?'),
        answer: FlashcardContentVO.createText('Domain-Driven Design'),
        argumentId: new UniqueEntityID('argument-id'),
        tagIds: [tag.id],
      });
      await flashcardRepository.create(flashcard);

      // Act
      const result = await useCase.execute({
        id: flashcard.id.toString(),
        filters: {
          includeTags: false,
        },
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcard.tags).toBeUndefined();
      }
    });

    it('should handle flashcard with image content', async () => {
      // Arrange
      const flashcard = Flashcard.create({
        slug: 'anatomy-flashcard',
        question: FlashcardContentVO.createImage('https://example.com/heart.jpg'),
        answer: FlashcardContentVO.createText('The human heart'),
        argumentId: new UniqueEntityID('argument-id'),
        tagIds: [],
      });
      await flashcardRepository.create(flashcard);

      // Act
      const result = await useCase.execute({
        id: flashcard.id.toString(),
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcard.question).toEqual({
          type: 'IMAGE',
          content: 'https://example.com/heart.jpg',
        });
        expect(result.value.flashcard.answer).toEqual({
          type: 'TEXT',
          content: 'The human heart',
        });
      }
    });

    it('should include optional fields when present', async () => {
      // Arrange
      const flashcard = Flashcard.create({
        slug: 'test-flashcard',
        question: FlashcardContentVO.createText('What is DDD?'),
        answer: FlashcardContentVO.createText('Domain-Driven Design'),
        argumentId: new UniqueEntityID('argument-id'),
        tagIds: [],
        importBatchId: 'batch-123',
        exportedAt: new Date('2024-01-01'),
      });
      await flashcardRepository.create(flashcard);

      // Act
      const result = await useCase.execute({
        id: flashcard.id.toString(),
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcard.importBatchId).toBe('batch-123');
        expect(result.value.flashcard.exportedAt).toEqual(new Date('2024-01-01'));
      }
    });
  });

  describe('Error scenarios', () => {
    it('should return InvalidInputError for invalid UUID', async () => {
      // Act
      const result = await useCase.execute({
        id: 'invalid-uuid',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Invalid input data');
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toHaveProperty('id');
        }
      }
    });

    it('should return InvalidInputError for empty ID', async () => {
      // Act
      const result = await useCase.execute({
        id: '',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.value instanceof InvalidInputError) {
          expect(result.value.details).toHaveProperty('id');
        }
      }
    });

    it('should return FlashcardNotFoundError when flashcard does not exist', async () => {
      // Act
      const result = await useCase.execute({
        id: '550e8400-e29b-41d4-a716-446655440000',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(FlashcardNotFoundError);
        expect(result.value.message).toContain('550e8400-e29b-41d4-a716-446655440000');
      }
    });

    it('should handle repository error gracefully', async () => {
      // Arrange
      vi.spyOn(flashcardRepository, 'findById').mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      // Act
      const result = await useCase.execute({
        id: '550e8400-e29b-41d4-a716-446655440000',
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toContain('Database connection failed');
      }
    });

    it('should handle tag repository error when includeTags is true', async () => {
      // Arrange
      const tag = FlashcardTag.create({
        name: 'Test Tag',
        slug: 'test-tag',
      });

      const flashcard = Flashcard.create({
        slug: 'test-flashcard',
        question: FlashcardContentVO.createText('Question'),
        answer: FlashcardContentVO.createText('Answer'),
        argumentId: new UniqueEntityID('argument-id'),
        tagIds: [tag.id],
      });
      await flashcardRepository.create(flashcard);

      vi.spyOn(flashcardTagRepository, 'findByIds').mockImplementationOnce(() => {
        throw new Error('Tag repository error');
      });

      // Act
      const result = await useCase.execute({
        id: flashcard.id.toString(),
        filters: {
          includeTags: true,
        },
      });

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toContain('Tag repository error');
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle flashcard with no tags when includeTags is true', async () => {
      // Arrange
      const flashcard = Flashcard.create({
        slug: 'test-flashcard',
        question: FlashcardContentVO.createText('Question'),
        answer: FlashcardContentVO.createText('Answer'),
        argumentId: new UniqueEntityID('argument-id'),
        tagIds: [],
      });
      await flashcardRepository.create(flashcard);

      // Act
      const result = await useCase.execute({
        id: flashcard.id.toString(),
        filters: {
          includeTags: true,
        },
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcard.tags).toBeUndefined();
      }
    });

    it('should handle when some tags are not found', async () => {
      // Arrange
      const existingTag = FlashcardTag.create({
        name: 'Existing Tag',
        slug: 'existing-tag',
      });
      await flashcardTagRepository.create(existingTag);

      const nonExistentTagId = new UniqueEntityID();
      const flashcard = Flashcard.create({
        slug: 'test-flashcard',
        question: FlashcardContentVO.createText('Question'),
        answer: FlashcardContentVO.createText('Answer'),
        argumentId: new UniqueEntityID('argument-id'),
        tagIds: [existingTag.id, nonExistentTagId],
      });
      await flashcardRepository.create(flashcard);

      // Act
      const result = await useCase.execute({
        id: flashcard.id.toString(),
        filters: {
          includeTags: true,
        },
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcard.tags).toHaveLength(1);
        expect(result.value.flashcard.tags![0].id).toBe(existingTag.id.toString());
      }
    });

    it('should handle all filter options set to false', async () => {
      // Arrange
      const flashcard = Flashcard.create({
        slug: 'test-flashcard',
        question: FlashcardContentVO.createText('Question'),
        answer: FlashcardContentVO.createText('Answer'),
        argumentId: new UniqueEntityID('argument-id'),
        tagIds: [new UniqueEntityID()],
      });
      await flashcardRepository.create(flashcard);

      // Act
      const result = await useCase.execute({
        id: flashcard.id.toString(),
        filters: {
          includeTags: false,
          includeInteractionStats: false,
          includeRelatedFlashcards: false,
        },
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcard.tags).toBeUndefined();
      }
    });

    it('should handle very long content in flashcard', async () => {
      // Arrange
      const longContent = 'a'.repeat(1000);
      const flashcard = Flashcard.create({
        slug: 'long-content-flashcard',
        question: FlashcardContentVO.createText(longContent),
        answer: FlashcardContentVO.createText(longContent),
        argumentId: new UniqueEntityID('argument-id'),
        tagIds: [],
      });
      await flashcardRepository.create(flashcard);

      // Act
      const result = await useCase.execute({
        id: flashcard.id.toString(),
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.flashcard.question.content).toBe(longContent);
        expect(result.value.flashcard.answer.content).toBe(longContent);
      }
    });
  });
});