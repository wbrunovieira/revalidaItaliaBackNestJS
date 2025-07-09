// src/domain/assessment/application/use-cases/create-assessment.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateAssessmentUseCase } from './create-assessment.use-case';
import { InMemoryAssessmentRepository } from '@/test/repositories/in-memory-assessment-repository';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { CreateAssessmentRequest } from '../dtos/create-assessment-request.dto';
import { DuplicateAssessmentError } from './errors/duplicate-assessment-error';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { left, right } from '@/core/either';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { textToSlug } from '@/core/utils/text-to-slug';

let assessmentRepo: InMemoryAssessmentRepository;
let lessonRepo: InMemoryLessonRepository;
let sut: CreateAssessmentUseCase;

describe('CreateAssessmentUseCase', () => {
  beforeEach(() => {
    assessmentRepo = new InMemoryAssessmentRepository();
    lessonRepo = new InMemoryLessonRepository();
    sut = new CreateAssessmentUseCase(assessmentRepo, lessonRepo);
    vi.spyOn(lessonRepo, 'findById').mockResolvedValue(right(Lesson.create({ moduleId: 'module-123', order: 1, translations: [{ locale: 'pt', title: 'Lesson Test', description: 'Test' }], flashcardIds: [], commentIds: [], slug: 'lesson-test' }, new UniqueEntityID('c9a0e0b0-0e0e-4e0e-8e0e-0e0e0e0e0e0e'))));
  });

  async function createMockLesson(lessonId: string) {
    const lesson = Lesson.create(
      {
        moduleId: 'module-123',
        order: 1,
        translations: [
          { locale: 'pt', title: 'Lesson Test', description: 'Test' },
        ],
        flashcardIds: [],
        commentIds: [],
        slug: 'lesson-test',
      },
      new UniqueEntityID(lessonId),
    );
    await lessonRepo.create(lesson);
  }

  function makeAssessmentRequest(
    overrides: Partial<CreateAssessmentRequest> = {},
  ): CreateAssessmentRequest {
    const baseRequest: CreateAssessmentRequest = {
      title: 'Default Assessment Title',
      description: 'Default description',
      type: 'QUIZ',
      passingScore: 70,
      randomizeQuestions: false,
      randomizeOptions: false,
    };

    let request: CreateAssessmentRequest;

    if (overrides.type === 'QUIZ' || !overrides.type) {
      request = {
        ...baseRequest,
        title: 'Quiz Básico de Matemática',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        lessonId: 'c9a0e0b0-0e0e-4e0e-8e0e-0e0e0e0e0e0e',
        ...overrides,
      };
    } else if (overrides.type === 'SIMULADO') {
      request = {
        ...baseRequest,
        title: 'Simulado ENEM',
        type: 'SIMULADO',
        timeLimitInMinutes: 180,
        randomizeQuestions: true,
        randomizeOptions: true,
        quizPosition: undefined, // Ensure these are undefined for SIMULADO
        lessonId: undefined, // Ensure these are undefined for SIMULADO
        ...overrides,
      };
    } else if (overrides.type === 'PROVA_ABERTA') {
      request = {
        ...baseRequest,
        title: 'Prova Aberta de Redação',
        type: 'PROVA_ABERTA',
        quizPosition: undefined, // Ensure these are undefined for PROVA_ABERTA
        lessonId: undefined, // Ensure these are undefined for PROVA_ABERTA
        ...overrides,
      };
    } else {
      request = { ...baseRequest, ...overrides } as CreateAssessmentRequest;
    }

    return request;
  }

  describe('Successful Assessment Creation', () => {
    it('creates a quiz assessment successfully', async () => {
      vi.spyOn(assessmentRepo, 'findByTitle').mockResolvedValueOnce(left(new Error('Assessment not found')));
      const req = makeAssessmentRequest({ type: 'QUIZ' });
      await createMockLesson('c9a0e0b0-0e0e-4e0e-8e0e-0e0e0e0e0e0e');

      const result = await sut.execute(req);
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const { assessment } = result.value;
        expect(assessment.id).toMatch(/[0-9a-fA-F\-]{36}/);
        expect(assessment.title).toBe('Quiz Básico de Matemática');
        expect(assessment.type).toBe('QUIZ');
        expect(assessment.quizPosition).toBe('AFTER_LESSON');
        expect(assessment.passingScore).toBe(70);
        expect(assessment.lessonId).toBe('c9a0e0b0-0e0e-4e0e-8e0e-0e0e0e0e0e0e');
        expect(assessmentRepo.items).toHaveLength(1);
      }
    });

    it('creates a simulado assessment successfully', async () => {
      vi.spyOn(assessmentRepo, 'findByTitle').mockResolvedValueOnce(left(new Error('Assessment not found')));
      const req = makeAssessmentRequest({ type: 'SIMULADO' });

      const result = await sut.execute(req);
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const { assessment } = result.value;
        expect(assessment.title).toBe('Simulado ENEM');
        expect(assessment.type).toBe('SIMULADO');
        expect(assessment.quizPosition).toBeUndefined();
        expect(assessment.timeLimitInMinutes).toBe(180);
        expect(assessment.randomizeQuestions).toBe(true);
        expect(assessment.lessonId).toBeUndefined();
        expect(assessmentRepo.items).toHaveLength(1);
      }
    });

    it('creates a prova aberta assessment successfully', async () => {
      vi.spyOn(assessmentRepo, 'findByTitle').mockResolvedValueOnce(left(new Error('Assessment not found')));
      const req = makeAssessmentRequest({ type: 'PROVA_ABERTA' });

      const result = await sut.execute(req);
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const { assessment } = result.value;
        expect(assessment.title).toBe('Prova Aberta de Redação');
        expect(assessment.type).toBe('PROVA_ABERTA');
        expect(assessment.quizPosition).toBeUndefined();
        expect(assessment.timeLimitInMinutes).toBeUndefined();
        expect(assessment.lessonId).toBeUndefined();
        expect(assessmentRepo.items).toHaveLength(1);
      }
    });

    it('allows simulado without time limit (warning, not error)', async () => {
      vi.spyOn(assessmentRepo, 'findByTitle').mockResolvedValueOnce(left(new Error('Assessment not found')));
      const req = makeAssessmentRequest({ type: 'SIMULADO', timeLimitInMinutes: undefined });

      const result = await sut.execute(req);
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const { assessment } = result.value;
        expect(assessment.timeLimitInMinutes).toBeUndefined();
      }
    });

    it('creates an assessment without description successfully', async () => {
      vi.spyOn(assessmentRepo, 'findByTitle').mockResolvedValueOnce(left(new Error('Assessment not found')));
      const req = makeAssessmentRequest({ description: undefined });
      await createMockLesson('c9a0e0b0-0e0e-4e0e-8e0e-0e0e0e0e0e0e');

      const result = await sut.execute(req);
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const { assessment } = result.value;
        expect(assessment.description).toBeUndefined();
        expect(assessmentRepo.items).toHaveLength(1);
      }
    });

    it('creates a quiz assessment with randomized questions and options successfully', async () => {
      vi.spyOn(assessmentRepo, 'findByTitle').mockResolvedValueOnce(left(new Error('Assessment not found')));
      const req = makeAssessmentRequest({ type: 'QUIZ', randomizeQuestions: true, randomizeOptions: true });
      await createMockLesson('c9a0e0b0-0e0e-4e0e-8e0e-0e0e0e0e0e0e');

      const result = await sut.execute(req);
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const { assessment } = result.value;
        expect(assessment.randomizeQuestions).toBe(true);
        expect(assessment.randomizeOptions).toBe(true);
      }
    });

    it('creates a simulado assessment with non-randomized questions and options successfully', async () => {
      vi.spyOn(assessmentRepo, 'findByTitle').mockResolvedValueOnce(left(new Error('Assessment not found')));
      const req = makeAssessmentRequest({ type: 'SIMULADO', randomizeQuestions: false, randomizeOptions: false });

      const result = await sut.execute(req);
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const { assessment } = result.value;
        expect(assessment.randomizeQuestions).toBe(false);
        expect(assessment.randomizeOptions).toBe(false);
      }
    });
  });

  describe('Validation Errors (InvalidInputError)', () => {
    beforeEach(async () => {
      // Ensure lesson exists for quiz-related validation tests
      await createMockLesson('c9a0e0b0-0e0e-4e0e-8e0e-0e0e0e0e0e0e');
    });

    it.each([
      {
        name: 'rejects when title is too short',
        request: makeAssessmentRequest({ title: 'AB' }),
        expectedDetail: 'title: Assessment title must be at least 3 characters long (minimum: 3)',
      },
      {
        name: 'rejects when passing score is invalid (too high)',
        request: makeAssessmentRequest({ passingScore: 150 }),
        expectedDetail: 'passingScore: Passing score must be at most 100 (maximum: 100)',
      },
      {
        name: 'rejects quiz without quiz position',
        request: makeAssessmentRequest({ type: 'QUIZ', quizPosition: undefined }),
        expectedDetail: 'quizPosition: Quiz position is required for QUIZ type assessments',
      },
      {
        name: 'rejects quiz without lesson id',
        request: makeAssessmentRequest({ type: 'QUIZ', lessonId: undefined }),
        expectedDetail: 'lessonId: Lesson ID is required for QUIZ type assessments',
      },
      {
        name: 'rejects non-quiz with quiz position',
        request: makeAssessmentRequest({ type: 'SIMULADO', quizPosition: 'AFTER_LESSON' as any }),
        expectedDetail: 'quizPosition: Quiz position can only be set for QUIZ type assessments',
      },
      {
        name: 'rejects non-quiz with lesson id',
        request: makeAssessmentRequest({ type: 'SIMULADO', lessonId: 'c9a0e0b0-0e0e-4e0e-8e0e-0e0e0e0e0e0e' }),
        expectedDetail: 'lessonId: Lesson ID can only be set for QUIZ type assessments',
      },
      {
        name: 'rejects non-simulado with time limit',
        request: makeAssessmentRequest({ type: 'QUIZ', timeLimitInMinutes: 60 }),
        expectedDetail: 'timeLimitInMinutes: Time limit can only be set for SIMULADO type assessments',
      },
      {
        name: 'validates invalid assessment type',
        request: makeAssessmentRequest({ type: 'INVALID_TYPE' as any }),
        expectedDetail: 'type: Type must be QUIZ, SIMULADO or PROVA_ABERTA',
      },
      {
        name: 'validates invalid UUID for lesson ID',
        request: makeAssessmentRequest({ type: 'QUIZ', lessonId: 'invalid-uuid' }),
        expectedDetail: 'lessonId: Lesson ID must be a valid UUID',
      },
    ])('$name', async ({ request, expectedDetail }) => {
      const result = await sut.execute(request);
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const err = result.value as InvalidInputError;
        expect(err).toBeInstanceOf(InvalidInputError);
        expect(err.message).toBe('Validation failed');
        expect(err.details).toContain(expectedDetail);
      }
    });
  });

  describe('Business Rule Errors', () => {
    it('rejects when lesson does not exist', async () => {
      const req = makeAssessmentRequest({ type: 'QUIZ', lessonId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' });
      // Don't add lesson to repository
      vi.spyOn(lessonRepo, 'findById').mockResolvedValueOnce(left(new LessonNotFoundError()));

      const result = await sut.execute(req);
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(LessonNotFoundError);
      }
    });

    it('rejects duplicate assessment title', async () => {
      const req = makeAssessmentRequest({ type: 'QUIZ' });
      await createMockLesson('c9a0e0b0-0e0e-4e0e-8e0e-0e0e0e0e0e0e');

      vi.spyOn(assessmentRepo, 'findByTitle').mockResolvedValueOnce(left(new Error('Not found')));
      await sut.execute(req); // First creation

      vi.spyOn(assessmentRepo, 'findByTitle').mockResolvedValueOnce(right(Assessment.create({ title: req.title, description: req.description, type: req.type, passingScore: req.passingScore, randomizeQuestions: req.randomizeQuestions ?? false, randomizeOptions: req.randomizeOptions ?? false, slug: textToSlug(req.title) })));
      const again = await sut.execute(req); // Duplicate creation

      expect(again.isLeft()).toBe(true);
      if (again.isLeft()) {
        expect(again.value).toBeInstanceOf(DuplicateAssessmentError);
      }
    });
  });

  describe('Repository and Infrastructure Errors', () => {
    beforeEach(() => {
      vi.spyOn(assessmentRepo, 'findByTitle').mockResolvedValue(left(new Error('Assessment not found')));
    });

    it('handles repository error on findByTitle', async () => {
      vi.spyOn(assessmentRepo, 'findByTitle').mockResolvedValueOnce(left(new RepositoryError('DB down')));
      const result = await sut.execute(makeAssessmentRequest());
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const err = result.value as RepositoryError;
        expect(err).toBeInstanceOf(RepositoryError);
        expect(err.message).toBe('DB down');
      }
    });

    it('handles repository error on lesson lookup', async () => {
      vi.spyOn(lessonRepo, 'findById').mockResolvedValueOnce(
        left(new RepositoryError('Lesson DB down')),
      );
      const req = makeAssessmentRequest({ type: 'QUIZ' });
      const result = await sut.execute(req);
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const err = result.value as RepositoryError;
        expect(err).toBeInstanceOf(RepositoryError);
        expect(err.message).toBe('Lesson DB down');
      }
    });

    it('handles Left returned by repository.create', async () => {
      vi.spyOn(assessmentRepo, 'create').mockResolvedValueOnce(
        left(new Error('Insert failed')) as any,
      );
      const result = await sut.execute(makeAssessmentRequest());
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const err = result.value as RepositoryError;
        expect(err).toBeInstanceOf(RepositoryError);
        expect(err.message).toBe('Insert failed');
      }
    });

    it('handles exception thrown by repository.create', async () => {
      vi.spyOn(assessmentRepo, 'create').mockImplementationOnce(() => {
        throw new Error('Create exception');
      });
      const result = await sut.execute(makeAssessmentRequest());
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const err = result.value as RepositoryError;
        expect(err).toBeInstanceOf(RepositoryError);
        expect(err.message).toBe('Create exception');
      }
    });
  });
});
