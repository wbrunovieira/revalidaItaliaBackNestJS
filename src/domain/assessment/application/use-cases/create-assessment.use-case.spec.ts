import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Either, left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { CreateAssessmentUseCase } from './create-assessment.use-case';
import { CreateAssessmentRequest } from '../dtos/create-assessment-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { DuplicateAssessmentError } from './errors/duplicate-assessment-error';
import { RepositoryError } from './errors/repository-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { ILessonRepository } from '@/domain/course-catalog/application/repositories/i-lesson-repository';
import { LessonDependencyInfo } from '@/domain/course-catalog/application/dtos/lesson-dependencies.dto';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';

class MockAssessmentRepository implements IAssessmentRepository {
  findById = vi.fn();
  findByTitle = vi.fn();
  findByLessonId = vi.fn();
  create = vi.fn();
  findAll = vi.fn();

  findAllPaginated = vi.fn();
  update = vi.fn();
  delete = vi.fn();
  findByTitleExcludingId = vi.fn();
}

class MockLessonRepository implements ILessonRepository {
  checkLessonDependencies(
    _lessonId: string,
  ): Promise<Either<Error, LessonDependencyInfo>> {
    throw new Error('Method not implemented.');
  }
  findByModuleIdAndOrder(
    _moduleId: string,
    _order: number,
  ): Promise<Either<Error, Lesson | null>> {
    throw new Error('Method not implemented.');
  }
  findById = vi.fn();
  findAll = vi.fn();
  findByModuleId = vi.fn();
  findBySlug = vi.fn();
  create = vi.fn();
  update = vi.fn();
  delete = vi.fn();
  findByOrderAndModuleId = vi.fn();
}

describe('CreateAssessmentUseCase', () => {
  let useCase: CreateAssessmentUseCase;
  let assessmentRepo: MockAssessmentRepository;
  let lessonRepo: MockLessonRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    assessmentRepo = new MockAssessmentRepository();
    lessonRepo = new MockLessonRepository();
    useCase = new CreateAssessmentUseCase(assessmentRepo, lessonRepo);
  });

  describe('Success Cases', () => {
    const createSuccess = async (request: CreateAssessmentRequest) => {
      assessmentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      if (request.lessonId) {
        lessonRepo.findById.mockResolvedValueOnce(right({} as Lesson));
      }
      assessmentRepo.create.mockResolvedValueOnce(right(undefined));
      return useCase.execute(request);
    };

    it.each([
      [
        'creates QUIZ with lessonId',
        {
          title: 'Quiz A',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: true,
          randomizeOptions: false,
          lessonId: '11111111-1111-1111-1111-111111111111',
        },
      ],
      [
        'creates QUIZ without lessonId',
        {
          title: 'Quiz B',
          type: 'QUIZ',
          quizPosition: 'BEFORE_LESSON',
          passingScore: 75,
          randomizeQuestions: false,
          randomizeOptions: true,
        },
      ],
      [
        'creates SIMULADO without lessonId',
        {
          title: 'Simulado A',
          type: 'SIMULADO',
          passingScore: 60,
          timeLimitInMinutes: 120,
          randomizeQuestions: true,
          randomizeOptions: true,
        },
      ],
      [
        'creates SIMULADO with lessonId',
        {
          title: 'Simulado B',
          type: 'SIMULADO',
          passingScore: 65,
          timeLimitInMinutes: 90,
          randomizeQuestions: false,
          randomizeOptions: false,
          lessonId: '22222222-2222-2222-2222-222222222222',
        },
      ],
      [
        'creates PROVA_ABERTA without lessonId',
        {
          title: 'Prova A',
          type: 'PROVA_ABERTA',
          passingScore: 50,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
      ],
      [
        'creates PROVA_ABERTA with lessonId',
        {
          title: 'Prova B',
          type: 'PROVA_ABERTA',
          passingScore: 55,
          randomizeQuestions: false,
          randomizeOptions: true,
          lessonId: '33333333-3333-3333-3333-333333333333',
        },
      ],
    ])('%s', async (_name, req) => {
      const result = await createSuccess(req as CreateAssessmentRequest);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { assessment } = result.value;
        expect(assessment.type).toBe(req.type);
        expect(assessment.lessonId).toBe((req as any).lessonId ?? undefined);
      }
    });

    it('generates slug correctly from title with special chars', async () => {
      const request: CreateAssessmentRequest = {
        title: 'Título !@#%',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 80,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: '44444444-4444-4444-4444-444444444444',
      };
      const result = await createSuccess(request);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.slug).toBe('titulo');
      }
    });
  });

  describe('Validation Errors', () => {
    type ErrCase = [string, any, string[]];
    const cases: ErrCase[] = [
      [
        'title too short',
        {
          title: 'Ab',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
          lessonId: '5555-5555-5555-5555',
        },
        [
          'title: Assessment title must be at least 3 characters long',
          'lessonId: Lesson ID must be a valid UUID',
        ],
      ],
      [
        'invalid type',
        {
          title: 'Test',
          type: 'BAD',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        ['type: Type must be QUIZ, SIMULADO or PROVA_ABERTA'],
      ],
      [
        'passingScore out of range',
        {
          title: 'Test',
          type: 'PROVA_ABERTA',
          passingScore: 150,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        ['passingScore: Passing score must be at most 100'],
      ],
      [
        'missing quizPosition for QUIZ',
        {
          title: 'Test',
          type: 'QUIZ',
          passingScore: 80,
          randomizeQuestions: true,
          randomizeOptions: false,
        },
        ['quizPosition: Quiz position is required for QUIZ type assessments'],
      ],
      [
        'quizPosition on non-QUIZ',
        {
          title: 'Test',
          type: 'SIMULADO',
          quizPosition: 'BEFORE_LESSON',
          passingScore: 60,
          timeLimitInMinutes: 60,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        ['quizPosition: Quiz position is only allowed for QUIZ assessments'],
      ],
      [
        'timeLimit on non-SIMULADO',
        {
          title: 'Test',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          timeLimitInMinutes: 30,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        [
          'timeLimitInMinutes: Time limit can only be set for SIMULADO type assessments',
        ],
      ],
      [
        'zero timeLimit',
        {
          title: 'Test',
          type: 'SIMULADO',
          passingScore: 60,
          timeLimitInMinutes: 0,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        ['timeLimitInMinutes: Time limit must be positive (minimum: 1)'],
      ],
      [
        'negative passingScore',
        {
          title: 'Test',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: -10,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        ['passingScore: Passing score must be at least 0'],
      ],
    ];

    it.each(cases)('%s', async (_name, req, expected) => {
      const result = await useCase.execute(req as CreateAssessmentRequest);
      expect(result.isLeft()).toBe(true);
      if (result.isLeft() && result.value instanceof InvalidInputError) {
        const error = result.value;
        expected.forEach((msg) => expect(error.details).toContain(msg));
      }
    });
  });

  describe('Business Logic Errors', () => {
    it('duplicate title', async () => {
      const req: CreateAssessmentRequest = {
        title: 'Dup',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      };
      const existing = Assessment.create({
        slug: 'dup',
        title: 'Dup',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });
      assessmentRepo.findByTitle.mockResolvedValueOnce(right(existing));

      const result = await useCase.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(DuplicateAssessmentError);
    });

    it('slug too short after cleaning', async () => {
      assessmentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      const result = await useCase.execute({
        title: '!@#',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
      if (result.isLeft() && result.value instanceof InvalidInputError) {
        expect(result.value.message).toBe('Invalid title for slug generation');
      }
    });

    it('lesson not found', async () => {
      assessmentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      lessonRepo.findById.mockResolvedValueOnce(left(new Error('not found')));
      const result = await useCase.execute({
        title: 'Test',
        type: 'SIMULADO',
        passingScore: 60,
        timeLimitInMinutes: 90,
        randomizeQuestions: true,
        randomizeOptions: true,
        lessonId: '99999999-9999-9999-9999-999999999999',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(LessonNotFoundError);
    });
  });

  describe('Repository Errors', () => {
    it('throws on findByTitle', async () => {
      assessmentRepo.findByTitle.mockRejectedValueOnce(new Error('DB down'));
      const result = await useCase.execute({
        title: 'Test',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('error on create', async () => {
      assessmentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.create.mockResolvedValueOnce(left(new Error('fail')));
      const result = await useCase.execute({
        title: 'Test',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('throws on create', async () => {
      assessmentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.create.mockRejectedValueOnce(new Error('constraint'));
      const result = await useCase.execute({
        title: 'Test',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('throws on lesson repository findById', async () => {
      assessmentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      lessonRepo.findById.mockRejectedValueOnce(new Error('Lesson DB error'));
      const result = await useCase.execute({
        title: 'Test',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: '99999999-9999-9999-9999-999999999999',
      });
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) expect(result.value).toBeInstanceOf(RepositoryError);
    });
  });

  describe('Edge Cases', () => {
    it('empty description is undefined', async () => {
      assessmentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.create.mockResolvedValueOnce(right(undefined));
      const result = await useCase.execute({
        title: 'No Desc',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });
      expect(result.isRight()).toBe(true);
      if (result.isRight())
        expect(result.value.assessment.description).toBeUndefined();
    });

    it('minimum values', async () => {
      assessmentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.create.mockResolvedValueOnce(right(undefined));
      const result = await useCase.execute({
        title: 'Min',
        type: 'PROVA_ABERTA',
        passingScore: 0,
        randomizeQuestions: false,
        randomizeOptions: false,
      });
      expect(result.isRight()).toBe(true);
      if (result.isRight())
        expect(result.value.assessment.passingScore).toBe(0);
    });

    it('maximum values', async () => {
      assessmentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.create.mockResolvedValueOnce(right(undefined));
      const result = await useCase.execute({
        title: 'Max Values Test',
        type: 'SIMULADO',
        passingScore: 100,
        timeLimitInMinutes: 9999,
        randomizeQuestions: true,
        randomizeOptions: true,
      });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.passingScore).toBe(100);
        expect(result.value.assessment.timeLimitInMinutes).toBe(9999);
      }
    });

    it('PROVA_ABERTA without passingScore should succeed', async () => {
      assessmentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.create.mockResolvedValueOnce(right(undefined));
      const result = await useCase.execute({
        title: 'Prova Aberta Sem Passing Score',
        type: 'PROVA_ABERTA',
        randomizeQuestions: false,
        randomizeOptions: false,
      });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.type).toBe('PROVA_ABERTA');
        expect(result.value.assessment.passingScore).toBeUndefined();
      }
    });

    it('PROVA_ABERTA with only title and type should succeed', async () => {
      assessmentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.create.mockResolvedValueOnce(right(undefined));
      const result = await useCase.execute({
        title: 'Prova Dissertativa de Cardiologia 3',
        type: 'PROVA_ABERTA',
      });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.type).toBe('PROVA_ABERTA');
        expect(result.value.assessment.title).toBe('Prova Dissertativa de Cardiologia 3');
        expect(result.value.assessment.passingScore).toBeUndefined();
        expect(result.value.assessment.randomizeQuestions).toBeUndefined();
        expect(result.value.assessment.randomizeOptions).toBeUndefined();
        expect(result.value.assessment.description).toBeUndefined();
      }
    });

    it('PROVA_ABERTA with title, description and type should succeed', async () => {
      assessmentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.create.mockResolvedValueOnce(right(undefined));
      const result = await useCase.execute({
        title: 'Prova Dissertativa de Cardiologia 3',
        description: 'Avaliação com questões dissertativas sobre cardiologia',
        type: 'PROVA_ABERTA',
      });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.type).toBe('PROVA_ABERTA');
        expect(result.value.assessment.title).toBe('Prova Dissertativa de Cardiologia 3');
        expect(result.value.assessment.description).toBe('Avaliação com questões dissertativas sobre cardiologia');
        expect(result.value.assessment.passingScore).toBeUndefined();
        expect(result.value.assessment.randomizeQuestions).toBeUndefined();
        expect(result.value.assessment.randomizeOptions).toBeUndefined();
      }
    });

    it('QUIZ without passingScore should fail', async () => {
      const result = await useCase.execute({
        title: 'Quiz Sem Passing Score',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        randomizeQuestions: false,
        randomizeOptions: false,
      });
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        const error = result.value as InvalidInputError;
        expect(error.details).toContain(
          'passingScore: Passing score is required for QUIZ and SIMULADO assessments',
        );
      }
    });

    it('SIMULADO without passingScore should fail', async () => {
      const result = await useCase.execute({
        title: 'Simulado Sem Passing Score',
        type: 'SIMULADO',
        randomizeQuestions: false,
        randomizeOptions: false,
      });
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        const error = result.value as InvalidInputError;
        expect(error.details).toContain(
          'passingScore: Passing score is required for QUIZ and SIMULADO assessments',
        );
      }
    });

    it('long description', async () => {
      assessmentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.create.mockResolvedValueOnce(right(undefined));
      const longDescription = 'A'.repeat(1000);
      const result = await useCase.execute({
        title: 'Long Desc',
        description: longDescription,
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });
      expect(result.isRight()).toBe(true);
      if (result.isRight())
        expect(result.value.assessment.description).toBe(longDescription);
    });

    it('special characters in title generate valid slug', async () => {
      assessmentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.create.mockResolvedValueOnce(right(undefined));
      const result = await useCase.execute({
        title: 'Título com Acentos & Símbolos!',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.slug).toBe(
          'titulo-com-acentos-simbolos',
        );
      }
    });

    it('unicode characters in title', async () => {
      assessmentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.create.mockResolvedValueOnce(right(undefined));
      const result = await useCase.execute({
        title: 'Test 中文 العربية',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.slug).toBe('test');
      }
    });
  });
});
