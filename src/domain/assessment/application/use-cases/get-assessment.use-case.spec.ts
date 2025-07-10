// src/domain/assessment/application/use-cases/get-assessment.use-case.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GetAssessmentUseCase } from './get-assessment.use-case';
import { InMemoryAssessmentRepository } from '@/test/repositories/in-memory-assessment-repository';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { InvalidInputError } from './errors/invalid-input-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { textToSlug } from '@/core/utils/text-to-slug';
import { GetAssessmentRequest } from '../dtos/get-assessment-request.dto';

describe('GetAssessmentUseCase', () => {
  let useCase: GetAssessmentUseCase;
  let assessmentRepository: InMemoryAssessmentRepository;

  beforeEach(() => {
    assessmentRepository = new InMemoryAssessmentRepository();
    useCase = new GetAssessmentUseCase(assessmentRepository);
  });

  const createTestAssessment = (overrides: Partial<any> = {}) => {
    const title = overrides.title || 'JavaScript Fundamentals Quiz';
    const assessment = Assessment.create(
      {
        title,
        slug: textToSlug(title),
        description: overrides.hasOwnProperty('description') ? overrides.description : 'Test your knowledge of JavaScript basics',
        type: overrides.type || 'QUIZ',
        quizPosition: overrides.quizPosition !== undefined ? overrides.quizPosition : (overrides.type === 'QUIZ' ? 'AFTER_LESSON' : undefined),
        passingScore: overrides.passingScore !== undefined ? overrides.passingScore : 70,
        timeLimitInMinutes: overrides.timeLimitInMinutes,
        randomizeQuestions: overrides.randomizeQuestions ?? false,
        randomizeOptions: overrides.randomizeOptions ?? false,
        lessonId: overrides.lessonId ? new UniqueEntityID(overrides.lessonId) : undefined,
      },
      overrides.id ? new UniqueEntityID(overrides.id) : undefined,
    );
    
    // If specific dates are provided, we need to update them manually after creation
    if (overrides.createdAt || overrides.updatedAt) {
      // Access private props to override dates for testing
      (assessment as any).props.createdAt = overrides.createdAt || assessment.createdAt;
      (assessment as any).props.updatedAt = overrides.updatedAt || assessment.updatedAt;
    }
    
    return assessment;
  };

  describe('✅ Success Cases', () => {
    it('should return assessment when found with complete data', async () => {
      const assessmentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const lessonId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      
      const assessment = createTestAssessment({
        id: assessmentId,
        title: 'Complete JavaScript Quiz',
        description: 'Comprehensive JavaScript assessment',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 85,
        randomizeQuestions: true,
        randomizeOptions: true,
        lessonId,
      });

      await assessmentRepository.create(assessment);

      const request: GetAssessmentRequest = { id: assessmentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment).toEqual({
          id: assessmentId,
          slug: 'complete-javascript-quiz',
          title: 'Complete JavaScript Quiz',
          description: 'Comprehensive JavaScript assessment',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 85,
          timeLimitInMinutes: undefined,
          randomizeQuestions: true,
          randomizeOptions: true,
          lessonId,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      }
    });

    it('should return SIMULADO assessment with time limit', async () => {
      const assessmentId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
      
      const assessment = createTestAssessment({
        id: assessmentId,
        title: 'Programming Simulation',
        description: 'Comprehensive programming simulation exam',
        type: 'SIMULADO',
        quizPosition: undefined,
        passingScore: 80,
        timeLimitInMinutes: 120,
        randomizeQuestions: true,
        randomizeOptions: true,
      });

      await assessmentRepository.create(assessment);

      const request: GetAssessmentRequest = { id: assessmentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment).toEqual({
          id: assessmentId,
          slug: 'programming-simulation',
          title: 'Programming Simulation',
          description: 'Comprehensive programming simulation exam',
          type: 'SIMULADO',
          quizPosition: undefined,
          passingScore: 80,
          timeLimitInMinutes: 120,
          randomizeQuestions: true,
          randomizeOptions: true,
          lessonId: undefined,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      }
    });

    it('should return PROVA_ABERTA assessment without optional fields', async () => {
      const assessmentId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
      
      const assessment = createTestAssessment({
        id: assessmentId,
        title: 'Advanced Programming Essay',
        type: 'PROVA_ABERTA',
        quizPosition: undefined,
        passingScore: 75,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      await assessmentRepository.create(assessment);

      const request: GetAssessmentRequest = { id: assessmentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment).toEqual({
          id: assessmentId,
          slug: 'advanced-programming-essay',
          title: 'Advanced Programming Essay',
          description: 'Test your knowledge of JavaScript basics',
          type: 'PROVA_ABERTA',
          quizPosition: undefined,
          passingScore: 75,
          timeLimitInMinutes: undefined,
          randomizeQuestions: false,
          randomizeOptions: false,
          lessonId: undefined,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      }
    });

    it('should return assessment without description', async () => {
      const assessmentId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
      
      const assessment = createTestAssessment({
        id: assessmentId,
        title: 'Minimal Quiz',
        description: undefined,
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 60,
        randomizeQuestions: false,
        randomizeOptions: true,
      });

      await assessmentRepository.create(assessment);

      const request: GetAssessmentRequest = { id: assessmentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.description).toBeUndefined();
        expect(result.value.assessment.title).toBe('Minimal Quiz');
        expect(result.value.assessment.quizPosition).toBe('BEFORE_LESSON');
      }
    });

    it('should return assessment with minimum passing score', async () => {
      const assessmentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      
      const assessment = createTestAssessment({
        id: assessmentId,
        title: 'Diagnostic Assessment',
        passingScore: 0,
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
      });

      await assessmentRepository.create(assessment);

      const request: GetAssessmentRequest = { id: assessmentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.passingScore).toBe(0);
      }
    });

    it('should return assessment with maximum passing score', async () => {
      const assessmentId = '11111111-1111-1111-1111-111111111111';
      
      const assessment = createTestAssessment({
        id: assessmentId,
        title: 'Perfect Score Assessment',
        passingScore: 100,
        type: 'PROVA_ABERTA',
      });

      await assessmentRepository.create(assessment);

      const request: GetAssessmentRequest = { id: assessmentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.passingScore).toBe(100);
      }
    });

    it('should return assessment with special characters in title', async () => {
      const assessmentId = '22222222-2222-2222-2222-222222222222';
      
      const assessment = createTestAssessment({
        id: assessmentId,
        title: 'Avaliação de Programação & Lógica!',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
      });

      await assessmentRepository.create(assessment);

      const request: GetAssessmentRequest = { id: assessmentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.title).toBe('Avaliação de Programação & Lógica!');
        expect(result.value.assessment.slug).toBe('avaliacao-de-programacao-logica');
      }
    });

    it('should return SIMULADO with minimum time limit', async () => {
      const assessmentId = '33333333-3333-3333-3333-333333333333';
      
      const assessment = createTestAssessment({
        id: assessmentId,
        title: 'Quick Simulation',
        type: 'SIMULADO',
        passingScore: 70,
        timeLimitInMinutes: 1,
      });

      await assessmentRepository.create(assessment);

      const request: GetAssessmentRequest = { id: assessmentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.timeLimitInMinutes).toBe(1);
        expect(result.value.assessment.type).toBe('SIMULADO');
      }
    });
  });

  describe('⚠️ Validation Errors', () => {
    it('should return InvalidInputError for invalid UUID format', async () => {
      const request: GetAssessmentRequest = { id: 'invalid-uuid' };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Validation failed');
        expect((result.value as InvalidInputError).details).toEqual(['id: ID must be a valid UUID']);
      }
    });

    it('should return InvalidInputError for empty string ID', async () => {
      const request: GetAssessmentRequest = { id: '' };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect((result.value as InvalidInputError).details[0]).toContain('ID must be a valid UUID');
      }
    });

    it('should return InvalidInputError for null ID', async () => {
      const request = { id: null } as any;
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for undefined ID', async () => {
      const request = { id: undefined } as any;
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for missing ID field', async () => {
      const request = {} as any;
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for extra fields', async () => {
      const request = { 
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        extraField: 'not allowed'
      } as any;
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for non-string ID', async () => {
      const request = { id: 123 } as any;
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });

  describe('🔍 Business Logic Errors', () => {
    it('should return AssessmentNotFoundError when assessment does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const request: GetAssessmentRequest = { id: nonExistentId };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
        expect(result.value.message).toBe('Assessment not found');
      }
    });

    it('should return AssessmentNotFoundError for deleted assessment', async () => {
      const assessmentId = '11111111-1111-1111-1111-111111111111';
      
      const assessment = createTestAssessment({
        id: assessmentId,
        title: 'Assessment to be deleted',
      });

      await assessmentRepository.create(assessment);
      await assessmentRepository.delete(assessmentId);

      const request: GetAssessmentRequest = { id: assessmentId };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
      }
    });

    it('should handle repository returning left error correctly', async () => {
      // Mock repository to return left error
      const originalFindById = assessmentRepository.findById;
      assessmentRepository.findById = async () => {
        return { isLeft: () => true, isRight: () => false } as any;
      };

      const request: GetAssessmentRequest = { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
      }

      // Restore original method
      assessmentRepository.findById = originalFindById;
    });
  });

  describe('💥 Repository Errors', () => {
    it('should return RepositoryError when repository throws exception', async () => {
      // Mock repository to throw an error
      assessmentRepository.findById = async () => {
        throw new Error('Database connection failed');
      };

      const request: GetAssessmentRequest = { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Database connection failed');
      }
    });

    it('should return RepositoryError with generic message on unknown error', async () => {
      // Mock repository to throw an error without message
      assessmentRepository.findById = async () => {
        throw new Error();
      };

      const request: GetAssessmentRequest = { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
      }
    });

    it('should return RepositoryError when repository throws non-Error object', async () => {
      // Mock repository to throw a non-Error object
      assessmentRepository.findById = async () => {
        throw 'String error';
      };

      const request: GetAssessmentRequest = { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
      }
    });
  });

  describe('🔧 Edge Cases', () => {
    it('should handle UUID with different casing', async () => {
      const assessmentId = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA';
      
      const assessment = createTestAssessment({
        id: assessmentId.toLowerCase(),
        title: 'Case Test Assessment',
      });

      await assessmentRepository.create(assessment);

      const request: GetAssessmentRequest = { id: assessmentId };
      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
      }
    });

    it('should handle very long assessment title', async () => {
      const assessmentId = '11111111-1111-1111-1111-111111111111';
      const longTitle = 'A'.repeat(255);
      
      const assessment = createTestAssessment({
        id: assessmentId,
        title: longTitle,
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
      });

      await assessmentRepository.create(assessment);

      const request: GetAssessmentRequest = { id: assessmentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.title).toBe(longTitle);
        expect(result.value.assessment.title.length).toBe(255);
      }
    });

    it('should handle assessment with very long description', async () => {
      const assessmentId = '22222222-2222-2222-2222-222222222222';
      const longDescription = 'B'.repeat(1000);
      
      const assessment = createTestAssessment({
        id: assessmentId,
        title: 'Assessment with Long Description',
        description: longDescription,
        type: 'PROVA_ABERTA',
      });

      await assessmentRepository.create(assessment);

      const request: GetAssessmentRequest = { id: assessmentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.description).toBe(longDescription);
        expect(result.value.assessment.description?.length).toBe(1000);
      }
    });

    it('should handle assessment with unicode characters', async () => {
      const assessmentId = '33333333-3333-3333-3333-333333333333';
      const unicodeTitle = 'Avaliação 中文 العربية русский 🎯';
      
      const assessment = createTestAssessment({
        id: assessmentId,
        title: unicodeTitle,
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
      });

      await assessmentRepository.create(assessment);

      const request: GetAssessmentRequest = { id: assessmentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.title).toBe(unicodeTitle);
      }
    });

    it('should handle assessment with maximum time limit', async () => {
      const assessmentId = '44444444-4444-4444-4444-444444444444';
      
      const assessment = createTestAssessment({
        id: assessmentId,
        title: 'Very Long Exam',
        type: 'SIMULADO',
        passingScore: 70,
        timeLimitInMinutes: 9999,
      });

      await assessmentRepository.create(assessment);

      const request: GetAssessmentRequest = { id: assessmentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.assessment.timeLimitInMinutes).toBe(9999);
      }
    });
  });

  describe('📊 Data Integrity', () => {
    it('should preserve all assessment data fields accurately', async () => {
      const assessmentId = '55555555-5555-5555-5555-555555555555';
      const lessonId = '66666666-6666-6666-6666-666666666666';
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const updatedAt = new Date('2024-01-02T15:30:00Z');
      
      const assessment = createTestAssessment({
        id: assessmentId,
        title: 'Data Integrity Test',
        description: 'Testing data preservation',
        type: 'SIMULADO',
        passingScore: 85,
        timeLimitInMinutes: 180,
        randomizeQuestions: true,
        randomizeOptions: false,
        lessonId,
        createdAt,
        updatedAt,
      });

      await assessmentRepository.create(assessment);

      const request: GetAssessmentRequest = { id: assessmentId };
      const result = await useCase.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const returnedAssessment = result.value.assessment;
        expect(returnedAssessment.id).toBe(assessmentId);
        expect(returnedAssessment.title).toBe('Data Integrity Test');
        expect(returnedAssessment.description).toBe('Testing data preservation');
        expect(returnedAssessment.type).toBe('SIMULADO');
        expect(returnedAssessment.quizPosition).toBeUndefined();
        expect(returnedAssessment.passingScore).toBe(85);
        expect(returnedAssessment.timeLimitInMinutes).toBe(180);
        expect(returnedAssessment.randomizeQuestions).toBe(true);
        expect(returnedAssessment.randomizeOptions).toBe(false);
        expect(returnedAssessment.lessonId).toBe(lessonId);
        expect(returnedAssessment.createdAt).toEqual(createdAt);
        expect(returnedAssessment.updatedAt).toEqual(updatedAt);
      }
    });

    it('should handle different assessment types correctly', async () => {
      const testCases = [
        { type: 'QUIZ', quizPosition: 'BEFORE_LESSON' },
        { type: 'QUIZ', quizPosition: 'AFTER_LESSON' },
        { type: 'SIMULADO', timeLimitInMinutes: 90 },
        { type: 'PROVA_ABERTA' },
      ] as const;

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const assessmentId = `77777777-7777-7777-777${i}-777777777777`;
        
        const assessment = createTestAssessment({
          id: assessmentId,
          title: `${testCase.type} Assessment`,
          type: testCase.type,
          quizPosition: 'quizPosition' in testCase ? testCase.quizPosition : undefined,
          timeLimitInMinutes: 'timeLimitInMinutes' in testCase ? testCase.timeLimitInMinutes : undefined,
        });

        await assessmentRepository.create(assessment);

        const request: GetAssessmentRequest = { id: assessmentId };
        const result = await useCase.execute(request);

        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value.assessment.type).toBe(testCase.type);
          if ('quizPosition' in testCase) {
            expect(result.value.assessment.quizPosition).toBe(testCase.quizPosition);
          }
          if ('timeLimitInMinutes' in testCase) {
            expect(result.value.assessment.timeLimitInMinutes).toBe(testCase.timeLimitInMinutes);
          }
        }
      }
    });

    it('should maintain consistency across multiple retrievals', async () => {
      const assessmentId = '88888888-8888-8888-8888-888888888888';
      
      const assessment = createTestAssessment({
        id: assessmentId,
        title: 'Consistency Test Assessment',
        passingScore: 77,
        randomizeQuestions: true,
      });

      await assessmentRepository.create(assessment);

      const request: GetAssessmentRequest = { id: assessmentId };
      
      // Call multiple times
      const results = await Promise.all([
        useCase.execute(request),
        useCase.execute(request),
        useCase.execute(request),
      ]);

      results.forEach((result) => {
        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value.assessment.id).toBe(assessmentId);
          expect(result.value.assessment.title).toBe('Consistency Test Assessment');
          expect(result.value.assessment.passingScore).toBe(77);
          expect(result.value.assessment.randomizeQuestions).toBe(true);
        }
      });

      // Ensure all results are identical
      if (results.every(r => r.isRight())) {
        const [first, second, third] = results.map(r => (r as any).value.assessment);
        expect(first).toEqual(second);
        expect(second).toEqual(third);
      }
    });
  });
});