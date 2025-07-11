import { beforeEach, describe, expect, it, vi } from 'vitest';
import { left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { ListArgumentsUseCase } from './list-arguments.use-case';
import { InMemoryArgumentRepository } from '@/test/repositories/in-memory-argument-repository';
import { InMemoryAssessmentRepository } from '@/test/repositories/in-memory-assessment-repository';
import { Argument } from '@/domain/assessment/enterprise/entities/argument.entity';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { InvalidInputError } from './errors/invalid-input-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { RepositoryError } from './errors/repository-error';

describe('ListArgumentsUseCase', () => {
  let sut: ListArgumentsUseCase;
  let argumentRepo: InMemoryArgumentRepository;
  let assessmentRepo: InMemoryAssessmentRepository;

  const assessmentId = '550e8400-e29b-41d4-a716-446655440001';
  const anotherAssessmentId = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(async () => {
    argumentRepo = new InMemoryArgumentRepository();
    assessmentRepo = new InMemoryAssessmentRepository();
    sut = new ListArgumentsUseCase(argumentRepo, assessmentRepo);

    // Create an assessment for testing
    const assessment = Assessment.create(
      {
        slug: 'test-assessment',
        title: 'Test Assessment',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      new UniqueEntityID(assessmentId),
    );
    await assessmentRepo.create(assessment);

    // Create another assessment for testing
    const anotherAssessment = Assessment.create(
      {
        slug: 'another-assessment',
        title: 'Another Assessment',
        type: 'SIMULADO',
        passingScore: 80,
        randomizeQuestions: true,
        randomizeOptions: true,
      },
      new UniqueEntityID(anotherAssessmentId),
    );
    await assessmentRepo.create(anotherAssessment);
  });

  describe('✅ Success Cases', () => {
    it('should list all arguments with default pagination', async () => {
      // Create test arguments with a delay to ensure different timestamps
      const argument1 = Argument.create({
        title: 'Argument 1',
        assessmentId: new UniqueEntityID(assessmentId),
      });

      argumentRepo.items.push(argument1);

      // Add a small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const argument2 = Argument.create({
        title: 'Argument 2',
      });

      argumentRepo.items.push(argument2);

      const result = await sut.execute({});

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.arguments).toHaveLength(2);
        expect(result.value.pagination).toEqual({
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        });
        expect(result.value.arguments[0].title).toBe('Argument 2'); // Most recent first
        expect(result.value.arguments[1].title).toBe('Argument 1');
      }
    });

    it('should list arguments with custom pagination', async () => {
      // Create 15 test arguments
      for (let i = 1; i <= 15; i++) {
        const argument = Argument.create({
          title: `Argument ${i}`,
        });
        argumentRepo.items.push(argument);
      }

      const result = await sut.execute({ page: 2, limit: 5 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.arguments).toHaveLength(5);
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

    it('should filter arguments by assessmentId', async () => {
      const argumentWithAssessment = Argument.create({
        title: 'Argument with Assessment',
        assessmentId: new UniqueEntityID(assessmentId),
      });

      const argumentWithoutAssessment = Argument.create({
        title: 'Argument without Assessment',
      });

      const argumentWithAnotherAssessment = Argument.create({
        title: 'Argument with Another Assessment',
        assessmentId: new UniqueEntityID(anotherAssessmentId),
      });

      argumentRepo.items.push(
        argumentWithAssessment,
        argumentWithoutAssessment,
        argumentWithAnotherAssessment,
      );

      const result = await sut.execute({ assessmentId });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.arguments).toHaveLength(1);
        expect(result.value.arguments[0].title).toBe(
          'Argument with Assessment',
        );
        expect(result.value.arguments[0].assessmentId).toBe(assessmentId);
        expect(result.value.pagination.total).toBe(1);
      }
    });

    it('should return empty list when no arguments match filters', async () => {
      const argument = Argument.create({
        title: 'Test Argument',
      });

      argumentRepo.items.push(argument);

      const result = await sut.execute({ assessmentId });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.arguments).toHaveLength(0);
        expect(result.value.pagination.total).toBe(0);
        expect(result.value.pagination.totalPages).toBe(0);
      }
    });

    it('should return correct argument data structure', async () => {
      const argument = Argument.create({
        title: 'Complete Argument Test',
        assessmentId: new UniqueEntityID(assessmentId),
      });

      argumentRepo.items.push(argument);

      const result = await sut.execute({});

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const argumentDto = result.value.arguments[0];
        expect(argumentDto).toEqual({
          id: argument.id.toString(),
          title: 'Complete Argument Test',
          assessmentId: assessmentId,
          createdAt: argument.createdAt,
          updatedAt: argument.updatedAt,
        });
      }
    });

    it('should handle pagination correctly when on last page', async () => {
      // Create 8 arguments
      for (let i = 1; i <= 8; i++) {
        const argument = Argument.create({
          title: `Argument ${i}`,
        });
        argumentRepo.items.push(argument);
      }

      const result = await sut.execute({ page: 2, limit: 5 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.arguments).toHaveLength(3); // Last 3 items
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

    it('should return InvalidInputError for invalid UUID format in assessmentId', async () => {
      const result = await sut.execute({ assessmentId: 'invalid-uuid' });

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
    it('should return AssessmentNotFoundError when assessmentId does not exist', async () => {
      const nonExistentAssessmentId = '550e8400-e29b-41d4-a716-446655440999';

      const result = await sut.execute({
        assessmentId: nonExistentAssessmentId,
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
      }
    });

    it('should return RepositoryError when assessment repository fails', async () => {
      const errorMessage = 'Database connection failed';
      vi.spyOn(assessmentRepo, 'findById').mockResolvedValueOnce(
        left(new Error(errorMessage)),
      );

      const result = await sut.execute({ assessmentId });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
      }
    });

    it('should return RepositoryError when argument repository findByAssessmentId fails', async () => {
      const errorMessage = 'Database error in findByAssessmentId';
      vi.spyOn(argumentRepo, 'findByAssessmentId').mockResolvedValueOnce(
        left(new Error(errorMessage)),
      );

      const result = await sut.execute({ assessmentId });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe(errorMessage);
      }
    });

    it('should return RepositoryError when argument repository findAllPaginated fails', async () => {
      const errorMessage = 'Database error in findAllPaginated';
      vi.spyOn(argumentRepo, 'findAllPaginated').mockResolvedValueOnce(
        left(new Error(errorMessage)),
      );

      const result = await sut.execute({ page: 1, limit: 10 });

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

    it('should handle empty argument repository', async () => {
      const result = await sut.execute({});

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.arguments).toHaveLength(0);
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
      const argument = Argument.create({
        title: 'Single Argument',
      });

      argumentRepo.items.push(argument);

      const result = await sut.execute({ page: 5, limit: 10 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.arguments).toHaveLength(0);
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
      const oldArgument = Argument.create({
        title: 'Old Argument',
      });

      // Simulate time passing
      await new Promise((resolve) => setTimeout(resolve, 10));

      const newArgument = Argument.create({
        title: 'New Argument',
      });

      argumentRepo.items.push(oldArgument, newArgument);

      const result = await sut.execute({});

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.arguments[0].title).toBe('New Argument');
        expect(result.value.arguments[1].title).toBe('Old Argument');
      }
    });

    it('should handle arguments with optional fields correctly', async () => {
      const minimalArgument = Argument.create({
        title: 'Minimal Argument',
      });

      argumentRepo.items.push(minimalArgument);

      const result = await sut.execute({});

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const argumentDto = result.value.arguments[0];
        expect(argumentDto.assessmentId).toBeUndefined();
      }
    });

    it('should handle maximum limit value correctly', async () => {
      // Create more arguments than max limit
      for (let i = 1; i <= 150; i++) {
        const argument = Argument.create({
          title: `Argument ${i}`,
        });
        argumentRepo.items.push(argument);
      }

      const result = await sut.execute({ limit: 100 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.arguments).toHaveLength(100);
        expect(result.value.pagination.limit).toBe(100);
        expect(result.value.pagination.total).toBe(150);
        expect(result.value.pagination.totalPages).toBe(2);
      }
    });
  });

  describe('🔄 Complex Scenarios', () => {
    it('should handle complex filtering with pagination correctly', async () => {
      // Create arguments for different assessments
      for (let i = 1; i <= 20; i++) {
        const argument = Argument.create({
          title: `Argument ${i}`,
          assessmentId: i <= 10 ? new UniqueEntityID(assessmentId) : undefined,
        });
        argumentRepo.items.push(argument);
      }

      // Filter by assessment with pagination
      const result = await sut.execute({
        assessmentId,
        page: 1,
        limit: 3,
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.arguments).toHaveLength(3);
        expect(result.value.pagination.total).toBe(10); // 10 arguments in the assessment
        expect(result.value.pagination.totalPages).toBe(4);
        expect(
          result.value.arguments.every((a) => a.assessmentId === assessmentId),
        ).toBe(true);
      }
    });

    it('should properly calculate pagination for filtered results', async () => {
      // Create 50 arguments: 30 with assessment, 20 without
      for (let i = 1; i <= 50; i++) {
        const argument = Argument.create({
          title: `Argument ${i}`,
          assessmentId: i <= 30 ? new UniqueEntityID(assessmentId) : undefined,
        });
        argumentRepo.items.push(argument);
      }

      const result = await sut.execute({ assessmentId, page: 2, limit: 10 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.arguments).toHaveLength(10);
        expect(result.value.pagination.total).toBe(30);
        expect(result.value.pagination.totalPages).toBe(3);
        expect(result.value.pagination.page).toBe(2);
        expect(result.value.pagination.hasNext).toBe(true);
        expect(result.value.pagination.hasPrevious).toBe(true);
      }
    });

    it('should handle multiple arguments with same assessment correctly', async () => {
      // Create multiple arguments for the same assessment
      const argumentTitles = [
        'Introduction',
        'Main Argument',
        'Counter Argument',
        'Conclusion',
      ];

      for (const title of argumentTitles) {
        const argument = Argument.create({
          title,
          assessmentId: new UniqueEntityID(assessmentId),
        });
        argumentRepo.items.push(argument);
        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      const result = await sut.execute({ assessmentId });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.arguments).toHaveLength(4);
        expect(result.value.arguments[0].title).toBe('Conclusion'); // Most recent first
        expect(result.value.arguments[3].title).toBe('Introduction'); // Oldest last
        expect(result.value.pagination.total).toBe(4);
      }
    });
  });
});
