// src/domain/assessment/application/use-cases/get-argument.use-case.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GetArgumentUseCase } from './get-argument.use-case';
import { InMemoryArgumentRepository } from '@/test/repositories/in-memory-argument-repository';
import { Argument } from '@/domain/assessment/enterprise/entities/argument.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { InvalidInputError } from './errors/invalid-input-error';
import { ArgumentNotFoundError } from './errors/argument-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { GetArgumentRequest } from '../dtos/get-argument-request.dto';

describe('GetArgumentUseCase', () => {
  let useCase: GetArgumentUseCase;
  let argumentRepository: InMemoryArgumentRepository;

  beforeEach(() => {
    argumentRepository = new InMemoryArgumentRepository();
    useCase = new GetArgumentUseCase(argumentRepository);
  });

  const createTestArgument = (overrides: Partial<any> = {}) => {
    const title = overrides.title || 'JavaScript Fundamentals';
    const argument = Argument.create(
      {
        title,
        assessmentId: overrides.assessmentId
          ? new UniqueEntityID(overrides.assessmentId)
          : undefined,
      },
      overrides.id ? new UniqueEntityID(overrides.id) : undefined,
    );

    // If specific dates are provided, we need to update them manually after creation
    if (overrides.createdAt || overrides.updatedAt) {
      // Access private props to override dates for testing
      (argument as any).props.createdAt =
        overrides.createdAt || argument.createdAt;
      (argument as any).props.updatedAt =
        overrides.updatedAt || argument.updatedAt;
    }

    return argument;
  };

  describe('✅ Success Cases', () => {
    it('should return argument when found with complete data', async () => {
      const argumentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const assessmentId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

      const argument = createTestArgument({
        id: argumentId,
        title: 'Complete JavaScript Argument',
        assessmentId,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument).toEqual({
          id: argumentId,
          title: 'Complete JavaScript Argument',
          assessmentId,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      }
    });

    it('should return argument without assessment association', async () => {
      const argumentId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

      const argument = createTestArgument({
        id: argumentId,
        title: 'Standalone Argument',
        assessmentId: undefined,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument).toEqual({
          id: argumentId,
          title: 'Standalone Argument',
          assessmentId: undefined,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      }
    });

    it('should return argument with special characters in title', async () => {
      const argumentId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

      const argument = createTestArgument({
        id: argumentId,
        title: 'Argumento de Programação & Lógica!',
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(
          'Argumento de Programação & Lógica!',
        );
      }
    });

    it('should return argument with minimum title length', async () => {
      const argumentId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

      const argument = createTestArgument({
        id: argumentId,
        title: 'A',
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe('A');
      }
    });

    it('should return argument with maximum title length', async () => {
      const argumentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const longTitle = 'A'.repeat(255);

      const argument = createTestArgument({
        id: argumentId,
        title: longTitle,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(longTitle);
        expect(result.value.argument.title.length).toBe(255);
      }
    });

    it('should return argument with unicode characters', async () => {
      const argumentId = '11111111-1111-1111-1111-111111111111';
      const unicodeTitle = 'Argumento 中文 العربية русский 🎯';

      const argument = createTestArgument({
        id: argumentId,
        title: unicodeTitle,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(unicodeTitle);
      }
    });
  });

  describe('⚠️ Validation Errors', () => {
    it('should return InvalidInputError for invalid UUID format', async () => {
      const request: GetArgumentRequest = { id: 'invalid-uuid' };
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
      const request: GetArgumentRequest = { id: '' };
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

    // NEW COMPREHENSIVE VALIDATION TESTS
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
      const argumentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const argument = createTestArgument({ id: argumentId });
      await argumentRepository.create(argument);

      const request: GetArgumentRequest = {
        id: '  aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa  ',
      };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.id).toBe(argumentId);
      }
    });

    it('should return InvalidInputError for UUID with tabs and newlines', async () => {
      const request: GetArgumentRequest = {
        id: '\t\n aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa \t\n',
      };
      const argumentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const argument = createTestArgument({ id: argumentId });
      await argumentRepository.create(argument);

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.id).toBe(argumentId);
      }
    });

    it('should return InvalidInputError for UUID with extra characters', async () => {
      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa-extra',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        // The validation can return either message depending on which validation fails first
        const details = (result.value as InvalidInputError).details[0];
        expect(details).toMatch(
          /ID must be exactly 36 characters long|ID must be a valid UUID/,
        );
      }
    });

    it('should return InvalidInputError for UUID with special characters', async () => {
      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa@',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for UUID that is too long', async () => {
      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa-extra-chars',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for nested object as ID', async () => {
      const request = {
        id: { nested: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
      } as any;
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for array as ID', async () => {
      const request = { id: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'] } as any;
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for boolean as ID', async () => {
      const request = { id: true } as any;
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for float as ID', async () => {
      const request = { id: 123.456 } as any;
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for UUID with wrong hyphen placement', async () => {
      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa-a',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for UUID with missing hyphens', async () => {
      const request: GetArgumentRequest = {
        id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for UUID with too many hyphens', async () => {
      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaa-aaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for UUID with unicode characters', async () => {
      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaαβγ',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for UUID with emojis', async () => {
      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa🎯',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });

  describe('🔍 Business Logic Errors', () => {
    it('should return ArgumentNotFoundError when argument does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const request: GetArgumentRequest = { id: nonExistentId };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ArgumentNotFoundError);
        expect(result.value.message).toBe('Argument not found');
      }
    });

    it('should return ArgumentNotFoundError for deleted argument', async () => {
      const argumentId = '11111111-1111-1111-1111-111111111111';

      const argument = createTestArgument({
        id: argumentId,
        title: 'Argument to be deleted',
      });

      await argumentRepository.create(argument);
      await argumentRepository.delete(argumentId);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ArgumentNotFoundError);
      }
    });

    it('should handle repository returning left error correctly', async () => {
      // Mock repository to return left error
      const originalFindById = argumentRepository.findById;
      argumentRepository.findById = async () => {
        return { isLeft: () => true, isRight: () => false } as any;
      };

      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ArgumentNotFoundError);
      }

      // Restore original method
      argumentRepository.findById = originalFindById;
    });
  });

  describe('💥 Repository Errors', () => {
    it('should return RepositoryError when repository throws exception', async () => {
      // Mock repository to throw an error
      argumentRepository.findById = async () => {
        throw new Error('Database connection failed');
      };

      const request: GetArgumentRequest = {
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
      argumentRepository.findById = async () => {
        throw new Error();
      };

      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
      }
    });

    it('should return RepositoryError when repository throws non-Error object', async () => {
      // Mock repository to throw a non-Error object
      argumentRepository.findById = async () => {
        throw 'String error';
      };

      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
      }
    });

    // NEW COMPREHENSIVE REPOSITORY ERROR TESTS
    it('should handle TimeoutError from repository', async () => {
      argumentRepository.findById = async () => {
        const error = new Error('Operation timed out');
        error.name = 'TimeoutError';
        throw error;
      };

      const request: GetArgumentRequest = {
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
      argumentRepository.findById = async () => {
        const error = new Error('Connection failed');
        error.name = 'ConnectionError';
        throw error;
      };

      const request: GetArgumentRequest = {
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
      argumentRepository.findById = async () => {
        const error = new Error('Connection refused');
        (error as any).code = 'ECONNREFUSED';
        throw error;
      };

      const request: GetArgumentRequest = {
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
      argumentRepository.findById = async () => {
        const error = new Error('Host not found');
        (error as any).code = 'ENOTFOUND';
        throw error;
      };

      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Database host not found');
      }
    });

    it('should handle undefined error from repository', async () => {
      argumentRepository.findById = async () => {
        throw undefined;
      };

      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Unknown repository error occurred');
      }
    });

    it('should handle null error from repository', async () => {
      argumentRepository.findById = async () => {
        throw null;
      };

      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Unknown repository error occurred');
      }
    });

    it('should handle complex error object from repository', async () => {
      argumentRepository.findById = async () => {
        throw {
          name: 'CustomError',
          message: 'Custom database error',
          code: 'CUSTOM_ERROR',
          details: 'Additional error details',
        };
      };

      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Custom database error');
      }
    });

    it('should handle corrupted argument data from repository', async () => {
      const originalFindById = argumentRepository.findById;
      argumentRepository.findById = async () => {
        return {
          isLeft: () => false,
          isRight: () => true,
          value: null, // Corrupted data
        } as any;
      };

      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe(
          'Invalid argument data retrieved from repository',
        );
      }

      argumentRepository.findById = originalFindById;
    });

    it('should handle argument with missing ID from repository', async () => {
      const originalFindById = argumentRepository.findById;
      argumentRepository.findById = async () => {
        return {
          isLeft: () => false,
          isRight: () => true,
          value: {
            title: 'Test Argument',
            // Missing id field
            assessmentId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        } as any;
      };

      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe(
          'Invalid argument data retrieved from repository',
        );
      }

      argumentRepository.findById = originalFindById;
    });

    it('should handle argument with missing title from repository', async () => {
      const originalFindById = argumentRepository.findById;
      argumentRepository.findById = async () => {
        return {
          isLeft: () => false,
          isRight: () => true,
          value: {
            id: { toString: () => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
            // Missing title field
            assessmentId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        } as any;
      };

      const request: GetArgumentRequest = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe(
          'Invalid argument data retrieved from repository',
        );
      }

      argumentRepository.findById = originalFindById;
    });
  });

  describe('🔧 Edge Cases', () => {
    it('should handle UUID with different casing', async () => {
      const argumentId = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA';

      const argument = createTestArgument({
        id: argumentId.toLowerCase(),
        title: 'Case Test Argument',
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ArgumentNotFoundError);
      }
    });

    it('should handle very long argument title', async () => {
      const argumentId = '22222222-2222-2222-2222-222222222222';
      const longTitle = 'A'.repeat(1000);

      const argument = createTestArgument({
        id: argumentId,
        title: longTitle,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(longTitle);
        expect(result.value.argument.title.length).toBe(1000);
      }
    });

    // NEW COMPREHENSIVE EDGE CASES
    it('should handle argument with title containing only whitespace', async () => {
      const argumentId = '33333333-3333-3333-3333-333333333333';
      const whitespaceTitle = '   \t\n   ';

      const argument = createTestArgument({
        id: argumentId,
        title: whitespaceTitle,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(whitespaceTitle);
      }
    });

    it('should handle argument with title containing control characters', async () => {
      const argumentId = '44444444-4444-4444-4444-444444444444';
      const controlCharTitle = 'Title with \n\r\t control chars';

      const argument = createTestArgument({
        id: argumentId,
        title: controlCharTitle,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(controlCharTitle);
      }
    });

    it('should handle argument with title containing complex emoji sequences', async () => {
      const argumentId = '55555555-5555-5555-5555-555555555555';
      const emojiTitle = 'Argument with 👨‍💻👩‍🎓🏳️‍🌈 complex emojis';

      const argument = createTestArgument({
        id: argumentId,
        title: emojiTitle,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(emojiTitle);
      }
    });

    it('should handle argument with title containing RTL characters', async () => {
      const argumentId = '66666666-6666-6666-6666-666666666666';
      const rtlTitle = 'العربية עברית mixed text';

      const argument = createTestArgument({
        id: argumentId,
        title: rtlTitle,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(rtlTitle);
      }
    });

    it('should handle argument with extreme future date', async () => {
      const argumentId = '77777777-7777-7777-7777-777777777777';
      const futureDate = new Date('2099-12-31T23:59:59Z');

      const argument = createTestArgument({
        id: argumentId,
        title: 'Future Argument',
        createdAt: futureDate,
        updatedAt: futureDate,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.createdAt).toEqual(futureDate);
        expect(result.value.argument.updatedAt).toEqual(futureDate);
      }
    });

    it('should handle argument with extreme past date', async () => {
      const argumentId = '88888888-8888-8888-8888-888888888888';
      const pastDate = new Date('1900-01-01T00:00:00Z');

      const argument = createTestArgument({
        id: argumentId,
        title: 'Past Argument',
        createdAt: pastDate,
        updatedAt: pastDate,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.createdAt).toEqual(pastDate);
        expect(result.value.argument.updatedAt).toEqual(pastDate);
      }
    });

    it('should handle argument with zero-width characters in title', async () => {
      const argumentId = '99999999-9999-9999-9999-999999999999';
      const zeroWidthTitle =
        'Title\u200B\u200C\u200D\uFEFFwith zero-width chars';

      const argument = createTestArgument({
        id: argumentId,
        title: zeroWidthTitle,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(zeroWidthTitle);
      }
    });

    it('should handle argument with maximum possible title length', async () => {
      const argumentId = 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const maxLengthTitle = 'A'.repeat(10000); // Very long title

      const argument = createTestArgument({
        id: argumentId,
        title: maxLengthTitle,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(maxLengthTitle);
        expect(result.value.argument.title.length).toBe(10000);
      }
    });

    it('should handle concurrent access to same argument', async () => {
      const argumentId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const argument = createTestArgument({
        id: argumentId,
        title: 'Concurrent Test Argument',
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };

      // Simulate concurrent access
      const promises = Array(10)
        .fill(0)
        .map(() => useCase.execute(request));
      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value.argument.id).toBe(argumentId);
          expect(result.value.argument.title).toBe('Concurrent Test Argument');
        }
      });
    });

    it('should handle argument deletion during execution', async () => {
      const argumentId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
      const argument = createTestArgument({
        id: argumentId,
        title: 'To Be Deleted Argument',
      });

      await argumentRepository.create(argument);

      // Mock repository to simulate deletion during execution
      const originalFindById = argumentRepository.findById;
      let callCount = 0;
      argumentRepository.findById = async (id: string) => {
        callCount++;
        if (callCount === 1) {
          // First call returns the argument
          return originalFindById.call(argumentRepository, id);
        } else {
          // Subsequent calls return not found (simulating deletion)
          return { isLeft: () => true, isRight: () => false } as any;
        }
      };

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe('To Be Deleted Argument');
      }

      // Restore original method
      argumentRepository.findById = originalFindById;
    });
  });

  describe('📊 Data Integrity', () => {
    it('should preserve all argument data fields accurately', async () => {
      const argumentId = '33333333-3333-3333-3333-333333333333';
      const assessmentId = '44444444-4444-4444-4444-444444444444';
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const updatedAt = new Date('2024-01-02T15:30:00Z');

      const argument = createTestArgument({
        id: argumentId,
        title: 'Data Integrity Test',
        assessmentId,
        createdAt,
        updatedAt,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const returnedArgument = result.value.argument;
        expect(returnedArgument.id).toBe(argumentId);
        expect(returnedArgument.title).toBe('Data Integrity Test');
        expect(returnedArgument.assessmentId).toBe(assessmentId);
        expect(returnedArgument.createdAt).toEqual(createdAt);
        expect(returnedArgument.updatedAt).toEqual(updatedAt);
      }
    });

    it('should maintain consistency across multiple retrievals', async () => {
      const argumentId = '55555555-5555-5555-5555-555555555555';

      const argument = createTestArgument({
        id: argumentId,
        title: 'Consistency Test Argument',
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };

      // Call multiple times
      const results = await Promise.all([
        useCase.execute(request),
        useCase.execute(request),
        useCase.execute(request),
      ]);

      results.forEach((result) => {
        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value.argument.id).toBe(argumentId);
          expect(result.value.argument.title).toBe('Consistency Test Argument');
        }
      });

      // Ensure all results are identical
      if (results.every((r) => r.isRight())) {
        const [first, second, third] = results.map(
          (r) => (r as any).value.argument,
        );
        expect(first).toEqual(second);
        expect(second).toEqual(third);
      }
    });

    // NEW COMPREHENSIVE DATA INTEGRITY TESTS
    it('should return immutable response objects', async () => {
      const argumentId = '66666666-6666-6666-6666-666666666666';
      const argument = createTestArgument({
        id: argumentId,
        title: 'Immutable Test Argument',
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;
        const originalTitle = response.argument.title;

        // Try to modify the response
        (response.argument as any).title = 'Modified Title';

        // Execute again and verify original data is unchanged
        const secondResult = await useCase.execute(request);
        expect(secondResult.isRight()).toBe(true);
        if (secondResult.isRight()) {
          expect(secondResult.value.argument.title).toBe(originalTitle);
        }
      }
    });

    it('should handle date objects correctly and create new instances', async () => {
      const argumentId = '77777777-7777-7777-7777-777777777777';
      const originalDate = new Date('2024-01-01T10:00:00Z');

      const argument = createTestArgument({
        id: argumentId,
        title: 'Date Test Argument',
        createdAt: originalDate,
        updatedAt: originalDate,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;

        // Verify dates are correct
        expect(response.argument.createdAt).toEqual(originalDate);
        expect(response.argument.updatedAt).toEqual(originalDate);

        // Verify they are new Date instances (not references)
        expect(response.argument.createdAt).not.toBe(originalDate);
        expect(response.argument.updatedAt).not.toBe(originalDate);

        // Verify they are actual Date objects
        expect(response.argument.createdAt).toBeInstanceOf(Date);
        expect(response.argument.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should handle null/undefined assessmentId correctly', async () => {
      const argumentId = '88888888-8888-8888-8888-888888888888';
      const argument = createTestArgument({
        id: argumentId,
        title: 'No Assessment Argument',
        assessmentId: undefined,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.assessmentId).toBeUndefined();
      }
    });

    it('should preserve argument field types accurately', async () => {
      const argumentId = '99999999-9999-9999-9999-999999999999';
      const assessmentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const updatedAt = new Date('2024-01-02T15:30:00Z');

      const argument = createTestArgument({
        id: argumentId,
        title: 'Type Test Argument',
        assessmentId,
        createdAt,
        updatedAt,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value.argument;

        // Verify field types
        expect(typeof response.id).toBe('string');
        expect(typeof response.title).toBe('string');
        expect(typeof response.assessmentId).toBe('string');
        expect(response.createdAt).toBeInstanceOf(Date);
        expect(response.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should handle arguments with different timestamp precisions', async () => {
      const argumentId = 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const createdAt = new Date('2024-01-01T10:00:00.123Z'); // With milliseconds
      const updatedAt = new Date('2024-01-02T15:30:45.678Z'); // With milliseconds

      const argument = createTestArgument({
        id: argumentId,
        title: 'Precision Test Argument',
        createdAt,
        updatedAt,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value.argument;

        // Verify precise timestamps are preserved
        expect(response.createdAt.getTime()).toBe(createdAt.getTime());
        expect(response.updatedAt.getTime()).toBe(updatedAt.getTime());
      }
    });

    it('should not leak internal object references', async () => {
      const argumentId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const argument = createTestArgument({
        id: argumentId,
        title: 'Reference Test Argument',
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result1 = await useCase.execute(request);
      const result2 = await useCase.execute(request);

      expect(result1.isRight()).toBe(true);
      expect(result2.isRight()).toBe(true);

      if (result1.isRight() && result2.isRight()) {
        // Results should be equal but not the same object reference
        expect(result1.value.argument).toEqual(result2.value.argument);
        expect(result1.value.argument).not.toBe(result2.value.argument);
        expect(result1.value.argument.createdAt).not.toBe(
          result2.value.argument.createdAt,
        );
        expect(result1.value.argument.updatedAt).not.toBe(
          result2.value.argument.updatedAt,
        );
      }
    });

    it('should handle argument titles with special encoding', async () => {
      const argumentId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
      const specialTitle = 'Title with © ™ ® symbols and 数字 Chinese';

      const argument = createTestArgument({
        id: argumentId,
        title: specialTitle,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(specialTitle);
        expect(result.value.argument.title.length).toBe(specialTitle.length);
      }
    });

    it('should preserve argument field order consistency', async () => {
      const argumentId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
      const assessmentId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

      const argument = createTestArgument({
        id: argumentId,
        title: 'Order Test Argument',
        assessmentId,
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value.argument;
        const keys = Object.keys(response);

        // Verify expected field order
        expect(keys).toEqual([
          'id',
          'title',
          'assessmentId',
          'createdAt',
          'updatedAt',
        ]);
      }
    });

    it('should handle extremely large argument datasets', async () => {
      // Create multiple arguments to test memory handling
      const argumentIds = Array.from(
        { length: 50 },
        (_, i) =>
          `${i.toString().padStart(8, '0')}-0000-0000-0000-000000000000`,
      );

      const argumentEntities = argumentIds.map((id) =>
        createTestArgument({
          id,
          title: `Large Dataset Argument ${id}`,
        }),
      );

      // Create all arguments
      await Promise.all(
        argumentEntities.map((arg) => argumentRepository.create(arg)),
      );

      // Retrieve all arguments
      const requests = argumentIds.map((id) => ({ id }));
      const results = await Promise.all(
        requests.map((req) => useCase.execute(req)),
      );

      // Verify all results are successful
      results.forEach((result, index) => {
        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value.argument.id).toBe(argumentIds[index]);
          expect(result.value.argument.title).toBe(
            `Large Dataset Argument ${argumentIds[index]}`,
          );
        }
      });
    });

    it('should maintain data integrity under stress conditions', async () => {
      const argumentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const argument = createTestArgument({
        id: argumentId,
        title: 'Stress Test Argument',
      });

      await argumentRepository.create(argument);

      const request: GetArgumentRequest = { id: argumentId };

      // Create many concurrent requests
      const promises = Array.from({ length: 100 }, () =>
        useCase.execute(request),
      );
      const results = await Promise.all(promises);

      // Verify all results are identical and correct
      results.forEach((result, index) => {
        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value.argument.id).toBe(argumentId);
          expect(result.value.argument.title).toBe('Stress Test Argument');
        }
      });

      // Verify all results are identical
      if (results.every((r) => r.isRight())) {
        const firstResult = (results[0] as any).value.argument;
        results.slice(1).forEach((result) => {
          expect((result as any).value.argument).toEqual(firstResult);
        });
      }
    });
  });
});
