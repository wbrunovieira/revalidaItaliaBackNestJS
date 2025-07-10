// src/domain/assessment/application/use-cases/delete-assessment.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { left, right } from '@/core/either';
import { DeleteAssessmentUseCase } from '@/domain/assessment/application/use-cases/delete-assessment.use-case';
import { IAssessmentRepository } from '@/domain/assessment/application/repositories/i-assessment-repository';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

class MockAssessmentRepository implements IAssessmentRepository {
  findById = vi.fn();
  delete = vi.fn();
  create = vi.fn();
  findAll = vi.fn();
  findAllPaginated = vi.fn();
  findByLessonId = vi.fn();
  findByTitle = vi.fn();
  findByTitleExcludingId = vi.fn();
  update = vi.fn();
}

describe('DeleteAssessmentUseCase', () => {
  let useCase: DeleteAssessmentUseCase;
  let repository: MockAssessmentRepository;

  beforeEach(() => {
    repository = new MockAssessmentRepository();
    useCase = new DeleteAssessmentUseCase(repository);
  });

  it('should successfully delete an assessment', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174000';
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
    repository.delete.mockResolvedValue(right(undefined));

    const result = await useCase.execute({ id: assessmentId });

    expect(result.isRight()).toBe(true);
    expect(repository.findById).toHaveBeenCalledWith(assessmentId);
    expect(repository.delete).toHaveBeenCalledWith(assessmentId);
  });

  it('should return InvalidInputError for invalid UUID', async () => {
    const result = await useCase.execute({ id: 'invalid-uuid' });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
  });

  it('should return AssessmentNotFoundError if assessment does not exist', async () => {
    const assessmentId = '123e4567-e89b-12d3-a456-426614174001';
    repository.findById.mockResolvedValue(left(new AssessmentNotFoundError()));

    const result = await useCase.execute({ id: assessmentId });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
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
    repository.delete.mockRejectedValue(new Error('Database error'));

    const result = await useCase.execute({ id: assessmentId });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(RepositoryError);
  });
});
