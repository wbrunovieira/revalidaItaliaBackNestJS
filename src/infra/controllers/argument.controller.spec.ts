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
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { DuplicateArgumentError } from '@/domain/assessment/application/use-cases/errors/duplicate-argument-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';

class MockCreateArgumentUseCase {
  execute = vi.fn();
}

describe('ArgumentController', () => {
  let controller: ArgumentController;
  let createUseCase: MockCreateArgumentUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    createUseCase = new MockCreateArgumentUseCase();
    controller = new ArgumentController(createUseCase as any);
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

        const response = await controller.create(validArgumentWithAssessmentDto);

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

        const response = await controller.create(validArgumentWithoutAssessmentDto);

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
          title: 'Neurologia - Módulo III: Sistema Nervoso Central & Periférico',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        };
        const createdArgument = {
          id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
          title: 'Neurologia - Módulo III: Sistema Nervoso Central & Periférico',
          assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        };

        createUseCase.execute.mockResolvedValueOnce(
          right({ argument: createdArgument }),
        );

        const response = await controller.create(specialDto);

        expect(response.argument.title).toBe('Neurologia - Módulo III: Sistema Nervoso Central & Periférico');
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

        expect(response.argument.title).toBe('Cardiologia 🫀 - Análise Crítica');
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

        expect(response.argument.title).toBe('  Argumento  com  espaços  extras  ');
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

        const response = await controller.create(validArgumentWithAssessmentDto);

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
          left(new InvalidInputError('Multiple validation errors', validationDetails)),
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
        const validationDetails = [
          'title: Title contains invalid characters',
        ];
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
        const validationDetails = [
          'title: Title contains invalid characters',
        ];
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

        expect(response.argument.title).toBe('Title\twith\ttabs\nand\nnewlines');
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

        expect(response.argument.title).toBe('Title with 123 numbers and símbolos especiais!');
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
});