import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { left, right } from '@/core/either';
import { AssessmentController } from './assessment.controller';
import { CreateAssessmentDto } from '@/domain/assessment/application/dtos/create-assessment.dto';
import { CreateAssessmentUseCase } from '@/domain/assessment/application/use-cases/create-assessment.use-case';
import { ListAssessmentsUseCase } from '@/domain/assessment/application/use-cases/list-assessments.use-case';
import { GetAssessmentUseCase } from '@/domain/assessment/application/use-cases/get-assessment.use-case';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { DuplicateAssessmentError } from '@/domain/assessment/application/use-cases/errors/duplicate-assessment-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import { LessonNotFoundError } from '@/domain/assessment/application/use-cases/errors/lesson-not-found-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';

class MockCreateAssessmentUseCase {
  execute = vi.fn();
}

class MockListAssessmentsUseCase {
  execute = vi.fn();
}

class MockGetAssessmentUseCase {
  execute = vi.fn();
}

describe('AssessmentController', () => {
  let controller: AssessmentController;
  let createUseCase: MockCreateAssessmentUseCase;
  let listUseCase: MockListAssessmentsUseCase;
  let getUseCase: MockGetAssessmentUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    createUseCase = new MockCreateAssessmentUseCase();
    listUseCase = new MockListAssessmentsUseCase();
    getUseCase = new MockGetAssessmentUseCase();
    controller = new AssessmentController(
      createUseCase as any,
      listUseCase as any,
      getUseCase as any,
    );
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
      const validationDetails = ['lessonId: Lesson ID must be a valid UUID'];
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
        left(
          new InvalidInputError(
            'Invalid title for slug generation',
            validationDetails,
          ),
        ),
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
        left(
          new InvalidInputError(
            'Multiple validation errors',
            validationDetails,
          ),
        ),
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

  describe('list()', () => {
    const mockListResponse = {
      assessments: [
        {
          id: 'assessment-1',
          slug: 'quiz-javascript',
          title: 'JavaScript Quiz',
          description: 'Test JavaScript knowledge',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
          lessonId: 'lesson-1',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
        {
          id: 'assessment-2',
          slug: 'simulado-programming',
          title: 'Programming Simulado',
          type: 'SIMULADO',
          passingScore: 80,
          timeLimitInMinutes: 120,
          randomizeQuestions: true,
          randomizeOptions: true,
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };

    describe('✅ Success Cases', () => {
      it('returns assessments list with default pagination when no parameters provided', async () => {
        listUseCase.execute.mockResolvedValueOnce(right(mockListResponse));

        const result = await controller.list();

        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: undefined,
          limit: undefined,
          type: undefined,
          lessonId: undefined,
        });
        expect(result).toEqual(mockListResponse);
      });

      it('returns assessments list with custom pagination parameters', async () => {
        const paginatedResponse = {
          ...mockListResponse,
          pagination: { ...mockListResponse.pagination, page: 2, limit: 5 },
        };

        listUseCase.execute.mockResolvedValueOnce(right(paginatedResponse));

        const result = await controller.list('2', '5');

        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: 2,
          limit: 5,
          type: undefined,
          lessonId: undefined,
        });
        expect(result).toEqual(paginatedResponse);
      });

      it('returns filtered assessments by type', async () => {
        const filteredResponse = {
          assessments: [mockListResponse.assessments[0]], // Only QUIZ
          pagination: { ...mockListResponse.pagination, total: 1 },
        };

        listUseCase.execute.mockResolvedValueOnce(right(filteredResponse));

        const result = await controller.list(undefined, undefined, 'QUIZ');

        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: undefined,
          limit: undefined,
          type: 'QUIZ',
          lessonId: undefined,
        });
        expect(result).toEqual(filteredResponse);
      });

      it('returns filtered assessments by lessonId', async () => {
        const filteredResponse = {
          assessments: [mockListResponse.assessments[0]], // Only with lesson
          pagination: { ...mockListResponse.pagination, total: 1 },
        };

        listUseCase.execute.mockResolvedValueOnce(right(filteredResponse));

        const result = await controller.list(
          undefined,
          undefined,
          undefined,
          'lesson-1',
        );

        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: undefined,
          limit: undefined,
          type: undefined,
          lessonId: 'lesson-1',
        });
        expect(result).toEqual(filteredResponse);
      });

      it('returns filtered assessments with all parameters combined', async () => {
        const combinedResponse = {
          assessments: [mockListResponse.assessments[0]],
          pagination: {
            page: 1,
            limit: 3,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
          },
        };

        listUseCase.execute.mockResolvedValueOnce(right(combinedResponse));

        const result = await controller.list('1', '3', 'QUIZ', 'lesson-1');

        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: 1,
          limit: 3,
          type: 'QUIZ',
          lessonId: 'lesson-1',
        });
        expect(result).toEqual(combinedResponse);
      });

      it('returns empty list when no assessments match filters', async () => {
        const emptyResponse = {
          assessments: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          },
        };

        listUseCase.execute.mockResolvedValueOnce(right(emptyResponse));

        const result = await controller.list(
          undefined,
          undefined,
          'PROVA_ABERTA',
        );

        expect(result).toEqual(emptyResponse);
      });

      it('handles string to number conversion for page and limit', async () => {
        listUseCase.execute.mockResolvedValueOnce(right(mockListResponse));

        await controller.list('5', '20');

        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: 5,
          limit: 20,
          type: undefined,
          lessonId: undefined,
        });
      });

      it('calls listAssessmentsUseCase.execute exactly once', async () => {
        listUseCase.execute.mockResolvedValueOnce(right(mockListResponse));

        await controller.list('1', '10', 'QUIZ');

        expect(listUseCase.execute).toHaveBeenCalledTimes(1);
      });
    });

    describe('⚠️ Validation Errors (400)', () => {
      it('throws BadRequestException on InvalidInputError with validation details', async () => {
        const validationError = new InvalidInputError('Validation failed', [
          'page: Page must be at least 1',
          'limit: Limit cannot exceed 100',
        ]);
        listUseCase.execute.mockResolvedValueOnce(left(validationError));

        try {
          await controller.list('0', '101');
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toEqual({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: [
              'page: Page must be at least 1',
              'limit: Limit cannot exceed 100',
            ],
          });
        }
      });

      it('throws BadRequestException on invalid page parameter', async () => {
        const validationError = new InvalidInputError('Validation failed', [
          'page: Page must be at least 1',
        ]);
        listUseCase.execute.mockResolvedValueOnce(left(validationError));

        try {
          await controller.list('-1');
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toMatchObject({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
          });
        }
      });

      it('throws BadRequestException on invalid limit parameter', async () => {
        const validationError = new InvalidInputError('Validation failed', [
          'limit: Limit cannot exceed 100',
        ]);
        listUseCase.execute.mockResolvedValueOnce(left(validationError));

        try {
          await controller.list(undefined, '200');
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toMatchObject({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
          });
        }
      });

      it('throws BadRequestException on invalid assessment type', async () => {
        const validationError = new InvalidInputError('Validation failed', [
          'type: Type must be QUIZ, SIMULADO, or PROVA_ABERTA',
        ]);
        listUseCase.execute.mockResolvedValueOnce(left(validationError));

        try {
          await controller.list(undefined, undefined, 'INVALID_TYPE' as any);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toMatchObject({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
          });
        }
      });

      it('throws BadRequestException on invalid UUID format for lessonId', async () => {
        const validationError = new InvalidInputError('Validation failed', [
          'lessonId: Lesson ID must be a valid UUID',
        ]);
        listUseCase.execute.mockResolvedValueOnce(left(validationError));

        try {
          await controller.list(
            undefined,
            undefined,
            undefined,
            'invalid-uuid',
          );
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toMatchObject({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
          });
        }
      });

      it('throws BadRequestException with multiple validation errors', async () => {
        const validationError = new InvalidInputError('Validation failed', [
          'page: Page must be at least 1',
          'limit: Limit must be at least 1',
          'type: Type must be QUIZ, SIMULADO, or PROVA_ABERTA',
        ]);
        listUseCase.execute.mockResolvedValueOnce(left(validationError));

        try {
          await controller.list('0', '0', 'WRONG_TYPE' as any);
          expect.fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.getResponse()).toMatchObject({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: expect.arrayContaining([
              'page: Page must be at least 1',
              'limit: Limit must be at least 1',
              'type: Type must be QUIZ, SIMULADO, or PROVA_ABERTA',
            ]),
          });
        }
      });
    });

    describe('🔍 Business Logic Errors', () => {
      it('throws NotFoundException when lesson is not found', async () => {
        const lessonNotFoundError = new LessonNotFoundError();
        listUseCase.execute.mockResolvedValueOnce(left(lessonNotFoundError));

        try {
          await controller.list(
            undefined,
            undefined,
            undefined,
            'non-existent-lesson-id',
          );
          expect.fail('Should have thrown NotFoundException');
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.getResponse()).toEqual({
            error: 'LESSON_NOT_FOUND',
            message: 'Lesson not found',
          });
        }
      });

      it('throws InternalServerErrorException on RepositoryError', async () => {
        const repositoryError = new RepositoryError(
          'Database connection failed',
        );
        listUseCase.execute.mockResolvedValueOnce(left(repositoryError));

        try {
          await controller.list();
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'REPOSITORY_ERROR',
            message: 'Database connection failed',
          });
        }
      });

      it('throws InternalServerErrorException on unexpected error', async () => {
        const genericError = new Error('Unexpected error occurred');
        listUseCase.execute.mockResolvedValueOnce(left(genericError));

        try {
          await controller.list();
          expect.fail('Should have thrown InternalServerErrorException');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.getResponse()).toEqual({
            error: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          });
        }
      });
    });

    describe('🔍 Edge Cases', () => {
      it('handles very large page numbers gracefully', async () => {
        const largePageResponse = {
          assessments: [],
          pagination: {
            page: 9999,
            limit: 10,
            total: 5,
            totalPages: 1,
            hasNext: false,
            hasPrevious: true,
          },
        };

        listUseCase.execute.mockResolvedValueOnce(right(largePageResponse));

        const result = await controller.list('9999');

        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: 9999,
          limit: undefined,
          type: undefined,
          lessonId: undefined,
        });
        expect(result).toEqual(largePageResponse);
      });

      it('handles maximum allowed limit (100)', async () => {
        const maxLimitResponse = {
          ...mockListResponse,
          pagination: { ...mockListResponse.pagination, limit: 100 },
        };

        listUseCase.execute.mockResolvedValueOnce(right(maxLimitResponse));

        const result = await controller.list(undefined, '100');

        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: undefined,
          limit: 100,
          type: undefined,
          lessonId: undefined,
        });
        expect(result).toEqual(maxLimitResponse);
      });

      it('handles non-numeric strings for page and limit by converting to NaN', async () => {
        listUseCase.execute.mockResolvedValueOnce(right(mockListResponse));

        await controller.list('abc', 'xyz');

        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: NaN,
          limit: NaN,
          type: undefined,
          lessonId: undefined,
        });
      });

      it('handles empty strings for page and limit', async () => {
        listUseCase.execute.mockResolvedValueOnce(right(mockListResponse));

        await controller.list('', '');

        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: undefined, // empty strings are treated as falsy and become undefined
          limit: undefined,
          type: undefined,
          lessonId: undefined,
        });
      });

      it('preserves assessment data structure in response', async () => {
        const detailedResponse = {
          assessments: [
            {
              id: 'detailed-assessment',
              slug: 'detailed-quiz',
              title: 'Detailed Quiz Assessment',
              description: 'A comprehensive quiz with all fields',
              type: 'QUIZ',
              quizPosition: 'BEFORE_LESSON',
              passingScore: 85,
              randomizeQuestions: true,
              randomizeOptions: false,
              lessonId: 'lesson-abc',
              createdAt: new Date('2023-06-15'),
              updatedAt: new Date('2023-06-16'),
            },
          ],
          pagination: {
            page: 1,
            limit: 1,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
          },
        };

        listUseCase.execute.mockResolvedValueOnce(right(detailedResponse));

        const result = await controller.list('1', '1');

        expect(result.assessments[0]).toMatchObject({
          id: 'detailed-assessment',
          slug: 'detailed-quiz',
          title: 'Detailed Quiz Assessment',
          description: 'A comprehensive quiz with all fields',
          type: 'QUIZ',
          quizPosition: 'BEFORE_LESSON',
          passingScore: 85,
          randomizeQuestions: true,
          randomizeOptions: false,
          lessonId: 'lesson-abc',
        });
      });

      it('handles assessments with optional fields as undefined', async () => {
        const minimalResponse = {
          assessments: [
            {
              id: 'minimal-assessment',
              slug: 'minimal-prova',
              title: 'Minimal Prova Aberta',
              type: 'PROVA_ABERTA',
              passingScore: 70,
              randomizeQuestions: false,
              randomizeOptions: false,
              createdAt: new Date('2023-03-10'),
              updatedAt: new Date('2023-03-10'),
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
          },
        };

        listUseCase.execute.mockResolvedValueOnce(right(minimalResponse));

        const result = await controller.list();

        expect(result.assessments[0]).toMatchObject({
          id: 'minimal-assessment',
          type: 'PROVA_ABERTA',
          passingScore: 70,
        });
        expect(result.assessments[0].description).toBeUndefined();
        expect(result.assessments[0].quizPosition).toBeUndefined();
        expect(result.assessments[0].timeLimitInMinutes).toBeUndefined();
        expect(result.assessments[0].lessonId).toBeUndefined();
      });
    });

    describe('🔄 Behavior Testing', () => {
      it('passes correct request object to use case with all defined parameters', async () => {
        listUseCase.execute.mockResolvedValueOnce(right(mockListResponse));

        await controller.list('3', '15', 'SIMULADO', 'lesson-xyz');

        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: 3,
          limit: 15,
          type: 'SIMULADO',
          lessonId: 'lesson-xyz',
        });
      });

      it('passes undefined for missing optional parameters', async () => {
        listUseCase.execute.mockResolvedValueOnce(right(mockListResponse));

        await controller.list('2');

        expect(listUseCase.execute).toHaveBeenCalledWith({
          page: 2,
          limit: undefined,
          type: undefined,
          lessonId: undefined,
        });
      });

      it('returns the exact response from use case without modification', async () => {
        const exactResponse = {
          assessments: [
            {
              id: 'test-exact',
              slug: 'test-exact-slug',
              title: 'Exact Test',
              type: 'QUIZ',
              passingScore: 90,
              randomizeQuestions: true,
              randomizeOptions: true,
              createdAt: new Date('2023-12-01'),
              updatedAt: new Date('2023-12-01'),
            },
          ],
          pagination: {
            page: 2,
            limit: 3,
            total: 10,
            totalPages: 4,
            hasNext: true,
            hasPrevious: true,
          },
        };

        listUseCase.execute.mockResolvedValueOnce(right(exactResponse));

        const result = await controller.list('2', '3');

        expect(result).toBe(exactResponse); // Should be the exact same object reference
      });

      it('properly handles all three assessment types in filters', async () => {
        listUseCase.execute.mockResolvedValue(right(mockListResponse));

        // Test QUIZ type
        await controller.list(undefined, undefined, 'QUIZ');
        expect(listUseCase.execute).toHaveBeenLastCalledWith({
          page: undefined,
          limit: undefined,
          type: 'QUIZ',
          lessonId: undefined,
        });

        // Test SIMULADO type
        await controller.list(undefined, undefined, 'SIMULADO');
        expect(listUseCase.execute).toHaveBeenLastCalledWith({
          page: undefined,
          limit: undefined,
          type: 'SIMULADO',
          lessonId: undefined,
        });

        // Test PROVA_ABERTA type
        await controller.list(undefined, undefined, 'PROVA_ABERTA');
        expect(listUseCase.execute).toHaveBeenLastCalledWith({
          page: undefined,
          limit: undefined,
          type: 'PROVA_ABERTA',
          lessonId: undefined,
        });
      });
    });
  });

  describe('findById()', () => {
    const assessmentId = 'some-uuid';
    const mockAssessment = {
      assessment: {
        id: assessmentId,
        slug: 'test-assessment',
        title: 'Test Assessment',
        description: 'An assessment for testing.',
        type: 'QUIZ' as const,
        quizPosition: 'AFTER_LESSON' as const,
        passingScore: 80,
        randomizeQuestions: true,
        randomizeOptions: true,
        lessonId: 'lesson-uuid',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should return the assessment when found', async () => {
      getUseCase.execute.mockResolvedValue(right(mockAssessment));

      const result = await controller.findById(assessmentId);

      expect(getUseCase.execute).toHaveBeenCalledWith({ id: assessmentId });
      expect(result).toEqual(mockAssessment);
    });

    it('should throw NotFoundException when assessment is not found', async () => {
      getUseCase.execute.mockResolvedValue(left(new AssessmentNotFoundError()));

      await expect(controller.findById(assessmentId)).rejects.toThrow(
        NotFoundException,
      );

      try {
        await controller.findById(assessmentId);
      } catch (error) {
        expect(error.getResponse()).toEqual({
          error: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment not found',
        });
      }
    });

    it('should throw BadRequestException on InvalidInputError', async () => {
      const details = ['id: Invalid UUID'];
      getUseCase.execute.mockResolvedValue(
        left(new InvalidInputError('Validation failed', details)),
      );

      await expect(controller.findById('invalid-id')).rejects.toThrow(
        BadRequestException,
      );

      try {
        await controller.findById('invalid-id');
      } catch (error) {
        expect(error.getResponse()).toEqual({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details,
        });
      }
    });

    it('should throw InternalServerErrorException on RepositoryError', async () => {
      getUseCase.execute.mockResolvedValue(
        left(new RepositoryError('DB error')),
      );

      await expect(controller.findById(assessmentId)).rejects.toThrow(
        InternalServerErrorException,
      );

      try {
        await controller.findById(assessmentId);
      } catch (error) {
        expect(error.getResponse()).toEqual({
          error: 'REPOSITORY_ERROR',
          message: 'DB error',
        });
      }
    });

    it('should throw InternalServerErrorException on unexpected errors', async () => {
      getUseCase.execute.mockResolvedValue(
        left(new Error('An unexpected error occurred')),
      );

      await expect(controller.findById(assessmentId)).rejects.toThrow(
        InternalServerErrorException,
      );

      try {
        await controller.findById(assessmentId);
      } catch (error) {
        expect(error.getResponse()).toEqual({
          error: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        });
      }
    });
  });
});
('');
