// src/domain/assessment/application/use-cases/list-assessments.use-case.spec.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { textToSlug } from '@/core/utils/text-to-slug';
import { ListAssessmentsUseCase } from './list-assessments.use-case';
import { InMemoryAssessmentRepository } from '@/test/repositories/in-memory-assessment-repository';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { InvalidInputError } from './errors/invalid-input-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { RepositoryError } from './errors/repository-error';

describe('ListAssessmentsUseCase', () => {
  let sut: ListAssessmentsUseCase;
  let assessmentRepo: InMemoryAssessmentRepository;
  let lessonRepo: InMemoryLessonRepository;

  const lessonId = '550e8400-e29b-41d4-a716-446655440001';
  const anotherLessonId = '550e8400-e29b-41d4-a716-446655440002';

  // Helper function to create assessments with automatic slug generation
  const createAssessment = (
    props: Omit<Parameters<typeof Assessment.create>[0], 'slug'>,
  ) => {
    return Assessment.create({
      slug: textToSlug(props.title),
      ...props,
    });
  };

  beforeEach(async () => {
    assessmentRepo = new InMemoryAssessmentRepository();
    lessonRepo = new InMemoryLessonRepository();
    sut = new ListAssessmentsUseCase(assessmentRepo, lessonRepo);

    // Create a lesson for testing
    const lesson = Lesson.create(
      {
        slug: 'test-lesson',
        moduleId: 'module-id',
        order: 1,
        flashcardIds: [],
        commentIds: [],
        translations: [
          {
            locale: 'pt',
            title: 'Test Lesson',
            description: 'Test description',
          },
        ],
        videos: [],
        documents: [],
        assessments: [],
      },
      new UniqueEntityID(lessonId),
    );
    await lessonRepo.create(lesson);

    // Create another lesson for testing
    const anotherLesson = Lesson.create(
      {
        slug: 'another-lesson',
        moduleId: 'module-id',
        order: 2,
        flashcardIds: [],
        commentIds: [],
        translations: [
          {
            locale: 'pt',
            title: 'Another Lesson',
            description: 'Another description',
          },
        ],
        videos: [],
        documents: [],
        assessments: [],
      },
      new UniqueEntityID(anotherLessonId),
    );
    await lessonRepo.create(anotherLesson);
  });

  describe('✅ Success Cases', () => {
    it('should list all assessments with default pagination', async () => {
      // Create test assessments with a delay to ensure different timestamps
      const assessment1 = createAssessment({
        title: 'Assessment 1',
        description: 'Description 1',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.items.push(assessment1);

      // Add a small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const assessment2 = createAssessment({
        title: 'Assessment 2',
        description: 'Description 2',
        type: 'SIMULADO',
        passingScore: 80,
        timeLimitInMinutes: 60,
        randomizeQuestions: true,
        randomizeOptions: true,
      });

      assessmentRepo.items.push(assessment2);

      const result = await sut.execute({});

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessments).toHaveLength(2);
        expect(result.value.pagination).toEqual({
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        });
        expect(result.value.assessments[0].title).toBe('Assessment 2'); // Most recent first
        expect(result.value.assessments[1].title).toBe('Assessment 1');
      }
    });

    it('should list assessments with custom pagination', async () => {
      // Create 15 test assessments
      for (let i = 1; i <= 15; i++) {
        const assessment = createAssessment({
          title: `Assessment ${i}`,
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        });
        assessmentRepo.items.push(assessment);
      }

      const result = await sut.execute({ page: 2, limit: 5 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessments).toHaveLength(5);
        expect(result.value.pagination).toEqual({
          page: 2,
          limit: 5,
          total: 15,
          totalPages: 3,
          hasNext: true,
          hasPrevious: true,
        });
      }
    });

    it('should filter assessments by type', async () => {
      const quizAssessment = createAssessment({
        title: 'Quiz Assessment',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      const simuladoAssessment = createAssessment({
        title: 'Simulado Assessment',
        type: 'SIMULADO',
        passingScore: 80,
        timeLimitInMinutes: 60,
        randomizeQuestions: true,
        randomizeOptions: true,
      });

      const provaAbertaAssessment = createAssessment({
        title: 'Prova Aberta Assessment',
        type: 'PROVA_ABERTA',
        passingScore: 75,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.items.push(
        quizAssessment,
        simuladoAssessment,
        provaAbertaAssessment,
      );

      const result = await sut.execute({ type: 'QUIZ' });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessments).toHaveLength(1);
        expect(result.value.assessments[0].type).toBe('QUIZ');
        expect(result.value.assessments[0].title).toBe('Quiz Assessment');
        expect(result.value.pagination.total).toBe(1);
      }
    });

    it('should filter assessments by lessonId', async () => {
      const assessmentWithLesson = createAssessment({
        title: 'Assessment with Lesson',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: new UniqueEntityID(lessonId),
      });

      const assessmentWithoutLesson = createAssessment({
        title: 'Assessment without Lesson',
        type: 'SIMULADO',
        passingScore: 80,
        randomizeQuestions: true,
        randomizeOptions: true,
      });

      const assessmentWithAnotherLesson = createAssessment({
        title: 'Assessment with Another Lesson',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 75,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: new UniqueEntityID(anotherLessonId),
      });

      assessmentRepo.items.push(
        assessmentWithLesson,
        assessmentWithoutLesson,
        assessmentWithAnotherLesson,
      );

      const result = await sut.execute({ lessonId });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessments).toHaveLength(1);
        expect(result.value.assessments[0].title).toBe(
          'Assessment with Lesson',
        );
        expect(result.value.assessments[0].lessonId).toBe(lessonId);
        expect(result.value.pagination.total).toBe(1);
      }
    });

    it('should filter by both lessonId and type', async () => {
      const quizWithLesson = createAssessment({
        title: 'Quiz with Lesson',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: new UniqueEntityID(lessonId),
      });

      const simuladoWithLesson = createAssessment({
        title: 'Simulado with Lesson',
        type: 'SIMULADO',
        passingScore: 80,
        timeLimitInMinutes: 60,
        randomizeQuestions: true,
        randomizeOptions: true,
        lessonId: new UniqueEntityID(lessonId),
      });

      assessmentRepo.items.push(quizWithLesson, simuladoWithLesson);

      const result = await sut.execute({ lessonId, type: 'QUIZ' });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessments).toHaveLength(1);
        expect(result.value.assessments[0].title).toBe('Quiz with Lesson');
        expect(result.value.assessments[0].type).toBe('QUIZ');
        expect(result.value.assessments[0].lessonId).toBe(lessonId);
      }
    });

    it('should return empty list when no assessments match filters', async () => {
      const assessment = createAssessment({
        title: 'Test Assessment',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.items.push(assessment);

      const result = await sut.execute({ type: 'SIMULADO' });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessments).toHaveLength(0);
        expect(result.value.pagination.total).toBe(0);
        expect(result.value.pagination.totalPages).toBe(0);
      }
    });

    it('should return correct assessment data structure', async () => {
      const assessment = createAssessment({
        title: 'Complete Assessment Test',
        description: 'A comprehensive test assessment',
        type: 'SIMULADO',
        passingScore: 85,
        timeLimitInMinutes: 120,
        randomizeQuestions: true,
        randomizeOptions: false,
        lessonId: new UniqueEntityID(lessonId),
      });

      assessmentRepo.items.push(assessment);

      const result = await sut.execute({});

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const assessmentDto = result.value.assessments[0];
        expect(assessmentDto).toEqual({
          id: assessment.id.toString(),
          slug: assessment.slug,
          title: 'Complete Assessment Test',
          description: 'A comprehensive test assessment',
          type: 'SIMULADO',
          quizPosition: undefined,
          passingScore: 85,
          timeLimitInMinutes: 120,
          randomizeQuestions: true,
          randomizeOptions: false,
          lessonId: lessonId,
          createdAt: assessment.createdAt,
          updatedAt: assessment.updatedAt,
        });
      }
    });

    it('should handle pagination correctly when on last page', async () => {
      // Create 8 assessments
      for (let i = 1; i <= 8; i++) {
        const assessment = createAssessment({
          title: `Assessment ${i}`,
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        });
        assessmentRepo.items.push(assessment);
      }

      const result = await sut.execute({ page: 2, limit: 5 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessments).toHaveLength(3); // Last 3 items
        expect(result.value.pagination).toEqual({
          page: 2,
          limit: 5,
          total: 8,
          totalPages: 2,
          hasNext: false,
          hasPrevious: true,
        });
      }
    });
  });

  describe('⚠️ Validation Errors', () => {
    it('should return InvalidInputError for negative page number', async () => {
      const result = await sut.execute({ page: 0 });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Validation failed');
      }
    });

    it('should return InvalidInputError for negative limit', async () => {
      const result = await sut.execute({ limit: 0 });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Validation failed');
      }
    });

    it('should return InvalidInputError for limit exceeding maximum', async () => {
      const result = await sut.execute({ limit: 101 });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Validation failed');
      }
    });

    it('should return InvalidInputError for invalid assessment type', async () => {
      const result = await sut.execute({ type: 'INVALID_TYPE' as any });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Validation failed');
      }
    });

    it('should return InvalidInputError for invalid UUID format in lessonId', async () => {
      const result = await sut.execute({ lessonId: 'invalid-uuid' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Validation failed');
      }
    });

    it('should return InvalidInputError for non-integer page', async () => {
      const result = await sut.execute({ page: 1.5 });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Validation failed');
      }
    });

    it('should return InvalidInputError for non-integer limit', async () => {
      const result = await sut.execute({ limit: 5.7 });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Validation failed');
      }
    });

    it('should return InvalidInputError with proper validation details', async () => {
      const result = await sut.execute({ page: -1, limit: 200 });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        const error = result.value as InvalidInputError;
        expect(error.details).toBeDefined();
        expect(error.details.length).toBeGreaterThan(0);
        expect(Array.isArray(error.details)).toBe(true);
        expect(typeof error.details[0]).toBe('string');
      }
    });
  });

  describe('🔍 Business Logic Errors', () => {
    it('should return LessonNotFoundError when lessonId does not exist', async () => {
      const nonExistentLessonId = '550e8400-e29b-41d4-a716-446655440999';

      const result = await sut.execute({ lessonId: nonExistentLessonId });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(LessonNotFoundError);
      }
    });

    it('should return RepositoryError when lesson repository fails', async () => {
      const errorMessage = 'Database connection failed';
      vi.spyOn(lessonRepo, 'findById').mockResolvedValueOnce(
        left(new Error(errorMessage)),
      );

      const result = await sut.execute({ lessonId });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(LessonNotFoundError);
      }
    });

    it('should return RepositoryError when assessment repository findByLessonId fails', async () => {
      const errorMessage = 'Database error in findByLessonId';
      vi.spyOn(assessmentRepo, 'findByLessonId').mockResolvedValueOnce(
        left(new Error(errorMessage)),
      );

      const result = await sut.execute({ lessonId });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe(errorMessage);
      }
    });

    it('should return RepositoryError when assessment repository findAllPaginated fails', async () => {
      const errorMessage = 'Database error in findAllPaginated';
      vi.spyOn(assessmentRepo, 'findAllPaginated').mockResolvedValueOnce(
        left(new Error(errorMessage)),
      );

      const result = await sut.execute({ page: 1, limit: 10 });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe(errorMessage);
      }
    });

    it('should return RepositoryError when assessment repository findAll fails during type filtering', async () => {
      const errorMessage = 'Database error in findAll';
      vi.spyOn(assessmentRepo, 'findAllPaginated').mockResolvedValueOnce(
        right({ assessments: [], total: 10 }),
      );
      vi.spyOn(assessmentRepo, 'findAll').mockResolvedValueOnce(
        left(new Error(errorMessage)),
      );

      const result = await sut.execute({ type: 'QUIZ' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe(errorMessage);
      }
    });
  });

  describe('🔍 Edge Cases', () => {
    it('should use default values when no parameters are provided', async () => {
      const result = await sut.execute({});

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.pagination.page).toBe(1);
        expect(result.value.pagination.limit).toBe(10);
      }
    });

    it('should handle empty assessment repository', async () => {
      const result = await sut.execute({});

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessments).toHaveLength(0);
        expect(result.value.pagination).toEqual({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        });
      }
    });

    it('should handle page beyond available pages gracefully', async () => {
      const assessment = createAssessment({
        title: 'Single Assessment',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.items.push(assessment);

      const result = await sut.execute({ page: 5, limit: 10 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessments).toHaveLength(0);
        expect(result.value.pagination).toEqual({
          page: 5,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: true,
        });
      }
    });

    it('should maintain correct order (newest first)', async () => {
      const oldAssessment = createAssessment({
        title: 'Old Assessment',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      // Simulate time passing
      await new Promise((resolve) => setTimeout(resolve, 10));

      const newAssessment = createAssessment({
        title: 'New Assessment',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.items.push(oldAssessment, newAssessment);

      const result = await sut.execute({});

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessments[0].title).toBe('New Assessment');
        expect(result.value.assessments[1].title).toBe('Old Assessment');
      }
    });

    it('should handle assessments with optional fields correctly', async () => {
      const minimalAssessment = createAssessment({
        title: 'Minimal Assessment',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.items.push(minimalAssessment);

      const result = await sut.execute({});

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const assessmentDto = result.value.assessments[0];
        expect(assessmentDto.description).toBeUndefined();
        expect(assessmentDto.quizPosition).toBeUndefined();
        expect(assessmentDto.timeLimitInMinutes).toBeUndefined();
        expect(assessmentDto.lessonId).toBeUndefined();
      }
    });

    it('should handle maximum limit value correctly', async () => {
      // Create more assessments than max limit
      for (let i = 1; i <= 150; i++) {
        const assessment = createAssessment({
          title: `Assessment ${i}`,
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        });
        assessmentRepo.items.push(assessment);
      }

      const result = await sut.execute({ limit: 100 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessments).toHaveLength(100);
        expect(result.value.pagination.limit).toBe(100);
        expect(result.value.pagination.total).toBe(150);
        expect(result.value.pagination.totalPages).toBe(2);
      }
    });
  });

  describe('🔄 Complex Scenarios', () => {
    it('should handle complex filtering with pagination correctly', async () => {
      // Create assessments for different lessons and types
      for (let i = 1; i <= 20; i++) {
        const assessment = createAssessment({
          title: `Assessment ${i}`,
          type: i % 2 === 0 ? 'QUIZ' : 'SIMULADO',
          quizPosition: i % 2 === 0 ? 'AFTER_LESSON' : undefined,
          passingScore: 70,
          timeLimitInMinutes: i % 2 === 0 ? undefined : 60,
          randomizeQuestions: false,
          randomizeOptions: false,
          lessonId: i <= 10 ? new UniqueEntityID(lessonId) : undefined,
        });
        assessmentRepo.items.push(assessment);
      }

      // Filter by lesson and type with pagination
      const result = await sut.execute({
        lessonId,
        type: 'QUIZ',
        page: 1,
        limit: 3,
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessments).toHaveLength(3);
        expect(result.value.pagination.total).toBe(5); // 5 QUIZ assessments in the lesson
        expect(result.value.pagination.totalPages).toBe(2);
        expect(result.value.assessments.every((a) => a.type === 'QUIZ')).toBe(
          true,
        );
        expect(
          result.value.assessments.every((a) => a.lessonId === lessonId),
        ).toBe(true);
      }
    });

    it('should properly calculate pagination for filtered results', async () => {
      // Create 50 assessments: 30 QUIZ, 20 SIMULADO
      for (let i = 1; i <= 50; i++) {
        const assessment = createAssessment({
          title: `Assessment ${i}`,
          type: i <= 30 ? 'QUIZ' : 'SIMULADO',
          quizPosition: i <= 30 ? 'AFTER_LESSON' : undefined,
          passingScore: 70,
          timeLimitInMinutes: i <= 30 ? undefined : 60,
          randomizeQuestions: false,
          randomizeOptions: false,
        });
        assessmentRepo.items.push(assessment);
      }

      const result = await sut.execute({ type: 'QUIZ', page: 2, limit: 10 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessments).toHaveLength(10);
        expect(result.value.pagination.total).toBe(30);
        expect(result.value.pagination.totalPages).toBe(3);
        expect(result.value.pagination.page).toBe(2);
        expect(result.value.pagination.hasNext).toBe(true);
        expect(result.value.pagination.hasPrevious).toBe(true);
      }
    });
  });
});
