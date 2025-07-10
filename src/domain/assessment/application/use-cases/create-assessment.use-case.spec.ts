// src/domain/assessment/application/use-cases/create-assessment.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { CreateAssessmentUseCase } from './create-assessment.use-case';
import { CreateAssessmentRequest } from '../dtos/create-assessment-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { DuplicateAssessmentError } from './errors/duplicate-assessment-error';
import { RepositoryError } from './errors/repository-error';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';

class MockAssessmentRepository implements IAssessmentRepository {
  findById = vi.fn();
  findByTitle = vi.fn();
  findByLessonId = vi.fn();
  create = vi.fn();
  findAll = vi.fn();
  update = vi.fn();
  delete = vi.fn();
  findByTitleExcludingId = vi.fn();
}

describe('CreateAssessmentUseCase', () => {
  let useCase: CreateAssessmentUseCase;
  let assessmentRepository: MockAssessmentRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    assessmentRepository = new MockAssessmentRepository();
    useCase = new CreateAssessmentUseCase(assessmentRepository);
  });

  describe('Success Cases', () => {
    it('creates a QUIZ assessment successfully', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Quiz de Matemática',
        description: 'Quiz sobre conceitos básicos de matemática',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: true,
        randomizeOptions: false,
        lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };

      assessmentRepository.findByTitle.mockResolvedValueOnce(left(new Error('Not found')));
      assessmentRepository.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.title).toBe('Quiz de Matemática');
        expect(result.value.assessment.type).toBe('QUIZ');
        expect(result.value.assessment.quizPosition).toBe('AFTER_LESSON');
        expect(result.value.assessment.passingScore).toBe(70);
        expect(result.value.assessment.slug).toBe('quiz-de-matematica');
        expect(result.value.assessment.lessonId).toBe('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
      }
    });

    it('creates a SIMULADO assessment successfully', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Simulado REVALIDA',
        description: 'Simulado completo do REVALIDA',
        type: 'SIMULADO',
        passingScore: 60,
        timeLimitInMinutes: 120,
        randomizeQuestions: true,
        randomizeOptions: true,
      };

      assessmentRepository.findByTitle.mockResolvedValueOnce(left(new Error('Not found')));
      assessmentRepository.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.title).toBe('Simulado REVALIDA');
        expect(result.value.assessment.type).toBe('SIMULADO');
        expect(result.value.assessment.timeLimitInMinutes).toBe(120);
        expect(result.value.assessment.quizPosition).toBeUndefined();
        expect(result.value.assessment.lessonId).toBeUndefined();
      }
    });

    it('creates a PROVA_ABERTA assessment successfully', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Prova Aberta de Medicina',
        type: 'PROVA_ABERTA',
        passingScore: 50,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      assessmentRepository.findByTitle.mockResolvedValueOnce(left(new Error('Not found')));
      assessmentRepository.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.title).toBe('Prova Aberta de Medicina');
        expect(result.value.assessment.type).toBe('PROVA_ABERTA');
        expect(result.value.assessment.timeLimitInMinutes).toBeUndefined();
        expect(result.value.assessment.quizPosition).toBeUndefined();
        expect(result.value.assessment.lessonId).toBeUndefined();
      }
    });

    it('generates correct slug from title with special characters', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Avaliação de Português - Acentuação e Ortografia',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 80,
        randomizeQuestions: false,
        randomizeOptions: true,
        lessonId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      };

      assessmentRepository.findByTitle.mockResolvedValueOnce(left(new Error('Not found')));
      assessmentRepository.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.slug).toBe('avaliacao-de-portugues-acentuacao-e-ortografia');
      }
    });
  });

  describe('Validation Errors', () => {
    it('fails when title is too short', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Ab',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Validation failed');
        expect(result.value.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['title'],
              message: 'Assessment title must be at least 3 characters long',
            }),
          ]),
        );
      }
    });

    it('fails when type is invalid', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Test Assessment',
        type: 'INVALID_TYPE' as any,
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['type'],
              message: 'Type must be QUIZ, SIMULADO or PROVA_ABERTA',
            }),
          ]),
        );
      }
    });

    it('fails when passingScore is below 0', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Test Assessment',
        type: 'PROVA_ABERTA',
        passingScore: -10,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['passingScore'],
              message: 'Passing score must be at least 0',
            }),
          ]),
        );
      }
    });

    it('fails when passingScore is above 100', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Test Assessment',
        type: 'PROVA_ABERTA',
        passingScore: 150,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['passingScore'],
              message: 'Passing score must be at most 100',
            }),
          ]),
        );
      }
    });

    it('fails when QUIZ type is missing quizPosition', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Quiz Test',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['quizPosition'],
              message: 'Quiz position is required for QUIZ type assessments',
            }),
          ]),
        );
      }
    });

    it('fails when QUIZ type is missing lessonId', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Quiz Test',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['lessonId'],
              message: 'Lesson ID is required for QUIZ type assessments',
            }),
          ]),
        );
      }
    });

    it('fails when non-QUIZ type has quizPosition', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Simulado Test',
        type: 'SIMULADO',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        timeLimitInMinutes: 60,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['quizPosition'],
              message: 'Quiz position can only be set for QUIZ type assessments',
            }),
          ]),
        );
      }
    });

    it('fails when non-QUIZ type has lessonId', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Prova Test',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['lessonId'],
              message: 'Lesson ID can only be set for QUIZ type assessments',
            }),
          ]),
        );
      }
    });

    it('fails when non-SIMULADO type has timeLimitInMinutes', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Quiz Test',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        timeLimitInMinutes: 60,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['timeLimitInMinutes'],
              message: 'Time limit can only be set for SIMULADO type assessments',
            }),
          ]),
        );
      }
    });

    it('fails when timeLimitInMinutes is zero or negative', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Simulado Test',
        type: 'SIMULADO',
        passingScore: 70,
        timeLimitInMinutes: 0,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['timeLimitInMinutes'],
              message: 'Time limit must be positive (minimum: 1)',
            }),
          ]),
        );
      }
    });

    it('fails when lessonId is invalid UUID', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Quiz Test',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: 'invalid-uuid',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['lessonId'],
              message: 'Lesson ID must be a valid UUID',
            }),
          ]),
        );
      }
    });

    it('fails with multiple validation errors', async () => {
      const request: CreateAssessmentRequest = {
        title: 'AB',
        type: 'INVALID_TYPE' as any,
        passingScore: 150,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.details).toHaveLength(3);
        expect(result.value.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['title'],
              message: 'Assessment title must be at least 3 characters long',
            }),
            expect.objectContaining({
              path: ['type'],
              message: 'Type must be QUIZ, SIMULADO or PROVA_ABERTA',
            }),
            expect.objectContaining({
              path: ['passingScore'],
              message: 'Passing score must be at most 100',
            }),
          ]),
        );
      }
    });
  });

  describe('Business Logic Errors', () => {
    it('fails when assessment with same title already exists', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Existing Assessment',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      const existingAssessment = Assessment.create({
        slug: 'existing-assessment',
        title: 'Existing Assessment',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepository.findByTitle.mockResolvedValueOnce(right(existingAssessment));

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(DuplicateAssessmentError);
        expect(result.value.message).toBe('Assessment with this title already exists');
      }
    });

    it('fails when title generates slug that is too short', async () => {
      const request: CreateAssessmentRequest = {
        title: '!@#',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      assessmentRepository.findByTitle.mockResolvedValueOnce(left(new Error('Not found')));

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Invalid title for slug generation');
        expect(result.value.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['title'],
              message: 'Title must be at least 3 characters long to generate a valid slug',
            }),
          ]),
        );
      }
    });
  });

  describe('Repository Errors', () => {
    it('fails when repository throws error during findByTitle', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Test Assessment',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      assessmentRepository.findByTitle.mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Database connection failed');
      }
    });

    it('fails when repository returns error during create', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Test Assessment',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      assessmentRepository.findByTitle.mockResolvedValueOnce(left(new Error('Not found')));
      assessmentRepository.create.mockResolvedValueOnce(left(new Error('Failed to create assessment')));

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to create assessment');
      }
    });

    it('fails when repository throws error during create', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Test Assessment',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      assessmentRepository.findByTitle.mockResolvedValueOnce(left(new Error('Not found')));
      assessmentRepository.create.mockRejectedValueOnce(new Error('Database constraint violation'));

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Database constraint violation');
      }
    });
  });

  describe('Edge Cases', () => {
    it('handles empty description correctly', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Assessment Without Description',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      assessmentRepository.findByTitle.mockResolvedValueOnce(left(new Error('Not found')));
      assessmentRepository.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.description).toBeUndefined();
      }
    });

    it('handles minimum valid passing score (0)', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Zero Pass Score Assessment',
        type: 'PROVA_ABERTA',
        passingScore: 0,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      assessmentRepository.findByTitle.mockResolvedValueOnce(left(new Error('Not found')));
      assessmentRepository.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.passingScore).toBe(0);
      }
    });

    it('handles maximum valid passing score (100)', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Max Pass Score Assessment',
        type: 'PROVA_ABERTA',
        passingScore: 100,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      assessmentRepository.findByTitle.mockResolvedValueOnce(left(new Error('Not found')));
      assessmentRepository.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.passingScore).toBe(100);
      }
    });

    it('handles SIMULADO with minimum valid time limit (1)', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Quick Simulado',
        type: 'SIMULADO',
        passingScore: 70,
        timeLimitInMinutes: 1,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      assessmentRepository.findByTitle.mockResolvedValueOnce(left(new Error('Not found')));
      assessmentRepository.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.timeLimitInMinutes).toBe(1);
      }
    });

    it('correctly calls repository with proper parameters', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Test Assessment',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      };

      assessmentRepository.findByTitle.mockResolvedValueOnce(left(new Error('Not found')));
      assessmentRepository.create.mockResolvedValueOnce(right(undefined));

      await useCase.execute(request);

      expect(assessmentRepository.findByTitle).toHaveBeenCalledWith('Test Assessment');
      expect(assessmentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            title: 'Test Assessment',
            type: 'PROVA_ABERTA',
            passingScore: 70,
            slug: 'test-assessment',
          }),
        }),
      );
    });
  });
});