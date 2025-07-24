// src/domain/flashcard/application/use-cases/create-flashcard.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { left } from '@/core/either';
import { CreateFlashcardUseCase } from './create-flashcard.use-case';
import { InMemoryFlashcardRepository } from '@/test/repositories/in-memory-flashcard-repository';
import { InMemoryFlashcardTagRepository } from '@/test/repositories/in-memory-flashcard-tag-repository';
import { InMemoryArgumentRepository } from '@/test/repositories/in-memory-argument-repository';
import { InvalidInputError } from './errors/invalid-input-error';
import { ArgumentNotFoundError } from './errors/argument-not-found-error';
import { FlashcardTagsNotFoundError } from './errors/flashcard-tags-not-found-error';
import { DuplicateFlashcardError } from './errors/duplicate-flashcard-error';
import { RepositoryError } from './errors/repository-error';
import { CreateFlashcardRequestDto } from '../dtos/create-flashcard-request.dto';

import { Argument } from '@/domain/assessment/enterprise/entities/argument.entity';
import { FlashcardTag } from '../../enterprise/entities/flashcard-tag.entity';
import { Flashcard } from '../../enterprise/entities/flashcard.entity';
import { FlashcardContentVO } from '../../enterprise/value-objects/flashcard-content.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';

describe('CreateFlashcardUseCase', () => {
  let useCase: CreateFlashcardUseCase;
  let flashcardRepository: InMemoryFlashcardRepository;
  let flashcardTagRepository: InMemoryFlashcardTagRepository;
  let argumentRepository: InMemoryArgumentRepository;

  beforeEach(() => {
    flashcardRepository = new InMemoryFlashcardRepository();
    flashcardTagRepository = new InMemoryFlashcardTagRepository();
    argumentRepository = new InMemoryArgumentRepository();
    useCase = new CreateFlashcardUseCase(
      flashcardRepository,
      flashcardTagRepository,
      argumentRepository,
    );
  });

  describe('Success scenarios', () => {
    it('should create a flashcard with text content successfully', async () => {
      // Arrange
      const argument = Argument.create({
        title: 'Test Argument',
        assessmentId: new UniqueEntityID('assessment-1'),
      });
      await argumentRepository.create(argument);

      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'What is the capital of Brazil?',
        },
        answer: {
          type: 'TEXT',
          content: 'Brasília',
        },
        argumentId: argument.id.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      expect(result.value).toEqual({
        flashcard: {
          id: expect.any(String),
          slug: expect.any(String),
          question: {
            type: 'TEXT',
            content: 'What is the capital of Brazil?',
          },
          answer: {
            type: 'TEXT',
            content: 'Brasília',
          },
          argumentId: argument.id.toString(),
          tagIds: [],
          importBatchId: undefined,
          exportedAt: undefined,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should create a flashcard with image content successfully', async () => {
      // Arrange
      const argument = Argument.create({
        title: 'Test Argument',
        assessmentId: new UniqueEntityID('assessment-1'),
      });
      await argumentRepository.create(argument);

      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'IMAGE',
          content: 'https://example.com/question.jpg',
        },
        answer: {
          type: 'IMAGE',
          content: 'https://example.com/answer.jpg',
        },
        argumentId: argument.id.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      expect(result.value).toEqual({
        flashcard: expect.objectContaining({
          question: {
            type: 'IMAGE',
            content: 'https://example.com/question.jpg',
          },
          answer: {
            type: 'IMAGE',
            content: 'https://example.com/answer.jpg',
          },
        }),
      });
    });

    it('should create a flashcard with mixed content types (IMAGE/TEXT) successfully', async () => {
      // Arrange
      const argument = Argument.create({
        title: 'Test Argument',
        assessmentId: new UniqueEntityID('assessment-1'),
      });
      await argumentRepository.create(argument);

      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'IMAGE',
          content: 'https://example.com/question.jpg',
        },
        answer: {
          type: 'TEXT',
          content: 'This is a text answer',
        },
        argumentId: argument.id.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      expect(result.value).toEqual({
        flashcard: expect.objectContaining({
          question: {
            type: 'IMAGE',
            content: 'https://example.com/question.jpg',
          },
          answer: {
            type: 'TEXT',
            content: 'This is a text answer',
          },
        }),
      });
    });

    it('should create a flashcard with mixed content types (TEXT/IMAGE) successfully', async () => {
      // Arrange
      const argument = Argument.create({
        title: 'Test Argument',
        assessmentId: new UniqueEntityID('assessment-1'),
      });
      await argumentRepository.create(argument);

      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'What organ is shown in the image?',
        },
        answer: {
          type: 'IMAGE',
          content: 'https://example.com/heart-diagram.jpg',
        },
        argumentId: argument.id.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      expect(result.value).toEqual({
        flashcard: expect.objectContaining({
          question: {
            type: 'TEXT',
            content: 'What organ is shown in the image?',
          },
          answer: {
            type: 'IMAGE',
            content: 'https://example.com/heart-diagram.jpg',
          },
        }),
      });
    });

    it('should create a flashcard with tags successfully', async () => {
      // Arrange
      const argument = Argument.create({
        title: 'Test Argument',
        assessmentId: new UniqueEntityID('assessment-1'),
      });
      await argumentRepository.create(argument);

      const tag1 = FlashcardTag.create({ name: 'Anatomy' });
      const tag2 = FlashcardTag.create({ name: 'Physiology' });
      await flashcardTagRepository.create(tag1);
      await flashcardTagRepository.create(tag2);

      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'What is the function of the heart?',
        },
        answer: {
          type: 'TEXT',
          content: 'Pumping blood throughout the body',
        },
        argumentId: argument.id.toString(),
        tagIds: [tag1.id.toString(), tag2.id.toString()],
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      expect(result.value).toEqual({
        flashcard: expect.objectContaining({
          tagIds: expect.arrayContaining([
            tag1.id.toString(),
            tag2.id.toString(),
          ]),
        }),
      });
    });

    it('should create a flashcard with custom slug successfully', async () => {
      // Arrange
      const argument = Argument.create({
        title: 'Test Argument',
        assessmentId: new UniqueEntityID('assessment-1'),
      });
      await argumentRepository.create(argument);

      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'What is the capital of Brazil?',
        },
        answer: {
          type: 'TEXT',
          content: 'Brasília',
        },
        argumentId: argument.id.toString(),
        slug: 'brazil-capital',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      expect(result.value).toEqual({
        flashcard: expect.objectContaining({
          slug: 'brazil-capital',
        }),
      });
    });

    it('should create a flashcard with import batch ID successfully', async () => {
      // Arrange
      const argument = Argument.create({
        title: 'Test Argument',
        assessmentId: new UniqueEntityID('assessment-1'),
      });
      await argumentRepository.create(argument);

      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'What is the capital of Brazil?',
        },
        answer: {
          type: 'TEXT',
          content: 'Brasília',
        },
        argumentId: argument.id.toString(),
        importBatchId: 'batch-123',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      expect(result.value).toEqual({
        flashcard: expect.objectContaining({
          importBatchId: 'batch-123',
        }),
      });
    });
  });

  describe('Input validation errors', () => {
    it('should return InvalidInputError when question type is invalid', async () => {
      // Arrange
      const request: any = {
        question: {
          type: 'INVALID_TYPE',
          content: 'Test question',
        },
        answer: {
          type: 'TEXT',
          content: 'Test answer',
        },
        argumentId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
      if (result.value instanceof InvalidInputError) {
        expect(result.value.details).toHaveProperty('question');
        expect(Array.isArray(result.value.details.question)).toBe(true);
        expect(result.value.details.question[0]).toContain(
          'Content type must be either TEXT or IMAGE',
        );
      }
    });

    it('should return InvalidInputError when question content is empty', async () => {
      // Arrange
      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: '',
        },
        answer: {
          type: 'TEXT',
          content: 'Test answer',
        },
        argumentId: 'valid-uuid-v4',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
      if (result.value instanceof InvalidInputError) {
        expect(result.value.details).toHaveProperty('question.content');
      }
    });

    it('should return InvalidInputError when question content exceeds 1000 characters', async () => {
      // Arrange
      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'a'.repeat(1001),
        },
        answer: {
          type: 'TEXT',
          content: 'Test answer',
        },
        argumentId: 'valid-uuid-v4',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
      if (result.value instanceof InvalidInputError) {
        expect(result.value.details).toHaveProperty('question.content');
      }
    });

    it('should return InvalidInputError when image URL is invalid', async () => {
      // Arrange
      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'IMAGE',
          content: 'invalid-url',
        },
        answer: {
          type: 'TEXT',
          content: 'Test answer',
        },
        argumentId: 'valid-uuid-v4',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
      if (result.value instanceof InvalidInputError) {
        expect(result.value.details).toHaveProperty('question.content');
      }
    });

    it('should return InvalidInputError when argumentId is not a valid UUID', async () => {
      // Arrange
      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'Test question',
        },
        answer: {
          type: 'TEXT',
          content: 'Test answer',
        },
        argumentId: 'invalid-uuid',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
      if (result.value instanceof InvalidInputError) {
        expect(result.value.details).toHaveProperty('argumentId');
      }
    });

    it('should return InvalidInputError when tagIds contain invalid UUIDs', async () => {
      // Arrange
      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'Test question',
        },
        answer: {
          type: 'TEXT',
          content: 'Test answer',
        },
        argumentId: 'valid-uuid-v4',
        tagIds: ['invalid-uuid'],
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
      if (result.value instanceof InvalidInputError) {
        expect(result.value.details).toHaveProperty('tagIds.0');
      }
    });

    it('should return InvalidInputError when tagIds contain duplicates', async () => {
      // Arrange
      const duplicateId = '550e8400-e29b-41d4-a716-446655440000';
      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'Test question',
        },
        answer: {
          type: 'TEXT',
          content: 'Test answer',
        },
        argumentId: 'valid-uuid-v4',
        tagIds: [duplicateId, duplicateId],
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
      if (result.value instanceof InvalidInputError) {
        expect(result.value.details).toHaveProperty('tagIds');
      }
    });

    it('should return InvalidInputError when slug format is invalid', async () => {
      // Arrange
      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'Test question',
        },
        answer: {
          type: 'TEXT',
          content: 'Test answer',
        },
        argumentId: 'valid-uuid-v4',
        slug: 'Invalid Slug!',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
      if (result.value instanceof InvalidInputError) {
        expect(result.value.details).toHaveProperty('slug');
      }
    });

    it('should return InvalidInputError when question and answer are identical', async () => {
      // Arrange
      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'Same content',
        },
        answer: {
          type: 'TEXT',
          content: 'Same content',
        },
        argumentId: 'valid-uuid-v4',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
      if (result.value instanceof InvalidInputError) {
        expect(result.value.details).toHaveProperty('answer');
      }
    });
  });

  describe('Business rule errors', () => {
    it('should return ArgumentNotFoundError when argument does not exist', async () => {
      // Arrange
      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'Test question',
        },
        answer: {
          type: 'TEXT',
          content: 'Test answer',
        },
        argumentId: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ArgumentNotFoundError);
      if (result.value instanceof ArgumentNotFoundError) {
        expect(result.value.message).toContain(
          '550e8400-e29b-41d4-a716-446655440000',
        );
      }
    });

    it('should return FlashcardTagsNotFoundError when some tags do not exist', async () => {
      // Arrange
      const argument = Argument.create({
        title: 'Test Argument',
        assessmentId: new UniqueEntityID('assessment-1'),
      });
      await argumentRepository.create(argument);

      const existingTag = FlashcardTag.create({ name: 'Existing Tag' });
      await flashcardTagRepository.create(existingTag);

      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'Test question',
        },
        answer: {
          type: 'TEXT',
          content: 'Test answer',
        },
        argumentId: argument.id.toString(),
        tagIds: [
          existingTag.id.toString(),
          '550e8400-e29b-41d4-a716-446655440000', // Non-existent tag
        ],
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(FlashcardTagsNotFoundError);
      if (result.value instanceof FlashcardTagsNotFoundError) {
        expect(result.value.message).toContain(
          '550e8400-e29b-41d4-a716-446655440000',
        );
      }
    });

    it('should return DuplicateFlashcardError when slug already exists', async () => {
      // Arrange
      const argument = Argument.create({
        title: 'Test Argument',
        assessmentId: new UniqueEntityID('assessment-1'),
      });
      await argumentRepository.create(argument);

      const existingFlashcard = Flashcard.create({
        question: FlashcardContentVO.createText('Existing question'),
        answer: FlashcardContentVO.createText('Existing answer'),
        argumentId: argument.id,
        tagIds: [],
        slug: 'existing-slug',
      });
      await flashcardRepository.create(existingFlashcard);

      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'New question',
        },
        answer: {
          type: 'TEXT',
          content: 'New answer',
        },
        argumentId: argument.id.toString(),
        slug: 'existing-slug',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(DuplicateFlashcardError);
      if (result.value instanceof DuplicateFlashcardError) {
        expect(result.value.message).toContain('existing-slug');
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle empty tagIds array', async () => {
      // Arrange
      const argument = Argument.create({
        title: 'Test Argument',
        assessmentId: new UniqueEntityID('assessment-1'),
      });
      await argumentRepository.create(argument);

      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'Test question',
        },
        answer: {
          type: 'TEXT',
          content: 'Test answer',
        },
        argumentId: argument.id.toString(),
        tagIds: [],
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      expect(result.value).toEqual({
        flashcard: expect.objectContaining({
          tagIds: [],
        }),
      });
    });

    it('should handle maximum length content', async () => {
      // Arrange
      const argument = Argument.create({
        title: 'Test Argument',
        assessmentId: new UniqueEntityID('assessment-1'),
      });
      await argumentRepository.create(argument);

      const maxLengthContent = 'a'.repeat(1000);
      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: maxLengthContent,
        },
        answer: {
          type: 'TEXT',
          content: 'Different answer',
        },
        argumentId: argument.id.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      expect(result.value).toEqual({
        flashcard: expect.objectContaining({
          question: {
            type: 'TEXT',
            content: maxLengthContent,
          },
        }),
      });
    });

    it('should handle HTTPS image URLs', async () => {
      // Arrange
      const argument = Argument.create({
        title: 'Test Argument',
        assessmentId: new UniqueEntityID('assessment-1'),
      });
      await argumentRepository.create(argument);

      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'IMAGE',
          content: 'https://secure.example.com/image.jpg',
        },
        answer: {
          type: 'TEXT',
          content: 'Test answer',
        },
        argumentId: argument.id.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      expect(result.value).toEqual({
        flashcard: expect.objectContaining({
          question: {
            type: 'IMAGE',
            content: 'https://secure.example.com/image.jpg',
          },
        }),
      });
    });
  });

  describe('Repository error handling', () => {
    it('should return RepositoryError when flashcard repository fails', async () => {
      // Arrange
      const argument = Argument.create({
        title: 'Test Argument',
        assessmentId: new UniqueEntityID('assessment-1'),
      });
      await argumentRepository.create(argument);

      // Mock repository error
      vi.spyOn(flashcardRepository, 'create').mockResolvedValue(
        left(new Error('Database connection failed')),
      );

      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'Test question',
        },
        answer: {
          type: 'TEXT',
          content: 'Test answer',
        },
        argumentId: argument.id.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.value instanceof RepositoryError) {
        expect(result.value.message).toBe('Database connection failed');
      }
    });

    it('should return RepositoryError when tag repository fails', async () => {
      // Arrange
      const argument = Argument.create({
        title: 'Test Argument',
        assessmentId: new UniqueEntityID('assessment-1'),
      });
      await argumentRepository.create(argument);

      // Mock repository error
      vi.spyOn(flashcardTagRepository, 'findByIds').mockResolvedValue(
        left(new Error('Database connection failed')),
      );

      const request: CreateFlashcardRequestDto = {
        question: {
          type: 'TEXT',
          content: 'Test question',
        },
        answer: {
          type: 'TEXT',
          content: 'Test answer',
        },
        argumentId: argument.id.toString(),
        tagIds: ['550e8400-e29b-41d4-a716-446655440000'],
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.value instanceof RepositoryError) {
        expect(result.value.message).toBe('Database connection failed');
      }
    });
  });
});
