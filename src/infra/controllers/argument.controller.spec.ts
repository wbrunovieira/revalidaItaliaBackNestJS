// src/infra/controllers/argument.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { left, right } from '@/core/either';
import { ArgumentController } from './argument.controller';
import { CreateArgumentDto } from '@/domain/assessment/application/dtos/create-argument.dto';
import { CreateArgumentUseCase } from '@/domain/assessment/application/use-cases/create-argument.use-case';
import { GetArgumentUseCase } from '@/domain/assessment/application/use-cases/get-argument.use-case';
import { UpdateArgumentUseCase } from '@/domain/assessment/application/use-cases/update-argument.use-case';
import { UpdateArgumentDto } from '@/domain/assessment/application/dtos/update-argument.dto';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { DuplicateArgumentError } from '@/domain/assessment/application/use-cases/errors/duplicate-argument-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { ArgumentNotFoundError } from '@/domain/assessment/application/use-cases/errors/argument-not-found-error';

class MockCreateArgumentUseCase {
  execute = vi.fn();
}

class MockGetArgumentUseCase {
  execute = vi.fn();
}

class MockUpdateArgumentUseCase {
  execute = vi.fn();
}

class MockListArgumentsUseCase {
  execute = vi.fn();
}

describe('ArgumentController', () => {
  let controller: ArgumentController;
  let createUseCase: MockCreateArgumentUseCase;
  let getUseCase: MockGetArgumentUseCase;
  let updateUseCase: MockUpdateArgumentUseCase;
  let listUseCase: MockListArgumentsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    createUseCase = new MockCreateArgumentUseCase();
    getUseCase = new MockGetArgumentUseCase();
    updateUseCase = new MockUpdateArgumentUseCase();
    listUseCase = new MockListArgumentsUseCase();
    controller = new ArgumentController(
      createUseCase as any,
      getUseCase as any,
      updateUseCase as any,
      listUseCase as any,
    );
  });

  describe('create()', () => {
    const validArgumentWithAssessmentDto: CreateArgumentDto = {
      title: 'Anatomia Cardiovascular',
      assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    };

    const validArgumentWithoutAssessmentDto: CreateArgumentDto = {
      title: 'Farmacologia Geral',
    };

    describe('✅ Success Cases', () => {
      it('returns created argument on success with assessmentId', async () => {
        const createdArgument = {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          title: 'Anatomia Cardiovascular',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: createdArgument }),
        );

        const response = await controller.create(
          validArgumentWithAssessmentDto,
        );

        expect(response).toEqual({
          success: true,
          argument: createdArgument,
        });
        expect(createUseCase.execute).toHaveBeenCalledWith({
          title: validArgumentWithAssessmentDto.title,
          assessmentId: validArgumentWithAssessmentDto.assessmentId,
        });
      });

      it('returns created argument on success without assessmentId', async () => {
        const createdArgument = {
          id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          title: 'Farmacologia Geral',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: createdArgument }),
        );

        const response = await controller.create(
          validArgumentWithoutAssessmentDto,
        );

        expect(response).toEqual({
          success: true,
          argument: createdArgument,
        });
        expect(createUseCase.execute).toHaveBeenCalledWith({
          title: validArgumentWithoutAssessmentDto.title,
          assessmentId: undefined,
        });
      });

      it('handles argument with minimum title length (3 characters)', async () => {
        const minimalDto: CreateArgumentDto = {
          title: 'Min',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };
        const createdArgument = {
          id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          title: 'Min',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: createdArgument }),
        );

        const response = await controller.create(minimalDto);

        expect(response.argument.title).toBe('Min');
        expect(response.argument.title.length).toBe(3);
      });

      it('handles argument with maximum title length (255 characters)', async () => {
        const maxTitle = 'A'.repeat(255);
        const maximalDto: CreateArgumentDto = {
          title: maxTitle,
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };
        const createdArgument = {
          id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          title: maxTitle,
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: createdArgument }),
        );

        const response = await controller.create(maximalDto);

        expect(response.argument.title).toBe(maxTitle);
        expect(response.argument.title.length).toBe(255);
      });

      it('handles argument with special characters in title', async () => {
        const specialDto: CreateArgumentDto = {
          title:
            'Neurologia - Módulo III: Sistema Nervoso Central & Periférico',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };
        const createdArgument = {
          id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
          title:
            'Neurologia - Módulo III: Sistema Nervoso Central & Periférico',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: createdArgument }),
        );

        const response = await controller.create(specialDto);

        expect(response.argument.title).toBe(
          'Neurologia - Módulo III: Sistema Nervoso Central & Periférico',
        );
      });

      it('handles argument with emojis in title', async () => {
        const emojiDto: CreateArgumentDto = {
          title: 'Cardiologia 🫀 - Análise Crítica',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };
        const createdArgument = {
          id: 'gggggggg-gggg-gggg-gggg-gggggggggggg',
          title: 'Cardiologia 🫀 - Análise Crítica',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: createdArgument }),
        );

        const response = await controller.create(emojiDto);

        expect(response.argument.title).toBe(
          'Cardiologia 🫀 - Análise Crítica',
        );
      });

      it('handles argument with only numbers in title', async () => {
        const numericDto: CreateArgumentDto = {
          title: '123456789',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };
        const createdArgument = {
          id: 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
          title: '123456789',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: createdArgument }),
        );

        const response = await controller.create(numericDto);

        expect(response.argument.title).toBe('123456789');
      });

      it('handles argument with Unicode characters in title', async () => {
        const unicodeDto: CreateArgumentDto = {
          title: 'Medicina 中文 العربية',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };
        const createdArgument = {
          id: 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii',
          title: 'Medicina 中文 العربية',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: createdArgument }),
        );

        const response = await controller.create(unicodeDto);

        expect(response.argument.title).toBe('Medicina 中文 العربية');
      });

      it('handles argument with mixed whitespace in title', async () => {
        const whitespaceDto: CreateArgumentDto = {
          title: '  Argumento  com  espaços  extras  ',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };
        const createdArgument = {
          id: 'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj',
          title: '  Argumento  com  espaços  extras  ',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: createdArgument }),
        );

        const response = await controller.create(whitespaceDto);

        expect(response.argument.title).toBe(
          '  Argumento  com  espaços  extras  ',
        );
      });

      it('calls createArgumentUseCase.execute exactly once', async () => {
        const createdArgument = {
          id: 'test-id',
          title: 'Test Argument',
          assessmentId: 'test-assessment-id',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: createdArgument }),
        );

        await controller.create(validArgumentWithAssessmentDto);

        expect(createUseCase.execute).toHaveBeenCalledTimes(1);
      });

      it('preserves all argument properties in success response', async () => {
        const createdArgument = {
          id: 'complete-argument-id',
          title: 'Complete Argument Test',
          assessmentId: 'complete-assessment-id',
          createdAt: new Date('2023-06-15'),
          updatedAt: new Date('2023-06-16'),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: createdArgument }),
        );

        const response = await controller.create(
          validArgumentWithAssessmentDto,
        );

        expect(response.argument).toMatchObject({
          id: createdArgument.id,
          title: createdArgument.title,
          assessmentId: createdArgument.assessmentId,
          createdAt: createdArgument.createdAt,
          updatedAt: createdArgument.updatedAt,
        });
      });
    });

    describe('⚠️ Validation Errors (400)', () => {
      it('throws BadRequestException on InvalidInputError with title validation', async () => {
        const validationDetails = [
          'title: Argument title must be at least 3 characters long',
        ];
        createUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        const invalidDto: CreateArgumentDto = {
          title: 'Ab',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };

        try {
          await controller.create(invalidDto);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with title too long', async () => {
        const validationDetails = [
          'title: Argument title must be at most 255 characters long',
        ];
        createUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        const invalidDto: CreateArgumentDto = {
          title: 'A'.repeat(300),
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };

        try {
          await controller.create(invalidDto);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with empty title', async () => {
        const validationDetails = [
          'title: Argument title must be at least 3 characters long',
        ];
        createUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        const invalidDto: CreateArgumentDto = {
          title: '',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };

        try {
          await controller.create(invalidDto);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with whitespace only title', async () => {
        const validationDetails = [
          'title: Argument title must be at least 3 characters long',
        ];
        createUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        const invalidDto: CreateArgumentDto = {
          title: '   ',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };

        try {
          await controller.create(invalidDto);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with invalid UUID', async () => {
        const validationDetails = [
          'assessmentId: Assessment ID must be a valid UUID',
        ];
        createUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        const invalidDto: CreateArgumentDto = {
          title: 'Valid Title',
          assessmentId: 'invalid-uuid',
        };

        try {
          await controller.create(invalidDto);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with empty assessmentId string', async () => {
        const validationDetails = [
          'assessmentId: Assessment ID must be a valid UUID',
        ];
        createUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        const invalidDto: CreateArgumentDto = {
          title: 'Valid Title',
          assessmentId: '',
        };

        try {
          await controller.create(invalidDto);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with multiple validation errors', async () => {
        const validationDetails = [
          'title: Argument title must be at least 3 characters long',
          'assessmentId: Assessment ID must be a valid UUID',
        ];
        createUseCase.execute.mockResolvedValueOnce(
          left(
            new InvalidInputError(
              'Multiple validation errors',
              validationDetails,
            ),
          ),
        );

        const invalidDto: CreateArgumentDto = {
          title: 'AB',
          assessmentId: 'invalid-format',
        };

        try {
          await controller.create(invalidDto);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          const response = error.getResponse();
          expect(response.error).toBe('INVALID_INPUT');
          expect(response.message).toBe('Invalid input data');
          expect(response.details).toEqual(validationDetails);
          expect(response.details).toHaveLength(2);
        }
      });

      it('throws BadRequestException on InvalidInputError with title containing control characters', async () => {
        const validationDetails = ['title: Title contains invalid characters'];
        createUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        const invalidDto: CreateArgumentDto = {
          title: 'Title\x00\x01\x02',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };

        try {
          await controller.create(invalidDto);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with title containing newlines', async () => {
        const validationDetails = ['title: Title contains invalid characters'];
        createUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        const invalidDto: CreateArgumentDto = {
          title: 'Title\nWith\nNewlines',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };

        try {
          await controller.create(invalidDto);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });
    });

    describe('🔍 Business Logic Errors', () => {
      it('throws ConflictException on DuplicateArgumentError', async () => {
        createUseCase.execute.mockResolvedValueOnce(
          left(new DuplicateArgumentError()),
        );

        try {
          await controller.create(validArgumentWithAssessmentDto);
          expect.fail('Should have thrown ConflictException');
        } catch (error) {
          expect(error).toBeInstanceOf(ConflictException);
          expect(error.getResponse()).toEqual({
            error: 'DUPLICATE_ARGUMENT',
            message: 'Argument with this title already exists',
          });
        }
      });

      it('throws ConflictException on DuplicateArgumentError with different case', async () => {
        createUseCase.execute.mockResolvedValueOnce(
          left(new DuplicateArgumentError()),
        );

        const duplicateDto: CreateArgumentDto = {
          title: 'DUPLICATE TITLE',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };

        try {
          await controller.create(duplicateDto);
          expect.fail('Should have thrown ConflictException');
        } catch (error) {
          expect(error).toBeInstanceOf(ConflictException);
          expect(error.getResponse()).toEqual({
            error: 'DUPLICATE_ARGUMENT',
            message: 'Argument with this title already exists',
          });
        }
      });

      it('throws NotFoundException on AssessmentNotFoundError', async () => {
        createUseCase.execute.mockResolvedValueOnce(
          left(new AssessmentNotFoundError()),
        );

        try {
          await controller.create(validArgumentWithAssessmentDto);
          expect.fail('Should have thrown NotFoundException');
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.getResponse()).toEqual({
            error: 'ASSESSMENT_NOT_FOUND',
            message: 'Assessment not found',
          });
        }
      });

      it('throws NotFoundException when assessment is soft deleted', async () => {
        createUseCase.execute.mockResolvedValueOnce(
          left(new AssessmentNotFoundError()),
        );

        const deletedAssessmentDto: CreateArgumentDto = {
          title: 'Valid Title',
          assessmentId: '00000000-0000-0000-0000-000000000000',
        };

        try {
          await controller.create(deletedAssessmentDto);
          expect.fail('Should have thrown NotFoundException');
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.getResponse()).toEqual({
            error: 'ASSESSMENT_NOT_FOUND',
            message: 'Assessment not found',
          });
        }
      });
    });

    describe('🔥 Repository Errors', () => {
      it('throws InternalServerErrorException on RepositoryError', async () => {
        createUseCase.execute.mockResolvedValueOnce(
          left(new RepositoryError('Database connection failed')),
        );

        try {
          await controller.create(validArgumentWithAssessmentDto);
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'Database connection failed',
          });
        }
      });

      it('throws InternalServerErrorException on RepositoryError during findByTitle', async () => {
        createUseCase.execute.mockResolvedValueOnce(
          left(new RepositoryError('Failed to query arguments table')),
        );

        try {
          await controller.create(validArgumentWithAssessmentDto);
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'Failed to query arguments table',
          });
        }
      });

      it('throws InternalServerErrorException on RepositoryError during create', async () => {
        createUseCase.execute.mockResolvedValueOnce(
          left(new RepositoryError('Failed to create argument')),
        );

        try {
          await controller.create(validArgumentWithAssessmentDto);
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'Failed to create argument',
          });
        }
      });

      it('throws InternalServerErrorException on RepositoryError during assessment validation', async () => {
        createUseCase.execute.mockResolvedValueOnce(
          left(new RepositoryError('Failed to validate assessment')),
        );

        try {
          await controller.create(validArgumentWithAssessmentDto);
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'Failed to validate assessment',
          });
        }
      });

      it('throws InternalServerErrorException on generic Error', async () => {
        createUseCase.execute.mockResolvedValueOnce(
          left(new Error('Unexpected error occurred')),
        );

        try {
          await controller.create(validArgumentWithAssessmentDto);
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'Unexpected error occurred',
          });
        }
      });
    });

    describe('🔍 Edge Cases', () => {
      it('handles argument creation with undefined assessmentId', async () => {
        const undefinedAssessmentDto: CreateArgumentDto = {
          title: 'Standalone Argument',
          assessmentId: undefined,
        };
        const createdArgument = {
          id: 'standalone-id',
          title: 'Standalone Argument',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: createdArgument }),
        );

        const response = await controller.create(undefinedAssessmentDto);

        expect(response.argument.assessmentId).toBeUndefined();
        expect(createUseCase.execute).toHaveBeenCalledWith({
          title: 'Standalone Argument',
          assessmentId: undefined,
        });
      });

      it('handles argument creation with null assessmentId', async () => {
        const nullAssessmentDto: CreateArgumentDto = {
          title: 'Null Assessment Argument',
          assessmentId: null as any,
        };
        const createdArgument = {
          id: 'null-assessment-id',
          title: 'Null Assessment Argument',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: createdArgument }),
        );

        const response = await controller.create(nullAssessmentDto);

        expect(response.argument.assessmentId).toBeUndefined();
        expect(createUseCase.execute).toHaveBeenCalledWith({
          title: 'Null Assessment Argument',
          assessmentId: null,
        });
      });

      it('handles title with tabs and special whitespace', async () => {
        const tabDto: CreateArgumentDto = {
          title: 'Title\twith\ttabs\nand\nnewlines',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };
        const createdArgument = {
          id: 'tab-id',
          title: 'Title\twith\ttabs\nand\nnewlines',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: createdArgument }),
        );

        const response = await controller.create(tabDto);

        expect(response.argument.title).toBe(
          'Title\twith\ttabs\nand\nnewlines',
        );
      });

      it('handles concurrent creation requests', async () => {
        const dto1: CreateArgumentDto = {
          title: 'Concurrent Argument 1',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };
        const dto2: CreateArgumentDto = {
          title: 'Concurrent Argument 2',
          assessmentId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        };

        createUseCase.execute.mockImplementation(({ title }) => {
          if (title === 'Concurrent Argument 1') {
            return Promise.resolve(right({ argument: { id: 'id1', title } }));
          }
          if (title === 'Concurrent Argument 2') {
            return Promise.resolve(left(new DuplicateArgumentError()));
          }
        });

        const [result1, result2] = await Promise.allSettled([
          controller.create(dto1),
          controller.create(dto2).catch((err) => err),
        ]);

        expect(result1.status).toBe('fulfilled');
        expect((result1 as any).value.success).toBe(true);

        expect(result2.status).toBe('fulfilled');
        expect((result2 as any).value).toBeInstanceOf(ConflictException);
      });

      it('preserves exact title formatting', async () => {
        const formattedDto: CreateArgumentDto = {
          title: 'Title with 123 numbers and símbolos especiais!',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };
        const createdArgument = {
          id: 'formatted-id',
          title: 'Title with 123 numbers and símbolos especiais!',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: createdArgument }),
        );

        const response = await controller.create(formattedDto);

        expect(response.argument.title).toBe(
          'Title with 123 numbers and símbolos especiais!',
        );
      });

      it('handles assessment deletion between validation and creation', async () => {
        createUseCase.execute.mockResolvedValueOnce(
          left(new RepositoryError('Foreign key constraint failed')),
        );

        const raceConditionDto: CreateArgumentDto = {
          title: 'Race Condition Test',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };

        try {
          await controller.create(raceConditionDto);
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'Foreign key constraint failed',
          });
        }
      });
    });

    describe('🔄 Behavior Testing', () => {
      it('passes correct request object to use case', async () => {
        const testDto: CreateArgumentDto = {
          title: 'Behavior Test',
          assessmentId: 'test-assessment-id',
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: { id: 'test-id', title: 'Behavior Test' } }),
        );

        await controller.create(testDto);

        expect(createUseCase.execute).toHaveBeenCalledWith({
          title: 'Behavior Test',
          assessmentId: 'test-assessment-id',
        });
      });

      it('returns the exact response structure', async () => {
        const exactArgument = {
          id: 'exact-test-id',
          title: 'Exact Test',
          assessmentId: 'exact-assessment-id',
          createdAt: new Date('2023-12-01'),
          updatedAt: new Date('2023-12-01'),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: exactArgument }),
        );

        const result = await controller.create(validArgumentWithAssessmentDto);

        expect(result).toEqual({
          success: true,
          argument: exactArgument,
        });
      });

      it('handles argument creation with very long UUID', async () => {
        const longUuidDto: CreateArgumentDto = {
          title: 'Long UUID Test',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: { id: 'long-uuid-id', title: 'Long UUID Test' } }),
        );

        const result = await controller.create(longUuidDto);

        expect(result.success).toBe(true);
        expect(createUseCase.execute).toHaveBeenCalledWith({
          title: 'Long UUID Test',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        });
      });
    });
  });

  describe('findById()', () => {
    const validArgumentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    describe('✅ Success Cases', () => {
      it('returns argument when found with complete data', async () => {
        const foundArgument = {
          id: validArgumentId,
          title: 'Complete JavaScript Argument',
          assessmentId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        };

        getUseCase.execute.mockResolvedValueOnce(
          right({ argument: foundArgument }),
        );

        const response = await controller.findById(validArgumentId);

        expect(response).toEqual({
          success: true,
          argument: foundArgument,
        });
        expect(getUseCase.execute).toHaveBeenCalledWith({
          id: validArgumentId,
        });
      });

      it('returns argument when found without assessment association', async () => {
        const foundArgument = {
          id: validArgumentId,
          title: 'Standalone Argument',
          assessmentId: undefined,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        };

        getUseCase.execute.mockResolvedValueOnce(
          right({ argument: foundArgument }),
        );

        const response = await controller.findById(validArgumentId);

        expect(response).toEqual({
          success: true,
          argument: foundArgument,
        });
        expect(response.argument.assessmentId).toBeUndefined();
      });

      it('returns argument with special characters in title', async () => {
        const foundArgument = {
          id: validArgumentId,
          title: 'Argumento de Programação & Lógica!',
          assessmentId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        };

        getUseCase.execute.mockResolvedValueOnce(
          right({ argument: foundArgument }),
        );

        const response = await controller.findById(validArgumentId);

        expect(response.argument.title).toBe(
          'Argumento de Programação & Lógica!',
        );
      });

      it('returns argument with unicode characters in title', async () => {
        const foundArgument = {
          id: validArgumentId,
          title: 'Argumento 中文 العربية русский 🎯',
          assessmentId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        };

        getUseCase.execute.mockResolvedValueOnce(
          right({ argument: foundArgument }),
        );

        const response = await controller.findById(validArgumentId);

        expect(response.argument.title).toBe(
          'Argumento 中文 العربية русский 🎯',
        );
      });

      it('returns argument with very long title', async () => {
        const longTitle = 'A'.repeat(1000);
        const foundArgument = {
          id: validArgumentId,
          title: longTitle,
          assessmentId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        };

        getUseCase.execute.mockResolvedValueOnce(
          right({ argument: foundArgument }),
        );

        const response = await controller.findById(validArgumentId);

        expect(response.argument.title).toBe(longTitle);
        expect(response.argument.title.length).toBe(1000);
      });

      it('returns argument with precise timestamps', async () => {
        const preciseCreatedAt = new Date('2024-01-01T10:00:00.123Z');
        const preciseUpdatedAt = new Date('2024-01-02T15:30:45.678Z');
        const foundArgument = {
          id: validArgumentId,
          title: 'Precision Test Argument',
          assessmentId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
          createdAt: preciseCreatedAt,
          updatedAt: preciseUpdatedAt,
        };

        getUseCase.execute.mockResolvedValueOnce(
          right({ argument: foundArgument }),
        );

        const response = await controller.findById(validArgumentId);

        expect(response.argument.createdAt).toEqual(preciseCreatedAt);
        expect(response.argument.updatedAt).toEqual(preciseUpdatedAt);
      });

      it('calls getArgumentUseCase.execute exactly once', async () => {
        const foundArgument = {
          id: validArgumentId,
          title: 'Test Argument',
          assessmentId: 'test-assessment-id',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        getUseCase.execute.mockResolvedValueOnce(
          right({ argument: foundArgument }),
        );

        await controller.findById(validArgumentId);

        expect(getUseCase.execute).toHaveBeenCalledTimes(1);
      });

      it('preserves all argument properties in success response', async () => {
        const foundArgument = {
          id: validArgumentId,
          title: 'Complete Property Test',
          assessmentId: 'complete-assessment-id',
          createdAt: new Date('2023-06-15'),
          updatedAt: new Date('2023-06-16'),
        };

        getUseCase.execute.mockResolvedValueOnce(
          right({ argument: foundArgument }),
        );

        const response = await controller.findById(validArgumentId);

        expect(response.argument).toMatchObject({
          id: foundArgument.id,
          title: foundArgument.title,
          assessmentId: foundArgument.assessmentId,
          createdAt: foundArgument.createdAt,
          updatedAt: foundArgument.updatedAt,
        });
      });
    });

    describe('⚠️ Validation Errors (400)', () => {
      it('throws BadRequestException on InvalidInputError with invalid UUID format', async () => {
        const validationDetails = ['id: ID must be a valid UUID'];
        getUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        const invalidId = 'invalid-uuid-format';

        try {
          await controller.findById(invalidId);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with empty ID', async () => {
        const validationDetails = ['id: ID cannot be empty'];
        getUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        const emptyId = '';

        try {
          await controller.findById(emptyId);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with UUID too long', async () => {
        const validationDetails = ['id: ID must be exactly 36 characters long'];
        getUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        const longId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa-extra-chars';

        try {
          await controller.findById(longId);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with UUID containing special characters', async () => {
        const validationDetails = ['id: ID must be a valid UUID'];
        getUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        const specialCharId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa@';

        try {
          await controller.findById(specialCharId);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with UUID with wrong hyphen placement', async () => {
        const validationDetails = ['id: ID must have proper UUID structure'];
        getUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        const wrongHyphenId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa-a';

        try {
          await controller.findById(wrongHyphenId);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with UUID missing hyphens', async () => {
        const validationDetails = ['id: ID must be a valid UUID'];
        getUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        const noHyphenId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

        try {
          await controller.findById(noHyphenId);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with UUID containing unicode characters', async () => {
        const validationDetails = ['id: ID must be a valid UUID'];
        getUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        const unicodeId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaαβγ';

        try {
          await controller.findById(unicodeId);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with UUID containing emojis', async () => {
        const validationDetails = ['id: ID must be a valid UUID'];
        getUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        const emojiId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa🎯';

        try {
          await controller.findById(emojiId);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });
    });

    describe('🔍 Business Logic Errors (404)', () => {
      it('throws NotFoundException on ArgumentNotFoundError', async () => {
        getUseCase.execute.mockResolvedValueOnce(
          left(new ArgumentNotFoundError()),
        );

        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        try {
          await controller.findById(nonExistentId);
          expect.fail('Should have thrown NotFoundException');
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.getResponse()).toEqual({
            error: 'ARGUMENT_NOT_FOUND',
            message: 'Argument not found',
          });
        }
      });

      it('throws NotFoundException when argument is soft deleted', async () => {
        getUseCase.execute.mockResolvedValueOnce(
          left(new ArgumentNotFoundError()),
        );

        const deletedArgumentId = '11111111-1111-1111-1111-111111111111';

        try {
          await controller.findById(deletedArgumentId);
          expect.fail('Should have thrown NotFoundException');
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.getResponse()).toEqual({
            error: 'ARGUMENT_NOT_FOUND',
            message: 'Argument not found',
          });
        }
      });

      it('throws NotFoundException with different case UUID (case sensitive)', async () => {
        getUseCase.execute.mockResolvedValueOnce(
          left(new ArgumentNotFoundError()),
        );

        const upperCaseId = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA';

        try {
          await controller.findById(upperCaseId);
          expect.fail('Should have thrown NotFoundException');
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.getResponse()).toEqual({
            error: 'ARGUMENT_NOT_FOUND',
            message: 'Argument not found',
          });
        }
      });
    });

    describe('🔥 Repository Errors (500)', () => {
      it('throws InternalServerErrorException on RepositoryError', async () => {
        getUseCase.execute.mockResolvedValueOnce(
          left(new RepositoryError('Database connection failed')),
        );

        try {
          await controller.findById(validArgumentId);
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'Database connection failed',
          });
        }
      });

      it('throws InternalServerErrorException on RepositoryError with timeout', async () => {
        getUseCase.execute.mockResolvedValueOnce(
          left(new RepositoryError('Database operation timed out')),
        );

        try {
          await controller.findById(validArgumentId);
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'Database operation timed out',
          });
        }
      });

      it('throws InternalServerErrorException on RepositoryError with connection error', async () => {
        getUseCase.execute.mockResolvedValueOnce(
          left(new RepositoryError('Unable to connect to database')),
        );

        try {
          await controller.findById(validArgumentId);
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'Unable to connect to database',
          });
        }
      });

      it('throws InternalServerErrorException on RepositoryError with host not found', async () => {
        getUseCase.execute.mockResolvedValueOnce(
          left(new RepositoryError('Database host not found')),
        );

        try {
          await controller.findById(validArgumentId);
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'Database host not found',
          });
        }
      });

      it('throws InternalServerErrorException on RepositoryError with corrupted data', async () => {
        getUseCase.execute.mockResolvedValueOnce(
          left(
            new RepositoryError(
              'Invalid argument data retrieved from repository',
            ),
          ),
        );

        try {
          await controller.findById(validArgumentId);
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'Invalid argument data retrieved from repository',
          });
        }
      });

      it('throws InternalServerErrorException on generic Error', async () => {
        getUseCase.execute.mockResolvedValueOnce(
          left(new Error('Unexpected error occurred')),
        );

        try {
          await controller.findById(validArgumentId);
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'Unexpected error occurred',
          });
        }
      });
    });

    describe('🔧 Edge Cases', () => {
      it('handles UUID with whitespace trimming', async () => {
        const foundArgument = {
          id: validArgumentId,
          title: 'Whitespace Test Argument',
          assessmentId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        getUseCase.execute.mockResolvedValueOnce(
          right({ argument: foundArgument }),
        );

        const whitespaceId = `  ${validArgumentId}  `;
        const response = await controller.findById(whitespaceId);

        expect(response.success).toBe(true);
        expect(response.argument.id).toBe(validArgumentId);
        expect(getUseCase.execute).toHaveBeenCalledWith({
          id: whitespaceId,
        });
      });

      it('handles concurrent findById requests', async () => {
        const foundArgument1 = {
          id: validArgumentId,
          title: 'Concurrent Test 1',
          assessmentId: 'concurrent-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const foundArgument2 = {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          title: 'Concurrent Test 2',
          assessmentId: 'concurrent-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        getUseCase.execute.mockImplementation(({ id }) => {
          if (id === validArgumentId) {
            return Promise.resolve(right({ argument: foundArgument1 }));
          }
          if (id === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') {
            return Promise.resolve(right({ argument: foundArgument2 }));
          }
          return Promise.resolve(left(new ArgumentNotFoundError()));
        });

        const [result1, result2] = await Promise.all([
          controller.findById(validArgumentId),
          controller.findById('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
        ]);

        expect(result1.success).toBe(true);
        expect(result1.argument.title).toBe('Concurrent Test 1');
        expect(result2.success).toBe(true);
        expect(result2.argument.title).toBe('Concurrent Test 2');
      });

      it('handles argument with extreme dates', async () => {
        const futureDate = new Date('2099-12-31T23:59:59Z');
        const pastDate = new Date('1900-01-01T00:00:00Z');
        const foundArgument = {
          id: validArgumentId,
          title: 'Extreme Dates Test',
          assessmentId: 'extreme-dates',
          createdAt: pastDate,
          updatedAt: futureDate,
        };

        getUseCase.execute.mockResolvedValueOnce(
          right({ argument: foundArgument }),
        );

        const response = await controller.findById(validArgumentId);

        expect(response.argument.createdAt).toEqual(pastDate);
        expect(response.argument.updatedAt).toEqual(futureDate);
      });

      it('handles argument with title containing control characters', async () => {
        const controlCharTitle = 'Title with \n\r\t control chars';
        const foundArgument = {
          id: validArgumentId,
          title: controlCharTitle,
          assessmentId: 'control-chars',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        getUseCase.execute.mockResolvedValueOnce(
          right({ argument: foundArgument }),
        );

        const response = await controller.findById(validArgumentId);

        expect(response.argument.title).toBe(controlCharTitle);
      });

      it('handles argument with zero-width characters in title', async () => {
        const zeroWidthTitle =
          'Title\u200B\u200C\u200D\uFEFFwith zero-width chars';
        const foundArgument = {
          id: validArgumentId,
          title: zeroWidthTitle,
          assessmentId: 'zero-width',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        getUseCase.execute.mockResolvedValueOnce(
          right({ argument: foundArgument }),
        );

        const response = await controller.findById(validArgumentId);

        expect(response.argument.title).toBe(zeroWidthTitle);
      });
    });

    describe('🔄 Behavior Testing', () => {
      it('passes correct request object to use case', async () => {
        const testId = 'test-id-12345678-1234-1234-1234-123456789012';
        const foundArgument = {
          id: testId,
          title: 'Behavior Test',
          assessmentId: 'behavior-test',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        getUseCase.execute.mockResolvedValueOnce(
          right({ argument: foundArgument }),
        );

        await controller.findById(testId);

        expect(getUseCase.execute).toHaveBeenCalledWith({
          id: testId,
        });
      });

      it('returns the exact response structure', async () => {
        const exactArgument = {
          id: validArgumentId,
          title: 'Exact Structure Test',
          assessmentId: 'exact-structure',
          createdAt: new Date('2023-12-01'),
          updatedAt: new Date('2023-12-01'),
        };

        getUseCase.execute.mockResolvedValueOnce(
          right({ argument: exactArgument }),
        );

        const result = await controller.findById(validArgumentId);

        expect(result).toEqual({
          success: true,
          argument: exactArgument,
        });
      });

      it('handles argument with all optional fields undefined', async () => {
        const minimalArgument = {
          id: validArgumentId,
          title: 'Minimal Argument',
          assessmentId: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        getUseCase.execute.mockResolvedValueOnce(
          right({ argument: minimalArgument }),
        );

        const result = await controller.findById(validArgumentId);

        expect(result.argument.assessmentId).toBeUndefined();
        expect(result.argument.title).toBe('Minimal Argument');
      });

      it('preserves exact argument data without modification', async () => {
        const originalArgument = {
          id: validArgumentId,
          title: 'Original Data Test',
          assessmentId: 'original-data',
          createdAt: new Date('2023-01-01T10:00:00.000Z'),
          updatedAt: new Date('2023-01-02T15:30:00.000Z'),
        };

        getUseCase.execute.mockResolvedValueOnce(
          right({ argument: originalArgument }),
        );

        const result = await controller.findById(validArgumentId);

        expect(result.argument).toEqual(originalArgument);
        expect(result.argument.id).toBe(originalArgument.id);
        expect(result.argument.title).toBe(originalArgument.title);
        expect(result.argument.assessmentId).toBe(
          originalArgument.assessmentId,
        );
        expect(result.argument.createdAt).toBe(originalArgument.createdAt);
        expect(result.argument.updatedAt).toBe(originalArgument.updatedAt);
      });
    });
  });

  describe('update()', () => {
    const validArgumentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const validUpdateDto: UpdateArgumentDto = {
      title: 'Updated Argument Title',
    };

    // Helper function to create mock argument with toResponseObject method
    const createMockArgument = (data: any) => ({
      ...data,
      toResponseObject: () => ({
        id: data.id,
        title: data.title,
        assessmentId: data.assessmentId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }),
    });

    describe('✅ Success Cases', () => {
      it('returns updated argument on successful update', async () => {
        const argumentData = {
          id: validArgumentId,
          title: 'Updated Argument Title',
          assessmentId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        };
        const updatedArgument = createMockArgument(argumentData);

        updateUseCase.execute.mockResolvedValueOnce(
          right({ argument: updatedArgument }),
        );

        const response = await controller.update(validArgumentId, validUpdateDto);

        expect(response).toEqual({
          success: true,
          argument: argumentData,
        });
        expect(updateUseCase.execute).toHaveBeenCalledWith({
          id: validArgumentId,
          title: validUpdateDto.title,
        });
      });

      it('returns updated argument with special characters in title', async () => {
        const specialDto: UpdateArgumentDto = {
          title: 'Título com acentos é çàracters únicos 🫀',
        };
        const argumentData = {
          id: validArgumentId,
          title: 'Título com acentos é çàracters únicos 🫀',
          assessmentId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        };
        const updatedArgument = createMockArgument(argumentData);

        updateUseCase.execute.mockResolvedValueOnce(
          right({ argument: updatedArgument }),
        );

        const response = await controller.update(validArgumentId, specialDto);

        expect(response.argument.title).toBe('Título com acentos é çàracters únicos 🫀');
      });

      it('returns updated argument with minimum length title', async () => {
        const minDto: UpdateArgumentDto = {
          title: 'ABC',
        };
        const argumentData = {
          id: validArgumentId,
          title: 'ABC',
          assessmentId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        };
        const updatedArgument = createMockArgument(argumentData);

        updateUseCase.execute.mockResolvedValueOnce(
          right({ argument: updatedArgument }),
        );

        const response = await controller.update(validArgumentId, minDto);

        expect(response.argument.title).toBe('ABC');
      });

      it('returns updated argument with maximum length title', async () => {
        const maxTitle = 'A'.repeat(255);
        const maxDto: UpdateArgumentDto = {
          title: maxTitle,
        };
        const argumentData = {
          id: validArgumentId,
          title: maxTitle,
          assessmentId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        };
        const updatedArgument = createMockArgument(argumentData);

        updateUseCase.execute.mockResolvedValueOnce(
          right({ argument: updatedArgument }),
        );

        const response = await controller.update(validArgumentId, maxDto);

        expect(response.argument.title).toBe(maxTitle);
      });

      it('returns updated argument when updating without title (partial update)', async () => {
        const emptyDto: UpdateArgumentDto = {};
        const argumentData = {
          id: validArgumentId,
          title: 'Original Title',
          assessmentId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        };
        const updatedArgument = createMockArgument(argumentData);

        updateUseCase.execute.mockResolvedValueOnce(
          right({ argument: updatedArgument }),
        );

        const response = await controller.update(validArgumentId, emptyDto);

        expect(response).toEqual({
          success: true,
          argument: argumentData,
        });
        expect(updateUseCase.execute).toHaveBeenCalledWith({
          id: validArgumentId,
          title: undefined,
        });
      });

      it('returns updated argument with unicode characters', async () => {
        const unicodeDto: UpdateArgumentDto = {
          title: 'Medicina 中文 العربية Русский',
        };
        const argumentData = {
          id: validArgumentId,
          title: 'Medicina 中文 العربية Русский',
          assessmentId: 'gggggggg-gggg-gggg-gggg-gggggggggggg',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        };
        const updatedArgument = createMockArgument(argumentData);

        updateUseCase.execute.mockResolvedValueOnce(
          right({ argument: updatedArgument }),
        );

        const response = await controller.update(validArgumentId, unicodeDto);

        expect(response.argument.title).toBe('Medicina 中文 العربية Русский');
      });
    });

    describe('⚠️ Validation Errors (400)', () => {
      it('throws BadRequestException on InvalidInputError with validation details', async () => {
        const validationDetails = ['title: Title must be at least 3 characters'];
        updateUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        await expect(
          controller.update(validArgumentId, { title: 'AB' }),
        ).rejects.toThrow(BadRequestException);
      });

      it('throws BadRequestException on InvalidInputError with invalid UUID', async () => {
        const validationDetails = ['id: Invalid UUID format'];
        updateUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        await expect(
          controller.update('invalid-uuid', validUpdateDto),
        ).rejects.toThrow(BadRequestException);
      });

      it('throws BadRequestException on InvalidInputError with multiple validation errors', async () => {
        const validationDetails = [
          'id: Invalid UUID format',
          'title: Title must be at least 3 characters',
        ];
        updateUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        await expect(
          controller.update('invalid-uuid', { title: 'AB' }),
        ).rejects.toThrow(BadRequestException);
      });

      it('throws BadRequestException on InvalidInputError with empty title after trimming', async () => {
        const validationDetails = ['title: Title cannot be empty'];
        updateUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        await expect(
          controller.update(validArgumentId, { title: '   ' }),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('🔍 Business Logic Errors', () => {
      it('throws NotFoundException on ArgumentNotFoundError', async () => {
        updateUseCase.execute.mockResolvedValueOnce(
          left(new ArgumentNotFoundError()),
        );

        await expect(
          controller.update('00000000-0000-0000-0000-000000000000', validUpdateDto),
        ).rejects.toThrow(NotFoundException);
      });

      it('throws ConflictException on DuplicateArgumentError', async () => {
        const duplicateError = new DuplicateArgumentError();
        updateUseCase.execute.mockResolvedValueOnce(left(duplicateError));

        await expect(
          controller.update(validArgumentId, { title: 'Duplicate Title' }),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('🔥 Repository Errors (500)', () => {
      it('throws InternalServerErrorException on RepositoryError', async () => {
        const repositoryError = new RepositoryError('Database connection failed');
        updateUseCase.execute.mockResolvedValueOnce(left(repositoryError));

        await expect(
          controller.update(validArgumentId, validUpdateDto),
        ).rejects.toThrow(InternalServerErrorException);
      });

      it('throws InternalServerErrorException on unexpected error', async () => {
        updateUseCase.execute.mockResolvedValueOnce(left(new Error('Unexpected error')));

        await expect(
          controller.update(validArgumentId, validUpdateDto),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });

    describe('🔧 Edge Cases', () => {
      it('handles concurrent update requests', async () => {
        const argumentData = {
          id: validArgumentId,
          title: 'Concurrent Update',
          assessmentId: 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        };
        const updatedArgument = createMockArgument(argumentData);

        updateUseCase.execute.mockResolvedValue(
          right({ argument: updatedArgument }),
        );

        const promises = [
          controller.update(validArgumentId, { title: 'Concurrent Update 1' }),
          controller.update(validArgumentId, { title: 'Concurrent Update 2' }),
        ];

        const results = await Promise.all(promises);

        results.forEach(result => {
          expect(result.success).toBe(true);
          expect(result.argument.title).toBe('Concurrent Update');
        });
      });

      it('preserves original data structure and types', async () => {
        const argumentData = {
          id: validArgumentId,
          title: 'Preserved Title',
          assessmentId: 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii',
          createdAt: new Date('2023-01-01T10:00:00.000Z'),
          updatedAt: new Date('2023-01-02T15:30:00.000Z'),
        };
        const originalArgument = createMockArgument(argumentData);

        updateUseCase.execute.mockResolvedValueOnce(
          right({ argument: originalArgument }),
        );

        const result = await controller.update(validArgumentId, validUpdateDto);

        expect(result.argument).toEqual(argumentData);
        expect(result.argument.id).toBe(argumentData.id);
        expect(result.argument.title).toBe(argumentData.title);
        expect(result.argument.assessmentId).toBe(argumentData.assessmentId);
        expect(result.argument.createdAt).toBe(argumentData.createdAt);
        expect(result.argument.updatedAt).toBe(argumentData.updatedAt);
      });

      it('calls updateArgumentUseCase.execute exactly once', async () => {
        const argumentData = {
          id: validArgumentId,
          title: 'Single Call Test',
          assessmentId: 'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        };
        const updatedArgument = createMockArgument(argumentData);

        updateUseCase.execute.mockResolvedValueOnce(
          right({ argument: updatedArgument }),
        );

        await controller.update(validArgumentId, validUpdateDto);

        expect(updateUseCase.execute).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('list()', () => {
    const validAssessmentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    describe('✅ Success Cases', () => {
      it('returns paginated arguments with default parameters', async () => {
        const mockArguments = [
          {
            id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            title: 'First Argument',
            assessmentId: validAssessmentId,
            createdAt: new Date('2023-01-02'),
            updatedAt: new Date('2023-01-02'),
          },
          {
            id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
            title: 'Second Argument',
            assessmentId: validAssessmentId,
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01'),
          },
        ];

        const mockPagination = {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        };

        listUseCase.execute.mockResolvedValueOnce(
          right({ arguments: mockArguments, pagination: mockPagination }),
        );

        const response = await controller.list(1, 10, undefined);

        expect(response).toEqual({
          success: true,
          arguments: mockArguments,
          pagination: mockPagination,
        });
        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          assessmentId: undefined,
        });
      });

      it('returns filtered arguments by assessmentId', async () => {
        const mockArguments = [
          {
            id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
            title: 'Filtered Argument 1',
            assessmentId: validAssessmentId,
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01'),
          },
        ];

        const mockPagination = {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        };

        listUseCase.execute.mockResolvedValueOnce(
          right({ arguments: mockArguments, pagination: mockPagination }),
        );

        const response = await controller.list(1, 10, validAssessmentId);

        expect(response.arguments).toHaveLength(1);
        expect(response.arguments[0].assessmentId).toBe(validAssessmentId);
        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          assessmentId: validAssessmentId,
        });
      });

      it('returns empty list when no arguments exist', async () => {
        const mockPagination = {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        };

        listUseCase.execute.mockResolvedValueOnce(
          right({ arguments: [], pagination: mockPagination }),
        );

        const response = await controller.list(1, 10, undefined);

        expect(response.arguments).toHaveLength(0);
        expect(response.pagination.total).toBe(0);
        expect(response.pagination.totalPages).toBe(0);
      });

      it('handles custom pagination parameters', async () => {
        const mockArguments = Array.from({ length: 5 }, (_, i) => ({
          id: `${i}0000000-0000-0000-0000-000000000000`,
          title: `Argument ${i + 1}`,
          assessmentId: validAssessmentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        const mockPagination = {
          page: 2,
          limit: 5,
          total: 15,
          totalPages: 3,
          hasNext: true,
          hasPrevious: true,
        };

        listUseCase.execute.mockResolvedValueOnce(
          right({ arguments: mockArguments, pagination: mockPagination }),
        );

        const response = await controller.list(2, 5, undefined);

        expect(response.arguments).toHaveLength(5);
        expect(response.pagination.page).toBe(2);
        expect(response.pagination.limit).toBe(5);
        expect(response.pagination.hasNext).toBe(true);
        expect(response.pagination.hasPrevious).toBe(true);
      });

      it('returns arguments with maximum limit', async () => {
        const mockArguments = Array.from({ length: 100 }, (_, i) => ({
          id: `${i.toString().padStart(8, '0')}-0000-0000-0000-000000000000`,
          title: `Argument ${i + 1}`,
          assessmentId: validAssessmentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        const mockPagination = {
          page: 1,
          limit: 100,
          total: 150,
          totalPages: 2,
          hasNext: true,
          hasPrevious: false,
        };

        listUseCase.execute.mockResolvedValueOnce(
          right({ arguments: mockArguments, pagination: mockPagination }),
        );

        const response = await controller.list(1, 100, undefined);

        expect(response.arguments).toHaveLength(100);
        expect(response.pagination.limit).toBe(100);
      });

      it('returns arguments without assessmentId', async () => {
        const mockArguments = [
          {
            id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
            title: 'Standalone Argument',
            assessmentId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        const mockPagination = {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        };

        listUseCase.execute.mockResolvedValueOnce(
          right({ arguments: mockArguments, pagination: mockPagination }),
        );

        const response = await controller.list(1, 10, undefined);

        expect(response.arguments[0].assessmentId).toBeUndefined();
      });

      it('returns arguments ordered by creation date (newest first)', async () => {
        const mockArguments = [
          {
            id: 'newest-id',
            title: 'Newest Argument',
            assessmentId: validAssessmentId,
            createdAt: new Date('2023-01-03'),
            updatedAt: new Date('2023-01-03'),
          },
          {
            id: 'middle-id',
            title: 'Middle Argument',
            assessmentId: validAssessmentId,
            createdAt: new Date('2023-01-02'),
            updatedAt: new Date('2023-01-02'),
          },
          {
            id: 'oldest-id',
            title: 'Oldest Argument',
            assessmentId: validAssessmentId,
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01'),
          },
        ];

        const mockPagination = {
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        };

        listUseCase.execute.mockResolvedValueOnce(
          right({ arguments: mockArguments, pagination: mockPagination }),
        );

        const response = await controller.list(1, 10, undefined);

        expect(response.arguments[0].title).toBe('Newest Argument');
        expect(response.arguments[2].title).toBe('Oldest Argument');
      });

      it('handles page beyond available pages', async () => {
        const mockPagination = {
          page: 5,
          limit: 10,
          total: 10,
          totalPages: 1,
          hasNext: false,
          hasPrevious: true,
        };

        listUseCase.execute.mockResolvedValueOnce(
          right({ arguments: [], pagination: mockPagination }),
        );

        const response = await controller.list(5, 10, undefined);

        expect(response.arguments).toHaveLength(0);
        expect(response.pagination.page).toBe(5);
        expect(response.pagination.hasPrevious).toBe(true);
      });

      it('calls listArgumentsUseCase.execute exactly once', async () => {
        listUseCase.execute.mockResolvedValueOnce(
          right({ arguments: [], pagination: {} as any }),
        );

        await controller.list(1, 10, undefined);

        expect(listUseCase.execute).toHaveBeenCalledTimes(1);
      });
    });

    describe('⚠️ Validation Errors (400)', () => {
      it('throws BadRequestException on InvalidInputError with negative page', async () => {
        const validationDetails = ['page: Page must be at least 1'];
        listUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        try {
          await controller.list(-1, 10, undefined);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with zero page', async () => {
        const validationDetails = ['page: Page must be at least 1'];
        listUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        try {
          await controller.list(0, 10, undefined);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with negative limit', async () => {
        const validationDetails = ['limit: Limit must be at least 1'];
        listUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        try {
          await controller.list(1, -1, undefined);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with zero limit', async () => {
        const validationDetails = ['limit: Limit must be at least 1'];
        listUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        try {
          await controller.list(1, 0, undefined);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with limit exceeding maximum', async () => {
        const validationDetails = ['limit: Limit cannot exceed 100'];
        listUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        try {
          await controller.list(1, 101, undefined);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with invalid assessmentId format', async () => {
        const validationDetails = [
          'assessmentId: Assessment ID must be a valid UUID',
        ];
        listUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        try {
          await controller.list(1, 10, 'invalid-uuid');
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with non-integer page', async () => {
        const validationDetails = ['page: Page must be an integer'];
        listUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        try {
          await controller.list(1.5, 10, undefined);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with non-integer limit', async () => {
        const validationDetails = ['limit: Limit must be an integer'];
        listUseCase.execute.mockResolvedValueOnce(
          left(new InvalidInputError('Validation failed', validationDetails)),
        );

        try {
          await controller.list(1, 10.5, undefined);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validationDetails,
          });
        }
      });

      it('throws BadRequestException on InvalidInputError with multiple validation errors', async () => {
        const validationDetails = [
          'page: Page must be at least 1',
          'limit: Limit cannot exceed 100',
          'assessmentId: Assessment ID must be a valid UUID',
        ];
        listUseCase.execute.mockResolvedValueOnce(
          left(
            new InvalidInputError(
              'Multiple validation errors',
              validationDetails,
            ),
          ),
        );

        try {
          await controller.list(-1, 200, 'invalid-uuid');
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          const response = error.getResponse();
          expect(response.error).toBe('INVALID_INPUT');
          expect(response.message).toBe('Invalid input data');
          expect(response.details).toEqual(validationDetails);
          expect(response.details).toHaveLength(3);
        }
      });
    });

    describe('🔍 Business Logic Errors', () => {
      it('throws NotFoundException on AssessmentNotFoundError', async () => {
        listUseCase.execute.mockResolvedValueOnce(
          left(new AssessmentNotFoundError()),
        );

        const nonExistentAssessmentId = '00000000-0000-0000-0000-000000000000';

        try {
          await controller.list(1, 10, nonExistentAssessmentId);
          expect.fail('Should have thrown NotFoundException');
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.getResponse()).toEqual({
            error: 'ASSESSMENT_NOT_FOUND',
            message: 'Assessment not found',
          });
        }
      });

      it('throws NotFoundException when assessment is soft deleted', async () => {
        listUseCase.execute.mockResolvedValueOnce(
          left(new AssessmentNotFoundError()),
        );

        const deletedAssessmentId = '11111111-1111-1111-1111-111111111111';

        try {
          await controller.list(1, 10, deletedAssessmentId);
          expect.fail('Should have thrown NotFoundException');
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.getResponse()).toEqual({
            error: 'ASSESSMENT_NOT_FOUND',
            message: 'Assessment not found',
          });
        }
      });
    });

    describe('🔥 Repository Errors (500)', () => {
      it('throws InternalServerErrorException on RepositoryError', async () => {
        listUseCase.execute.mockResolvedValueOnce(
          left(new RepositoryError('Database connection failed')),
        );

        try {
          await controller.list(1, 10, undefined);
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'Database connection failed',
          });
        }
      });

      it('throws InternalServerErrorException on RepositoryError during pagination', async () => {
        listUseCase.execute.mockResolvedValueOnce(
          left(new RepositoryError('Failed to calculate pagination')),
        );

        try {
          await controller.list(1, 10, undefined);
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'Failed to calculate pagination',
          });
        }
      });

      it('throws InternalServerErrorException on RepositoryError during filtering', async () => {
        listUseCase.execute.mockResolvedValueOnce(
          left(
            new RepositoryError('Failed to filter arguments by assessmentId'),
          ),
        );

        try {
          await controller.list(1, 10, validAssessmentId);
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'Failed to filter arguments by assessmentId',
          });
        }
      });

      it('throws InternalServerErrorException on generic Error', async () => {
        listUseCase.execute.mockResolvedValueOnce(
          left(new Error('Unexpected error occurred')),
        );

        try {
          await controller.list(1, 10, undefined);
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'Unexpected error occurred',
          });
        }
      });
    });

    describe('🔧 Edge Cases', () => {
      it('handles string parameters converted to numbers', async () => {
        const mockPagination = {
          page: 2,
          limit: 20,
          total: 50,
          totalPages: 3,
          hasNext: true,
          hasPrevious: true,
        };

        listUseCase.execute.mockResolvedValueOnce(
          right({ arguments: [], pagination: mockPagination }),
        );

        // Simulate query params coming as strings
        const response = await controller.list(
          '2' as any,
          '20' as any,
          undefined,
        );

        expect(response.pagination.page).toBe(2);
        expect(response.pagination.limit).toBe(20);
      });

      it('handles assessmentId with whitespace', async () => {
        const mockPagination = {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        };

        listUseCase.execute.mockResolvedValueOnce(
          right({ arguments: [], pagination: mockPagination }),
        );

        const whitespaceId = `  ${validAssessmentId}  `;
        await controller.list(1, 10, whitespaceId);

        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          assessmentId: whitespaceId,
        });
      });

      it('handles empty string assessmentId as undefined', async () => {
        const mockPagination = {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        };

        listUseCase.execute.mockResolvedValueOnce(
          right({ arguments: [], pagination: mockPagination }),
        );

        await controller.list(1, 10, '');

        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          assessmentId: '',
        });
      });

      it('handles concurrent list requests', async () => {
        const mockPagination1 = {
          page: 1,
          limit: 10,
          total: 5,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        };

        const mockPagination2 = {
          page: 2,
          limit: 20,
          total: 40,
          totalPages: 2,
          hasNext: false,
          hasPrevious: true,
        };

        listUseCase.execute
          .mockResolvedValueOnce(
            right({ arguments: [], pagination: mockPagination1 }),
          )
          .mockResolvedValueOnce(
            right({ arguments: [], pagination: mockPagination2 }),
          );

        const [result1, result2] = await Promise.all([
          controller.list(1, 10, undefined),
          controller.list(2, 20, undefined),
        ]);

        expect(result1.pagination.page).toBe(1);
        expect(result1.pagination.limit).toBe(10);
        expect(result2.pagination.page).toBe(2);
        expect(result2.pagination.limit).toBe(20);
      });

      it('handles large dataset pagination correctly', async () => {
        const mockArguments = Array.from({ length: 10 }, (_, i) => ({
          id: `${i}0000000-0000-0000-0000-000000000000`,
          title: `Argument ${i + 991}`,
          assessmentId: validAssessmentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        const mockPagination = {
          page: 100,
          limit: 10,
          total: 10000,
          totalPages: 1000,
          hasNext: true,
          hasPrevious: true,
        };

        listUseCase.execute.mockResolvedValueOnce(
          right({ arguments: mockArguments, pagination: mockPagination }),
        );

        const response = await controller.list(100, 10, undefined);

        expect(response.pagination.page).toBe(100);
        expect(response.pagination.total).toBe(10000);
        expect(response.pagination.totalPages).toBe(1000);
      });
    });

    describe('🔄 Behavior Testing', () => {
      it('passes correct request object to use case', async () => {
        listUseCase.execute.mockResolvedValueOnce(
          right({ arguments: [], pagination: {} as any }),
        );

        await controller.list(3, 25, validAssessmentId);

        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: 3,
          limit: 25,
          assessmentId: validAssessmentId,
        });
      });

      it('returns the exact response structure', async () => {
        const exactArguments = [
          {
            id: 'exact-id-1',
            title: 'Exact Argument 1',
            assessmentId: 'exact-assessment',
            createdAt: new Date('2023-12-01'),
            updatedAt: new Date('2023-12-01'),
          },
          {
            id: 'exact-id-2',
            title: 'Exact Argument 2',
            assessmentId: 'exact-assessment',
            createdAt: new Date('2023-12-02'),
            updatedAt: new Date('2023-12-02'),
          },
        ];

        const exactPagination = {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        };

        listUseCase.execute.mockResolvedValueOnce(
          right({ arguments: exactArguments, pagination: exactPagination }),
        );

        const result = await controller.list(1, 10, undefined);

        expect(result).toEqual({
          success: true,
          arguments: exactArguments,
          pagination: exactPagination,
        });
      });

      it('preserves exact argument data without modification', async () => {
        const originalArguments = [
          {
            id: 'preserve-id',
            title: 'Original Data Test',
            assessmentId: 'preserve-assessment',
            createdAt: new Date('2023-01-01T10:00:00.000Z'),
            updatedAt: new Date('2023-01-02T15:30:00.000Z'),
          },
        ];

        const originalPagination = {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        };

        listUseCase.execute.mockResolvedValueOnce(
          right({
            arguments: originalArguments,
            pagination: originalPagination,
          }),
        );

        const result = await controller.list(1, 10, undefined);

        expect(result.arguments).toEqual(originalArguments);
        expect(result.pagination).toEqual(originalPagination);
      });

      it('handles mixed argument types (with and without assessmentId)', async () => {
        const mixedArguments = [
          {
            id: 'with-assessment',
            title: 'Argument with Assessment',
            assessmentId: validAssessmentId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'without-assessment',
            title: 'Argument without Assessment',
            assessmentId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        const mockPagination = {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        };

        listUseCase.execute.mockResolvedValueOnce(
          right({ arguments: mixedArguments, pagination: mockPagination }),
        );

        const response = await controller.list(1, 10, undefined);

        expect(response.arguments[0].assessmentId).toBe(validAssessmentId);
        expect(response.arguments[1].assessmentId).toBeUndefined();
      });
    });
  });
});
