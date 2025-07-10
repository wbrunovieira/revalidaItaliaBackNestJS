// src/infra/controllers/assessment.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { left, right } from '@/core/either';
import { AssessmentController } from './assessment.controller';
import { CreateAssessmentDto } from '@/domain/assessment/application/dtos/create-assessment.dto';
import { CreateAssessmentUseCase } from '@/domain/assessment/application/use-cases/create-assessment.use-case';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { DuplicateAssessmentError } from '@/domain/assessment/application/use-cases/errors/duplicate-assessment-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import { LessonNotFoundError } from '@/domain/assessment/application/use-cases/errors/lesson-not-found-error';

class MockCreateAssessmentUseCase {
  execute = vi.fn();
}

describe('AssessmentController', () => {
  let controller: AssessmentController;
  let createUseCase: MockCreateAssessmentUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    createUseCase = new MockCreateAssessmentUseCase();
    controller = new AssessmentController(createUseCase as any);
  });

  describe('create()', () => {
    const validQuizDto: CreateAssessmentDto = {
      title: 'JavaScript Fundamentals Quiz',
      description: 'Test your knowledge of JavaScript basics',
      type: 'QUIZ',
      quizPosition: 'AFTER_LESSON',
      passingScore: 70,
      randomizeQuestions: false,
      randomizeOptions: false,
      lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    };

    const validSimuladoDto: CreateAssessmentDto = {
      title: 'Programming Simulado',
      description: 'Comprehensive programming simulation',
      type: 'SIMULADO',
      passingScore: 80,
      timeLimitInMinutes: 120,
      randomizeQuestions: true,
      randomizeOptions: true,
    };

    const validProvaAbertaDto: CreateAssessmentDto = {
      title: 'Advanced Programming Essay',
      description: 'Open-ended programming assessment',
      type: 'PROVA_ABERTA',
      passingScore: 75,
      randomizeQuestions: false,
      randomizeOptions: false,
    };

    it('returns created assessment on success for QUIZ type', async () => {
      const createdAssessment = {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        slug: 'javascript-fundamentals-quiz',
        title: 'JavaScript Fundamentals Quiz',
        description: 'Test your knowledge of JavaScript basics',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };

      createUseCase.execute.mockResolvedValueOnce(
        right({ assessment: createdAssessment }),
      );

      const response = await controller.create(validQuizDto);

      expect(response).toEqual({
        success: true,
        assessment: createdAssessment,
      });
      expect(createUseCase.execute).toHaveBeenCalledWith({
        title: validQuizDto.title,
        description: validQuizDto.description,
        type: validQuizDto.type,
        quizPosition: validQuizDto.quizPosition,
        passingScore: validQuizDto.passingScore,
        timeLimitInMinutes: validQuizDto.timeLimitInMinutes,
        randomizeQuestions: validQuizDto.randomizeQuestions,
        randomizeOptions: validQuizDto.randomizeOptions,
        lessonId: validQuizDto.lessonId,
      });
    });

    it('returns created assessment on success for SIMULADO type', async () => {
      const createdAssessment = {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        slug: 'programming-simulado',
        title: 'Programming Simulado',
        description: 'Comprehensive programming simulation',
        type: 'SIMULADO',
        passingScore: 80,
        timeLimitInMinutes: 120,
        randomizeQuestions: true,
        randomizeOptions: true,
      };

      createUseCase.execute.mockResolvedValueOnce(
        right({ assessment: createdAssessment }),
      );

      const response = await controller.create(validSimuladoDto);

      expect(response).toEqual({
        success: true,
        assessment: createdAssessment,
      });
      expect(createUseCase.execute).toHaveBeenCalledWith({
        title: validSimuladoDto.title,
        description: validSimuladoDto.description,
        type: validSimuladoDto.type,
        quizPosition: validSimuladoDto.quizPosition,
        passingScore: validSimuladoDto.passingScore,
        timeLimitInMinutes: validSimuladoDto.timeLimitInMinutes,
        randomizeQuestions: validSimuladoDto.randomizeQuestions,
        randomizeOptions: validSimuladoDto.randomizeOptions,
        lessonId: validSimuladoDto.lessonId,
      });
    });

    it('returns created assessment on success for PROVA_ABERTA type', async () => {
      const createdAssessment = {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        slug: 'advanced-programming-essay',
        title: 'Advanced Programming Essay',
        description: 'Open-ended programming assessment',
        type: 'PROVA_ABERTA',
        passingScore: 75,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      createUseCase.execute.mockResolvedValueOnce(
        right({ assessment: createdAssessment }),
      );

      const response = await controller.create(validProvaAbertaDto);

      expect(response).toEqual({
        success: true,
        assessment: createdAssessment,
      });
      expect(createUseCase.execute).toHaveBeenCalledWith({
        title: validProvaAbertaDto.title,
        description: validProvaAbertaDto.description,
        type: validProvaAbertaDto.type,
        quizPosition: validProvaAbertaDto.quizPosition,
        passingScore: validProvaAbertaDto.passingScore,
        timeLimitInMinutes: validProvaAbertaDto.timeLimitInMinutes,
        randomizeQuestions: validProvaAbertaDto.randomizeQuestions,
        randomizeOptions: validProvaAbertaDto.randomizeOptions,
        lessonId: validProvaAbertaDto.lessonId,
      });
    });

    it('handles assessment without description', async () => {
      const dtoWithoutDescription = {
        ...validQuizDto,
        description: undefined,
      };
      const createdAssessment = {
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        slug: 'javascript-fundamentals-quiz',
        title: 'JavaScript Fundamentals Quiz',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };

      createUseCase.execute.mockResolvedValueOnce(
        right({ assessment: createdAssessment }),
      );

      const response = await controller.create(dtoWithoutDescription);

      expect(response.assessment.description).toBeUndefined();
      expect(createUseCase.execute).toHaveBeenCalledWith({
        title: dtoWithoutDescription.title,
        description: undefined,
        type: dtoWithoutDescription.type,
        quizPosition: dtoWithoutDescription.quizPosition,
        passingScore: dtoWithoutDescription.passingScore,
        timeLimitInMinutes: dtoWithoutDescription.timeLimitInMinutes,
        randomizeQuestions: dtoWithoutDescription.randomizeQuestions,
        randomizeOptions: dtoWithoutDescription.randomizeOptions,
        lessonId: dtoWithoutDescription.lessonId,
      });
    });

    it('handles assessment without lessonId', async () => {
      const dtoWithoutLessonId = {
        ...validSimuladoDto,
        lessonId: undefined,
      };
      const createdAssessment = {
        id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        slug: 'programming-simulado',
        title: 'Programming Simulado',
        type: 'SIMULADO',
        passingScore: 80,
        timeLimitInMinutes: 120,
        randomizeQuestions: true,
        randomizeOptions: true,
      };

      createUseCase.execute.mockResolvedValueOnce(
        right({ assessment: createdAssessment }),
      );

      const response = await controller.create(dtoWithoutLessonId);

      expect(response.assessment.lessonId).toBeUndefined();
      expect(createUseCase.execute).toHaveBeenCalledWith({
        title: dtoWithoutLessonId.title,
        description: dtoWithoutLessonId.description,
        type: dtoWithoutLessonId.type,
        quizPosition: dtoWithoutLessonId.quizPosition,
        passingScore: dtoWithoutLessonId.passingScore,
        timeLimitInMinutes: dtoWithoutLessonId.timeLimitInMinutes,
        randomizeQuestions: dtoWithoutLessonId.randomizeQuestions,
        randomizeOptions: dtoWithoutLessonId.randomizeOptions,
        lessonId: undefined,
      });
    });

    it('throws BadRequestException on InvalidInputError with validation details', async () => {
      const validationDetails = [
        'title: Assessment title must be at least 3 characters long',
        'passingScore: Passing score must be at least 0',
      ];
      createUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', validationDetails)),
      );

      const invalidDto = {
        ...validQuizDto,
        title: 'AB',
        passingScore: -10,
      };

      try {
        await controller.create(invalidDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse()).toEqual({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: validationDetails,
        });
      }
    });

    it('throws BadRequestException on InvalidInputError with quiz position validation', async () => {
      const validationDetails = [
        'quizPosition: Quiz position is required for QUIZ type assessments',
      ];
      createUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', validationDetails)),
      );

      const invalidDto = {
        ...validQuizDto,
        quizPosition: undefined,
      };

      try {
        await controller.create(invalidDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse()).toEqual({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: validationDetails,
        });
      }
    });

    it('throws BadRequestException on InvalidInputError with time limit validation', async () => {
      const validationDetails = [
        'timeLimitInMinutes: Time limit can only be set for SIMULADO type assessments',
      ];
      createUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', validationDetails)),
      );

      const invalidDto = {
        ...validQuizDto,
        timeLimitInMinutes: 60,
      };

      try {
        await controller.create(invalidDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse()).toEqual({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: validationDetails,
        });
      }
    });

    it('throws BadRequestException on InvalidInputError with invalid passing score', async () => {
      const validationDetails = [
        'passingScore: Passing score must be at most 100',
      ];
      createUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', validationDetails)),
      );

      const invalidDto = {
        ...validQuizDto,
        passingScore: 150,
      };

      try {
        await controller.create(invalidDto);
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
        'lessonId: Lesson ID must be a valid UUID',
      ];
      createUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', validationDetails)),
      );

      const invalidDto = {
        ...validQuizDto,
        lessonId: 'invalid-uuid',
      };

      try {
        await controller.create(invalidDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse()).toEqual({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: validationDetails,
        });
      }
    });

    it('throws BadRequestException on InvalidInputError with invalid enum type', async () => {
      const validationDetails = [
        'type: Type must be QUIZ, SIMULADO or PROVA_ABERTA',
      ];
      createUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', validationDetails)),
      );

      const invalidDto = {
        ...validQuizDto,
        type: 'INVALID_TYPE' as any,
      };

      try {
        await controller.create(invalidDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse()).toEqual({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: validationDetails,
        });
      }
    });

    it('throws BadRequestException on InvalidInputError with slug generation error', async () => {
      const validationDetails = [
        'Invalid slug: Title must be at least 3 characters long to generate a valid slug',
      ];
      createUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Invalid title for slug generation', validationDetails)),
      );

      const invalidDto = {
        ...validQuizDto,
        title: 'AB',
      };

      try {
        await controller.create(invalidDto);
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
        'title: Assessment title must be at least 3 characters long',
        'passingScore: Passing score must be at least 0',
        'type: Type must be QUIZ, SIMULADO or PROVA_ABERTA',
        'quizPosition: Quiz position is required for QUIZ type assessments',
      ];
      createUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Multiple validation errors', validationDetails)),
      );

      const invalidDto = {
        title: 'AB',
        type: 'INVALID' as any,
        passingScore: -5,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      try {
        await controller.create(invalidDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse();
        expect(response.error).toBe('INVALID_INPUT');
        expect(response.message).toBe('Invalid input data');
        expect(response.details).toEqual(validationDetails);
        expect(response.details).toHaveLength(4);
      }
    });

    it('throws ConflictException on DuplicateAssessmentError', async () => {
      createUseCase.execute.mockResolvedValueOnce(
        left(new DuplicateAssessmentError()),
      );

      try {
        await controller.create(validQuizDto);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.getResponse()).toEqual({
          error: 'DUPLICATE_ASSESSMENT',
          message: 'Assessment with this title already exists',
        });
      }
    });

    it('throws InternalServerErrorException on LessonNotFoundError', async () => {
      createUseCase.execute.mockResolvedValueOnce(
        left(new LessonNotFoundError()),
      );

      try {
        await controller.create(validQuizDto);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.getResponse()).toEqual({
          error: 'INTERNAL_ERROR',
          message: 'Lesson not found',
        });
      }
    });

    it('throws InternalServerErrorException on RepositoryError', async () => {
      createUseCase.execute.mockResolvedValueOnce(
        left(new RepositoryError('Database connection failed')),
      );

      try {
        await controller.create(validQuizDto);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.getResponse()).toEqual({
          error: 'INTERNAL_ERROR',
          message: 'Database connection failed',
        });
      }
    });

    it('throws InternalServerErrorException on generic Error', async () => {
      createUseCase.execute.mockResolvedValueOnce(
        left(new Error('Unexpected error occurred')),
      );

      try {
        await controller.create(validQuizDto);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.getResponse()).toEqual({
          error: 'INTERNAL_ERROR',
          message: 'Unexpected error occurred',
        });
      }
    });

    it('calls createAssessmentUseCase.execute exactly once', async () => {
      const createdAssessment = {
        id: 'test-id',
        slug: 'test-slug',
        title: 'Test Assessment',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      createUseCase.execute.mockResolvedValueOnce(
        right({ assessment: createdAssessment }),
      );

      await controller.create(validQuizDto);

      expect(createUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('preserves all assessment properties in success response', async () => {
      const createdAssessment = {
        id: 'test-assessment-id',
        slug: 'comprehensive-test',
        title: 'Comprehensive Test Assessment',
        description: 'A comprehensive test with all properties',
        type: 'SIMULADO',
        passingScore: 85,
        timeLimitInMinutes: 180,
        randomizeQuestions: true,
        randomizeOptions: true,
        lessonId: 'lesson-test-id',
      };

      createUseCase.execute.mockResolvedValueOnce(
        right({ assessment: createdAssessment }),
      );

      const response = await controller.create(validSimuladoDto);

      expect(response.assessment).toMatchObject({
        id: createdAssessment.id,
        slug: createdAssessment.slug,
        title: createdAssessment.title,
        description: createdAssessment.description,
        type: createdAssessment.type,
        passingScore: createdAssessment.passingScore,
        timeLimitInMinutes: createdAssessment.timeLimitInMinutes,
        randomizeQuestions: createdAssessment.randomizeQuestions,
        randomizeOptions: createdAssessment.randomizeOptions,
        lessonId: createdAssessment.lessonId,
      });
    });

    it('handles edge case with minimum valid title length', async () => {
      const minimalDto = {
        ...validQuizDto,
        title: 'ABC',
      };
      const createdAssessment = {
        id: 'minimal-id',
        slug: 'abc',
        title: 'ABC',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      createUseCase.execute.mockResolvedValueOnce(
        right({ assessment: createdAssessment }),
      );

      const response = await controller.create(minimalDto);

      expect(response.assessment.title).toBe('ABC');
      expect(response.assessment.slug).toBe('abc');
    });

    it('handles edge case with maximum passing score', async () => {
      const maxScoreDto = {
        ...validQuizDto,
        passingScore: 100,
      };
      const createdAssessment = {
        id: 'max-score-id',
        slug: 'javascript-fundamentals-quiz',
        title: 'JavaScript Fundamentals Quiz',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 100,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      createUseCase.execute.mockResolvedValueOnce(
        right({ assessment: createdAssessment }),
      );

      const response = await controller.create(maxScoreDto);

      expect(response.assessment.passingScore).toBe(100);
    });

    it('handles edge case with minimum passing score', async () => {
      const minScoreDto = {
        ...validQuizDto,
        passingScore: 0,
      };
      const createdAssessment = {
        id: 'min-score-id',
        slug: 'javascript-fundamentals-quiz',
        title: 'JavaScript Fundamentals Quiz',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 0,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      createUseCase.execute.mockResolvedValueOnce(
        right({ assessment: createdAssessment }),
      );

      const response = await controller.create(minScoreDto);

      expect(response.assessment.passingScore).toBe(0);
    });

    it('handles quiz position BEFORE_LESSON', async () => {
      const beforeLessonDto = {
        ...validQuizDto,
        quizPosition: 'BEFORE_LESSON' as const,
      };
      const createdAssessment = {
        id: 'before-lesson-id',
        slug: 'javascript-fundamentals-quiz',
        title: 'JavaScript Fundamentals Quiz',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      createUseCase.execute.mockResolvedValueOnce(
        right({ assessment: createdAssessment }),
      );

      const response = await controller.create(beforeLessonDto);

      expect(response.assessment.quizPosition).toBe('BEFORE_LESSON');
    });

    it('handles boolean flags correctly', async () => {
      const booleanFlagsDto = {
        ...validSimuladoDto,
        randomizeQuestions: true,
        randomizeOptions: false,
      };
      const createdAssessment = {
        id: 'boolean-flags-id',
        slug: 'programming-simulado',
        title: 'Programming Simulado',
        type: 'SIMULADO',
        passingScore: 80,
        timeLimitInMinutes: 120,
        randomizeQuestions: true,
        randomizeOptions: false,
      };

      createUseCase.execute.mockResolvedValueOnce(
        right({ assessment: createdAssessment }),
      );

      const response = await controller.create(booleanFlagsDto);

      expect(response.assessment.randomizeQuestions).toBe(true);
      expect(response.assessment.randomizeOptions).toBe(false);
    });

    it('handles time limit edge case with minimum value', async () => {
      const minTimeDto = {
        ...validSimuladoDto,
        timeLimitInMinutes: 1,
      };
      const createdAssessment = {
        id: 'min-time-id',
        slug: 'programming-simulado',
        title: 'Programming Simulado',
        type: 'SIMULADO',
        passingScore: 80,
        timeLimitInMinutes: 1,
        randomizeQuestions: true,
        randomizeOptions: true,
      };

      createUseCase.execute.mockResolvedValueOnce(
        right({ assessment: createdAssessment }),
      );

      const response = await controller.create(minTimeDto);

      expect(response.assessment.timeLimitInMinutes).toBe(1);
    });
  });
});