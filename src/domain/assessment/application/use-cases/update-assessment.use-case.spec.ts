// src/domain/assessment/application/use-cases/update-assessment.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { left, right } from '@/core/either';
import { UpdateAssessmentUseCase } from '@/domain/assessment/application/use-cases/update-assessment.use-case';
import { IAssessmentRepository } from '@/domain/assessment/application/repositories/i-assessment-repository';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { DuplicateAssessmentError } from './errors/duplicate-assessment-error';

class MockAssessmentRepository implements IAssessmentRepository {
  findById = vi.fn();
  update = vi.fn();
  findByTitleExcludingId = vi.fn();
  create = vi.fn();
  delete = vi.fn();
  findAll = vi.fn();
  findAllPaginated = vi.fn();
  findByLessonId = vi.fn();
  findByTitle = vi.fn();
}

describe('UpdateAssessmentUseCase', () => {
  let useCase: UpdateAssessmentUseCase;
  let repository: MockAssessmentRepository;

  beforeEach(() => {
    repository = new MockAssessmentRepository();
    useCase = new UpdateAssessmentUseCase(repository);
  });

  it('should successfully update an assessment with all fields', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Old Title',
        slug: 'old-title',
        description: 'Old description',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.findByTitleExcludingId.mockResolvedValue(right(null)); // No duplicate found
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      title: 'New Title',
      description: 'New description',
      type: 'SIMULADO',
      passingScore: 80,
      timeLimitInMinutes: 60,
      randomizeQuestions: true,
      randomizeOptions: true,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.title).toBe('New Title');
      expect(result.value.assessment.slug).toBe('new-title');
      expect(result.value.assessment.description).toBe('New description');
      expect(result.value.assessment.type).toBe('SIMULADO');
      expect(result.value.assessment.passingScore).toBe(80);
      expect(result.value.assessment.timeLimitInMinutes).toBe(60);
      expect(result.value.assessment.randomizeQuestions).toBe(true);
      expect(result.value.assessment.randomizeOptions).toBe(true);
    }
  });

  it('should successfully update only the title', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Old Title',
        slug: 'old-title',
        description: 'Old description',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.findByTitleExcludingId.mockResolvedValue(right(null)); // No duplicate found
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      title: 'New Title',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.title).toBe('New Title');
      expect(result.value.assessment.slug).toBe('new-title');
    }
  });

  it('should return InvalidInputError for invalid UUID', async () => {
    const result = await useCase.execute({ id: 'invalid-uuid' });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
  });

  it('should return AssessmentNotFoundError if assessment does not exist', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174001';
    repository.findById.mockResolvedValue(left(new AssessmentNotFoundError()));

    const result = await useCase.execute({
      id: assessmentId,
      title: 'Any Title',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
  });

  it('should return DuplicateAssessmentError if title is already taken', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Old Title',
        slug: 'old-title',
        description: 'Old description',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    const otherAssessment = Assessment.create(
      {
        title: 'New Title',
        slug: 'new-title',
        description: 'Other description',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID('123e4567-e89b-12d3-a456-426614174001'),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.findByTitleExcludingId.mockResolvedValue(right(otherAssessment));

    const result = await useCase.execute({
      id: assessmentId,
      title: 'New Title',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(DuplicateAssessmentError);
  });

  it('should return RepositoryError on repository failure', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174002';
    const assessment = Assessment.create(
      {
        title: 'Test Assessment',
        slug: 'test-assessment',
        description: 'A test assessment',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.findByTitleExcludingId.mockResolvedValue(right(null)); // No duplicate found
    repository.update.mockRejectedValue(new RepositoryError('Database error'));

    const result = await useCase.execute({
      id: assessmentId,
      title: 'New Title',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(RepositoryError);
  });

  // --- Additional Success Cases (Partial Updates) ---
  it('should successfully update only the description', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        description: 'Old description',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      description: 'Updated description',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.description).toBe('Updated description');
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Updated description' }),
      );
    }
  });

  it('should successfully update only the type', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      type: 'SIMULADO',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.type).toBe('SIMULADO');
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SIMULADO' }),
      );
    }
  });

  it('should successfully update only randomizeQuestions and randomizeOptions', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      randomizeQuestions: true,
      randomizeOptions: true,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.randomizeQuestions).toBe(true);
      expect(result.value.assessment.randomizeOptions).toBe(true);
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          randomizeQuestions: true,
          randomizeOptions: true,
        }),
      );
    }
  });

  it('should successfully update lessonId', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const oldLessonId = 'old-lesson-id';
    const newLessonId = 'new-lesson-id';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: new UniqueEntityID(oldLessonId),
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      lessonId: newLessonId,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.lessonId?.toString()).toBe(newLessonId);
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({ lessonId: new UniqueEntityID(newLessonId) }),
      );
    }
  });

  // --- Unsetting Optional Fields with null ---
  it('should unset description when description is explicitly null', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        description: 'Existing description',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      description: null, // Changed from undefined to null
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.description).toBeUndefined();
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({ description: undefined }),
      );
    }
  });

  it('should unset quizPosition when quizPosition is explicitly null', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      quizPosition: null, // Changed from undefined to null
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.quizPosition).toBeUndefined();
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({ quizPosition: undefined }),
      );
    }
  });

  it('should unset timeLimitInMinutes when timeLimitInMinutes is explicitly null', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'SIMULADO',
        timeLimitInMinutes: 60,
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      timeLimitInMinutes: null, // Changed from undefined to null
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.timeLimitInMinutes).toBeUndefined();
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({ timeLimitInMinutes: undefined }),
      );
    }
  });

  it('should unset lessonId when lessonId is explicitly null', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: new UniqueEntityID('existing-lesson-id'),
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      lessonId: null, // Changed from undefined to null
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.lessonId).toBeUndefined();
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({ lessonId: undefined }),
      );
    }
  });

  // --- Test that undefined preserves existing values ---
  it('should NOT change description when description is undefined', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        description: 'Existing description',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      description: undefined,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.description).toBe('Existing description'); // Should remain unchanged
    }
  });

  it('should NOT change lessonId when lessonId is undefined', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const existingLessonId = 'existing-lesson-id';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: new UniqueEntityID(existingLessonId),
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      lessonId: undefined, // undefined should not change the existing value
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.lessonId?.toString()).toBe(
        existingLessonId,
      ); // Should remain unchanged
    }
  });

  it('should NOT change quizPosition when quizPosition is undefined', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      quizPosition: undefined, // undefined should not change the existing value
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.quizPosition).toBe('AFTER_LESSON'); // Should remain unchanged
    }
  });

  it('should NOT change timeLimitInMinutes when timeLimitInMinutes is undefined', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'SIMULADO',
        timeLimitInMinutes: 60,
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      timeLimitInMinutes: undefined, // undefined should not change the existing value
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.timeLimitInMinutes).toBe(60); // Should remain unchanged
    }
  });

  // --- Conditional Validation Logic ---
  it('should return InvalidInputError if quizPosition is provided for non-QUIZ type', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'SIMULADO', // Non-QUIZ type
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));

    const result = await useCase.execute({
      id: assessmentId,
      quizPosition: 'AFTER_LESSON',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    if (result.isLeft() && result.value instanceof InvalidInputError) {
      expect(result.value.details).toContain(
        'quizPosition: Quiz position can only be set for QUIZ type assessments',
      );
    }
  });

  it('should return InvalidInputError if timeLimitInMinutes is provided for non-SIMULADO type', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'QUIZ', // Non-SIMULADO type
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));

    const result = await useCase.execute({
      id: assessmentId,
      timeLimitInMinutes: 30,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    if (result.isLeft() && result.value instanceof InvalidInputError) {
      expect(result.value.details).toContain(
        'timeLimitInMinutes: Time limit can only be set for SIMULADO type assessments',
      );
    }
  });

  // --- Edge Cases for Values ---
  it('should handle passingScore at minimum boundary (0)', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      passingScore: 0,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.passingScore).toBe(0);
    }
  });

  it('should handle passingScore at maximum boundary (100)', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      passingScore: 100,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.passingScore).toBe(100);
    }
  });

  it('should return InvalidInputError if passingScore is below minimum (0)', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));

    const result = await useCase.execute({
      id: assessmentId,
      passingScore: -1,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    if (result.isLeft() && result.value instanceof InvalidInputError) {
      expect(result.value.details).toContain(
        'passingScore: Number must be greater than or equal to 0',
      );
    }
  });

  it('should return InvalidInputError if passingScore is above maximum (100)', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));

    const result = await useCase.execute({
      id: assessmentId,
      passingScore: 101,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    if (result.isLeft() && result.value instanceof InvalidInputError) {
      expect(result.value.details).toContain(
        'passingScore: Number must be less than or equal to 100',
      );
    }
  });

  it('should handle timeLimitInMinutes at minimum boundary (1)', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'SIMULADO',
        timeLimitInMinutes: 60,
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      timeLimitInMinutes: 1,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.timeLimitInMinutes).toBe(1);
    }
  });

  it('should return InvalidInputError if timeLimitInMinutes is below minimum (1)', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'SIMULADO',
        timeLimitInMinutes: 60,
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));

    const result = await useCase.execute({
      id: assessmentId,
      timeLimitInMinutes: 0,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    if (result.isLeft() && result.value instanceof InvalidInputError) {
      expect(result.value.details).toContain(
        'timeLimitInMinutes: Number must be greater than or equal to 1',
      );
    }
  });

  // --- No Changes Provided ---
  it('should succeed and update updatedAt when no fields are provided for update (only id)', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const initialUpdatedAt = new Date('2023-01-01T10:00:00.000Z');
    const assessment = Assessment.reconstruct(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        createdAt: new Date('2023-01-01T09:00:00.000Z'),
        updatedAt: initialUpdatedAt,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({ id: assessmentId });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      // Expect updatedAt to be updated
      expect(result.value.assessment.updatedAt.getTime()).toBeGreaterThan(
        initialUpdatedAt.getTime(),
      );
      // Expect no other fields to have changed from their initial state
      expect(result.value.assessment.title).toBe('Test Title');
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: new UniqueEntityID(assessmentId) }),
      );
    }
  });

  // --- Update title to its current value ---
  it('should not return DuplicateAssessmentError if title is updated to its current value', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const currentTitle = 'Existing Title';
    const assessment = Assessment.create(
      {
        title: currentTitle,
        slug: 'existing-title',
        description: 'Old description',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    // Mock findByTitleExcludingId to return null, as it should not find a duplicate
    repository.findByTitleExcludingId.mockResolvedValue(right(null));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      title: currentTitle, // Update to the same title
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.title).toBe(currentTitle);
      expect(repository.update).toHaveBeenCalled();
    }
  });

  // --- New Test Cases (from QA analysis) ---

  // Scenario: Change type from QUIZ to SIMULADO and provide timeLimitInMinutes
  it('should successfully update type from QUIZ to SIMULADO with timeLimitInMinutes', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Quiz Assessment',
        slug: 'quiz-assessment',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      type: 'SIMULADO',
      timeLimitInMinutes: 90,
      quizPosition: null, // Explicitly null to remove quizPosition
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.type).toBe('SIMULADO');
      expect(result.value.assessment.timeLimitInMinutes).toBe(90);
      expect(result.value.assessment.quizPosition).toBeUndefined();
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SIMULADO',
          timeLimitInMinutes: 90,
          quizPosition: undefined,
        }),
      );
    }
  });

  // Scenario: Change type from SIMULADO to QUIZ and provide quizPosition
  it('should successfully update type from SIMULADO to QUIZ with quizPosition', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Simulado Assessment',
        slug: 'simulado-assessment',
        type: 'SIMULADO',
        timeLimitInMinutes: 120,
        passingScore: 80,
        randomizeQuestions: true,
        randomizeOptions: true,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      type: 'QUIZ',
      quizPosition: 'BEFORE_LESSON',
      timeLimitInMinutes: null, // Explicitly null to remove timeLimitInMinutes
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.type).toBe('QUIZ');
      expect(result.value.assessment.quizPosition).toBe('BEFORE_LESSON');
      expect(result.value.assessment.timeLimitInMinutes).toBeUndefined();
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'QUIZ',
          quizPosition: 'BEFORE_LESSON',
          timeLimitInMinutes: undefined,
        }),
      );
    }
  });

  // Scenario: Change type from QUIZ to PROVA_ABERTA and ensure quizPosition is unset
  it('should successfully update type from QUIZ to PROVA_ABERTA and unset quizPosition', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Quiz Assessment',
        slug: 'quiz-assessment',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      type: 'PROVA_ABERTA',
      quizPosition: null, // Explicitly null to remove quizPosition
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.type).toBe('PROVA_ABERTA');
      expect(result.value.assessment.quizPosition).toBeUndefined();
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PROVA_ABERTA',
          quizPosition: undefined,
        }),
      );
    }
  });

  // Scenario: Change type from SIMULADO to PROVA_ABERTA and ensure timeLimitInMinutes is unset
  it('should successfully update type from SIMULADO to PROVA_ABERTA and unset timeLimitInMinutes', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Simulado Assessment',
        slug: 'simulado-assessment',
        type: 'SIMULADO',
        timeLimitInMinutes: 120,
        passingScore: 80,
        randomizeQuestions: true,
        randomizeOptions: true,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      type: 'PROVA_ABERTA',
      timeLimitInMinutes: null, // Explicitly null to remove timeLimitInMinutes
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.type).toBe('PROVA_ABERTA');
      expect(result.value.assessment.timeLimitInMinutes).toBeUndefined();
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PROVA_ABERTA',
          timeLimitInMinutes: undefined,
        }),
      );
    }
  });

  // Edge Case: Empty string for optional string fields (description)
  it('should allow updating description to an empty string', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        description: 'Old description',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      description: '',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.description).toBe('');
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({ description: '' }),
      );
    }
  });

  // Edge Case: Title with leading/trailing whitespace
  it('should trim whitespace from title and generate correct slug', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Old Title',
        slug: 'old-title',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.findByTitleExcludingId.mockResolvedValue(right(null));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      title: '  New Trimmed Title  ',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.title).toBe('New Trimmed Title');
      expect(result.value.assessment.slug).toBe('new-trimmed-title');
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Trimmed Title',
          slug: 'new-trimmed-title',
        }),
      );
    }
  });

  // Edge Case: Title that results in an empty slug (or very short slug)
  it('should return InvalidInputError if title results in an empty slug', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Old Title',
        slug: 'old-title',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));

    const result = await useCase.execute({
      id: assessmentId,
      title: '!@#$',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    if (result.isLeft() && result.value instanceof InvalidInputError) {
      expect(result.value.details).toContain(
        'title: String must contain at least 3 character(s)',
      ); // Assuming Zod validation catches this
    }
  });

  // Test that explicitly passing null removes the field
  it('should unset lessonId when lessonId is explicitly null', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
    const assessment = Assessment.create(
      {
        title: 'Test Title',
        slug: 'test-title',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: new UniqueEntityID('existing-lesson-id'),
      },
      new UniqueEntityID(assessmentId),
    );

    repository.findById.mockResolvedValue(right(assessment));
    repository.update.mockResolvedValue(right(undefined));

    const result = await useCase.execute({
      id: assessmentId,
      lessonId: null, // Explicitly set to null
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.assessment.lessonId).toBeUndefined();
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({ lessonId: undefined }),
      );
    }
  });
});
