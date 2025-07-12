// src/domain/assessment/application/use-cases/get-question.use-case.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GetQuestionUseCase } from './get-question.use-case';
import { InMemoryQuestionRepository } from '@/test/repositories/in-memory-question-repository';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { QuestionTypeVO } from '@/domain/assessment/enterprise/value-objects/question-type.vo';
import { InvalidInputError } from './errors/invalid-input-error';
import { QuestionNotFoundError } from './errors/question-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { GetQuestionRequest } from '../dtos/get-question-request.dto';

describe('GetQuestionUseCase', () => {
  let useCase: GetQuestionUseCase;
  let questionRepository: InMemoryQuestionRepository;

  beforeEach(() => {
    questionRepository = new InMemoryQuestionRepository();
    useCase = new GetQuestionUseCase(questionRepository);
  });

  const createTestQuestion = (overrides: Partial<any> = {}) => {
    const text = overrides.text || 'What is the capital of Brazil?';
    const type = overrides.type || 'MULTIPLE_CHOICE';
    const assessmentId =
      overrides.assessmentId || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const now = new Date();

    // Use reconstruct to bypass validation for test purposes
    const question = Question.reconstruct(
      {
        text,
        type: new QuestionTypeVO(type),
        assessmentId: new UniqueEntityID(assessmentId),
        argumentId: overrides.argumentId
          ? new UniqueEntityID(overrides.argumentId)
          : undefined,
        createdAt: overrides.createdAt || now,
        updatedAt: overrides.updatedAt || now,
      },
      overrides.id ? new UniqueEntityID(overrides.id) : new UniqueEntityID(),
    );

    return question;
  };

  describe('✅ Success Cases', () => {
    it('should return question when found with complete data', async () => {
      const questionId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const assessmentId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const argumentId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

      const question = createTestQuestion({
        id: questionId,
        text: 'What is the mechanism of action of ACE inhibitors?',
        type: 'MULTIPLE_CHOICE',
        assessmentId,
        argumentId,
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question).toEqual({
          id: questionId,
          text: 'What is the mechanism of action of ACE inhibitors?',
          type: 'MULTIPLE_CHOICE',
          assessmentId,
          argumentId,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      }
    });

    it('should return question without argument association', async () => {
      const questionId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
      const assessmentId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

      const question = createTestQuestion({
        id: questionId,
        text: 'What is the capital of France?',
        type: 'MULTIPLE_CHOICE',
        assessmentId,
        argumentId: undefined,
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question).toEqual({
          id: questionId,
          text: 'What is the capital of France?',
          type: 'MULTIPLE_CHOICE',
          assessmentId,
          argumentId: undefined,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      }
    });

    it('should return open type question', async () => {
      const questionId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const assessmentId = 'gggggggg-gggg-gggg-gggg-gggggggggggg';

      const question = createTestQuestion({
        id: questionId,
        text: 'Explain the pathophysiology of hypertension and discuss treatment options.',
        type: 'OPEN',
        assessmentId,
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.type).toBe('OPEN');
        expect(result.value.question.text).toBe(
          'Explain the pathophysiology of hypertension and discuss treatment options.',
        );
      }
    });

    it('should return question with special characters in text', async () => {
      const questionId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      const assessmentId = 'ffffffff-aaaa-bbbb-cccc-dddddddddddd';

      const question = createTestQuestion({
        id: questionId,
        text: 'Qual é o mecanismo de ação dos inibidores da ECA? (@ # $ % & *)',
        type: 'MULTIPLE_CHOICE',
        assessmentId,
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.text).toBe(
          'Qual é o mecanismo de ação dos inibidores da ECA? (@ # $ % & *)',
        );
      }
    });

    it('should return question with minimum text length', async () => {
      const questionId = 'abcdabcd-abcd-abcd-abcd-abcdabcdabcd';
      const assessmentId = 'efefefef-efef-efef-efef-efefefefefef';

      const question = createTestQuestion({
        id: questionId,
        text: '1234567890', // exactly 10 characters
        type: 'MULTIPLE_CHOICE',
        assessmentId,
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.text).toBe('1234567890');
        expect(result.value.question.text.length).toBe(10);
      }
    });

    it('should return question with maximum text length', async () => {
      const questionId = 'fedcfcdc-fedc-fedc-fedc-fedcfedcfedc';
      const assessmentId = 'abcdefab-cdef-abcd-efab-cdefabcdefab';
      const longText = 'A'.repeat(1000);

      const question = createTestQuestion({
        id: questionId,
        text: longText,
        type: 'OPEN',
        assessmentId,
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.text).toBe(longText);
        expect(result.value.question.text.length).toBe(1000);
      }
    });

    it('should return question with unicode characters', async () => {
      const questionId = '11111111-1111-1111-1111-111111111111';
      const assessmentId = '22222222-2222-2222-2222-222222222222';
      const unicodeText = 'Questão 中文 العربية русский 🎯';

      const question = createTestQuestion({
        id: questionId,
        text: unicodeText,
        type: 'OPEN',
        assessmentId,
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.text).toBe(unicodeText);
      }
    });
  });

  describe('⚠️ Validation Errors', () => {
    it('should return InvalidInputError for invalid UUID format', async () => {
      const request: GetQuestionRequest = { id: 'invalid-uuid' };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Validation failed');
        expect((result.value as InvalidInputError).details[0]).toContain(
          'ID must be a valid UUID',
        );
      }
    });

    it('should return InvalidInputError for empty string ID', async () => {
      const request: GetQuestionRequest = { id: '' };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect((result.value as InvalidInputError).details[0]).toContain(
          'ID cannot be empty',
        );
      }
    });

    it('should return InvalidInputError for null ID', async () => {
      const request = { id: null } as any;
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for undefined ID', async () => {
      const request = { id: undefined } as any;
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for missing ID field', async () => {
      const request = {} as any;
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for extra fields', async () => {
      const request = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        extraField: 'not allowed',
      } as any;
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for non-string ID', async () => {
      const request = { id: 123 } as any;
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for null request', async () => {
      const result = await useCase.execute(null as any);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Invalid request format');
        expect((result.value as InvalidInputError).details).toEqual([
          'Request must be a valid object',
        ]);
      }
    });

    it('should return InvalidInputError for undefined request', async () => {
      const result = await useCase.execute(undefined as any);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Invalid request format');
      }
    });

    it('should return InvalidInputError for primitive request', async () => {
      const result = await useCase.execute('string' as any);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Invalid request format');
      }
    });

    it('should return InvalidInputError for array request', async () => {
      const result = await useCase.execute([
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      ] as any);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Invalid request format');
      }
    });

    it('should handle whitespace in UUID by trimming', async () => {
      const questionId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const question = createTestQuestion({ id: questionId });
      await questionRepository.create(question);

      const request: GetQuestionRequest = {
        id: '  aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa  ',
      };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.id).toBe(questionId);
      }
    });

    it('should return InvalidInputError for UUID with extra characters', async () => {
      const request: GetQuestionRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa-extra',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        const details = (result.value as InvalidInputError).details[0];
        expect(details).toMatch(
          /ID must be exactly 36 characters long|ID must be a valid UUID/,
        );
      }
    });

    it('should return InvalidInputError for UUID with special characters', async () => {
      const request: GetQuestionRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa@',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for UUID with wrong hyphen placement', async () => {
      const request: GetQuestionRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa-a',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for UUID with missing hyphens', async () => {
      const request: GetQuestionRequest = {
        id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });

  describe('🔍 Business Logic Errors', () => {
    it('should return QuestionNotFoundError when question does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const request: GetQuestionRequest = { id: nonExistentId };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(QuestionNotFoundError);
        expect(result.value.message).toBe('Question not found');
      }
    });

    it('should return QuestionNotFoundError for deleted question', async () => {
      const questionId = '11111111-1111-1111-1111-111111111111';

      const question = createTestQuestion({
        id: questionId,
        text: 'Question to be deleted',
      });

      await questionRepository.create(question);
      await questionRepository.delete(questionId);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(QuestionNotFoundError);
      }
    });

    it('should handle repository returning left error correctly', async () => {
      // Mock repository to return left error
      const originalFindById = questionRepository.findById;
      questionRepository.findById = async () => {
        return { isLeft: () => true, isRight: () => false } as any;
      };

      const request: GetQuestionRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(QuestionNotFoundError);
      }

      // Restore original method
      questionRepository.findById = originalFindById;
    });
  });

  describe('💥 Repository Errors', () => {
    it('should return RepositoryError when repository throws exception', async () => {
      // Mock repository to throw an error
      questionRepository.findById = async () => {
        throw new Error('Database connection failed');
      };

      const request: GetQuestionRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Database connection failed');
      }
    });

    it('should return RepositoryError with generic message on unknown error', async () => {
      // Mock repository to throw an error without message
      questionRepository.findById = async () => {
        throw new Error();
      };

      const request: GetQuestionRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
      }
    });

    it('should handle TimeoutError from repository', async () => {
      questionRepository.findById = async () => {
        const error = new Error('Operation timed out');
        error.name = 'TimeoutError';
        throw error;
      };

      const request: GetQuestionRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Database operation timed out');
      }
    });

    it('should handle ConnectionError from repository', async () => {
      questionRepository.findById = async () => {
        const error = new Error('Connection failed');
        error.name = 'ConnectionError';
        throw error;
      };

      const request: GetQuestionRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Database connection failed');
      }
    });

    it('should handle ECONNREFUSED error from repository', async () => {
      questionRepository.findById = async () => {
        const error = new Error('Connection refused');
        (error as any).code = 'ECONNREFUSED';
        throw error;
      };

      const request: GetQuestionRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Unable to connect to database');
      }
    });

    it('should handle ENOTFOUND error from repository', async () => {
      questionRepository.findById = async () => {
        const error = new Error('Host not found');
        (error as any).code = 'ENOTFOUND';
        throw error;
      };

      const request: GetQuestionRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Database host not found');
      }
    });

    it('should handle corrupted question data from repository', async () => {
      const originalFindById = questionRepository.findById;
      questionRepository.findById = async () => {
        return {
          isLeft: () => false,
          isRight: () => true,
          value: null, // Corrupted data
        } as any;
      };

      const request: GetQuestionRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe(
          'Invalid question data retrieved from repository',
        );
      }

      questionRepository.findById = originalFindById;
    });

    it('should handle question with missing ID from repository', async () => {
      const originalFindById = questionRepository.findById;
      questionRepository.findById = async () => {
        return {
          isLeft: () => false,
          isRight: () => true,
          value: {
            text: 'Test Question',
            type: new QuestionTypeVO('MULTIPLE_CHOICE'),
            // Missing id field
            assessmentId: new UniqueEntityID(
              'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            ),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        } as any;
      };

      const request: GetQuestionRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe(
          'Invalid question data retrieved from repository',
        );
      }

      questionRepository.findById = originalFindById;
    });

    it('should handle question with missing text from repository', async () => {
      const originalFindById = questionRepository.findById;
      questionRepository.findById = async () => {
        return {
          isLeft: () => false,
          isRight: () => true,
          value: {
            id: { toString: () => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
            // Missing text field
            type: new QuestionTypeVO('MULTIPLE_CHOICE'),
            assessmentId: new UniqueEntityID(
              'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            ),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        } as any;
      };

      const request: GetQuestionRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe(
          'Invalid question data retrieved from repository',
        );
      }

      questionRepository.findById = originalFindById;
    });

    it('should handle question with missing type from repository', async () => {
      const originalFindById = questionRepository.findById;
      questionRepository.findById = async () => {
        return {
          isLeft: () => false,
          isRight: () => true,
          value: {
            id: { toString: () => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
            text: 'Test Question',
            // Missing type field
            assessmentId: new UniqueEntityID(
              'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            ),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        } as any;
      };

      const request: GetQuestionRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe(
          'Invalid question data retrieved from repository',
        );
      }

      questionRepository.findById = originalFindById;
    });
  });

  describe('🔧 Edge Cases', () => {
    it('should handle UUID with different casing', async () => {
      const questionId = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA';

      const question = createTestQuestion({
        id: questionId.toLowerCase(),
        text: 'Case Test Question',
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(QuestionNotFoundError);
      }
    });

    it('should handle very long question text', async () => {
      const questionId = '22222222-2222-2222-2222-222222222222';
      const longText = 'A'.repeat(2000);

      const question = createTestQuestion({
        id: questionId,
        text: longText,
        type: 'OPEN',
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.text).toBe(longText);
        expect(result.value.question.text.length).toBe(2000);
      }
    });

    it('should handle question with text containing only whitespace', async () => {
      const questionId = '33333333-3333-3333-3333-333333333333';
      const whitespaceText = '   \t\n   What is this?   ';

      const question = createTestQuestion({
        id: questionId,
        text: whitespaceText,
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.text).toBe(whitespaceText);
      }
    });

    it('should handle question with text containing control characters', async () => {
      const questionId = '44444444-4444-4444-4444-444444444444';
      const controlCharText = 'Question with \n\r\t control chars';

      const question = createTestQuestion({
        id: questionId,
        text: controlCharText,
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.text).toBe(controlCharText);
      }
    });

    it('should handle question with text containing complex emoji sequences', async () => {
      const questionId = '55555555-5555-5555-5555-555555555555';
      const emojiText = 'Question with 👨‍💻👩‍🎓🏳️‍🌈 complex emojis';

      const question = createTestQuestion({
        id: questionId,
        text: emojiText,
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.text).toBe(emojiText);
      }
    });

    it('should handle question with extreme future date', async () => {
      const questionId = '77777777-7777-7777-7777-777777777777';
      const futureDate = new Date('2099-12-31T23:59:59Z');

      const question = createTestQuestion({
        id: questionId,
        text: 'Future Question',
        createdAt: futureDate,
        updatedAt: futureDate,
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.createdAt).toEqual(futureDate);
        expect(result.value.question.updatedAt).toEqual(futureDate);
      }
    });

    it('should handle question with extreme past date', async () => {
      const questionId = '88888888-8888-8888-8888-888888888888';
      const pastDate = new Date('1900-01-01T00:00:00Z');

      const question = createTestQuestion({
        id: questionId,
        text: 'Past Question',
        createdAt: pastDate,
        updatedAt: pastDate,
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.createdAt).toEqual(pastDate);
        expect(result.value.question.updatedAt).toEqual(pastDate);
      }
    });

    it('should handle concurrent access to same question', async () => {
      const questionId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const question = createTestQuestion({
        id: questionId,
        text: 'Concurrent Test Question',
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };

      // Simulate concurrent access
      const promises = Array(10)
        .fill(0)
        .map(() => useCase.execute(request));
      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value.question.id).toBe(questionId);
          expect(result.value.question.text).toBe('Concurrent Test Question');
        }
      });
    });
  });

  describe('📊 Data Integrity', () => {
    it('should preserve all question data fields accurately', async () => {
      const questionId = '33333333-3333-3333-3333-333333333333';
      const assessmentId = '44444444-4444-4444-4444-444444444444';
      const argumentId = '55555555-5555-5555-5555-555555555555';
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const updatedAt = new Date('2024-01-02T15:30:00Z');

      const question = createTestQuestion({
        id: questionId,
        text: 'Data Integrity Test Question',
        type: 'MULTIPLE_CHOICE',
        assessmentId,
        argumentId,
        createdAt,
        updatedAt,
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const returnedQuestion = result.value.question;
        expect(returnedQuestion.id).toBe(questionId);
        expect(returnedQuestion.text).toBe('Data Integrity Test Question');
        expect(returnedQuestion.type).toBe('MULTIPLE_CHOICE');
        expect(returnedQuestion.assessmentId).toBe(assessmentId);
        expect(returnedQuestion.argumentId).toBe(argumentId);
        expect(returnedQuestion.createdAt).toEqual(createdAt);
        expect(returnedQuestion.updatedAt).toEqual(updatedAt);
      }
    });

    it('should maintain consistency across multiple retrievals', async () => {
      const questionId = '55555555-5555-5555-5555-555555555555';

      const question = createTestQuestion({
        id: questionId,
        text: 'Consistency Test Question',
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };

      // Call multiple times
      const results = await Promise.all([
        useCase.execute(request),
        useCase.execute(request),
        useCase.execute(request),
      ]);

      results.forEach((result) => {
        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value.question.id).toBe(questionId);
          expect(result.value.question.text).toBe('Consistency Test Question');
        }
      });

      // Ensure all results are identical
      if (results.every((r) => r.isRight())) {
        const [first, second, third] = results.map(
          (r) => (r as any).value.question,
        );
        expect(first).toEqual(second);
        expect(second).toEqual(third);
      }
    });

    it('should return immutable response objects', async () => {
      const questionId = '66666666-6666-6666-6666-666666666666';
      const question = createTestQuestion({
        id: questionId,
        text: 'Immutable Test Question',
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;
        const originalText = response.question.text;

        // Try to modify the response
        (response.question as any).text = 'Modified Text';

        // Execute again and verify original data is unchanged
        const secondResult = await useCase.execute(request);
        expect(secondResult.isRight()).toBe(true);
        if (secondResult.isRight()) {
          expect(secondResult.value.question.text).toBe(originalText);
        }
      }
    });

    it('should handle date objects correctly and create new instances', async () => {
      const questionId = '77777777-7777-7777-7777-777777777777';
      const originalDate = new Date('2024-01-01T10:00:00Z');

      const question = createTestQuestion({
        id: questionId,
        text: 'Date Test Question',
        createdAt: originalDate,
        updatedAt: originalDate,
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;

        // Verify dates are correct
        expect(response.question.createdAt).toEqual(originalDate);
        expect(response.question.updatedAt).toEqual(originalDate);

        // Verify they are new Date instances (not references)
        expect(response.question.createdAt).not.toBe(originalDate);
        expect(response.question.updatedAt).not.toBe(originalDate);

        // Verify they are actual Date objects
        expect(response.question.createdAt).toBeInstanceOf(Date);
        expect(response.question.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should handle null/undefined argumentId correctly', async () => {
      const questionId = '88888888-8888-8888-8888-888888888888';
      const question = createTestQuestion({
        id: questionId,
        text: 'No Argument Question',
        argumentId: undefined,
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.argumentId).toBeUndefined();
      }
    });

    it('should preserve question field types accurately', async () => {
      const questionId = '99999999-9999-9999-9999-999999999999';
      const assessmentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const argumentId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const updatedAt = new Date('2024-01-02T15:30:00Z');

      const question = createTestQuestion({
        id: questionId,
        text: 'Type Test Question',
        type: 'OPEN',
        assessmentId,
        argumentId,
        createdAt,
        updatedAt,
      });

      await questionRepository.create(question);

      const request: GetQuestionRequest = { id: questionId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value.question;

        // Verify field types
        expect(typeof response.id).toBe('string');
        expect(typeof response.text).toBe('string');
        expect(typeof response.type).toBe('string');
        expect(typeof response.assessmentId).toBe('string');
        expect(typeof response.argumentId).toBe('string');
        expect(response.createdAt).toBeInstanceOf(Date);
        expect(response.updatedAt).toBeInstanceOf(Date);
      }
    });
  });
});
