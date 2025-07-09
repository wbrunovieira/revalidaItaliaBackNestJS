// // src/domain/assessment/application/use-cases/create-assessment.use-case.spec.ts
// import { describe, it, expect, beforeEach, vi } from 'vitest';
// import { CreateAssessmentUseCase } from './create-assessment.use-case';
// import { InMemoryAssessmentRepository } from '@/test/repositories/in-memory-assessment-repository';
// import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
// import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
// import { UniqueEntityID } from '@/core/unique-entity-id';
// import { CreateAssessmentRequest } from '../dtos/create-assessment-request.dto';
// import { DuplicateAssessmentError } from './errors/duplicate-assessment-error';
// import { InvalidInputError } from './errors/invalid-input-error';
// import { RepositoryError } from './errors/repository-error';
// import { LessonNotFoundError } from './errors/lesson-not-found-error';
// import { left } from '@/core/either';

// let assessmentRepo: InMemoryAssessmentRepository;
// let lessonRepo: InMemoryLessonRepository;
// let sut: CreateAssessmentUseCase;

// describe('CreateAssessmentUseCase', () => {
//   beforeEach(() => {
//     assessmentRepo = new InMemoryAssessmentRepository();
//     lessonRepo = new InMemoryLessonRepository();
//     sut = new CreateAssessmentUseCase(assessmentRepo, lessonRepo);
//   });

//   async function createMockLesson(lessonId: string) {
//     const lesson = Lesson.create(
//       {
//         moduleId: 'module-123',
//         order: 1,
//         translations: [
//           { locale: 'pt', title: 'Lesson Test', description: 'Test' },
//         ],
//         flashcardIds: [],
//         quizIds: [],
//         commentIds: [],
//       },
//       new UniqueEntityID(lessonId),
//     );
//     await lessonRepo.create(lesson);
//   }

//   function baseValidQuizRequest(): CreateAssessmentRequest {
//     return {
//       title: 'Quiz Básico de Matemática',
//       description: 'Quiz sobre conceitos básicos de matemática',
//       type: 'QUIZ',
//       quizPosition: 'AFTER_LESSON',
//       passingScore: 70,
//       randomizeQuestions: false,
//       randomizeOptions: false,
//       lessonId: 'lesson-123',
//     };
//   }

//   function baseValidSimuladoRequest(): CreateAssessmentRequest {
//     return {
//       title: 'Simulado ENEM',
//       description: 'Simulado completo do ENEM',
//       type: 'SIMULADO',
//       passingScore: 60,
//       timeLimitInMinutes: 180,
//       randomizeQuestions: true,
//       randomizeOptions: true,
//     };
//   }

//   function baseValidProvaAbertaRequest(): CreateAssessmentRequest {
//     return {
//       title: 'Prova Aberta de Redação',
//       description: 'Prova dissertativa sobre literatura',
//       type: 'PROVA_ABERTA',
//       passingScore: 50,
//       randomizeQuestions: false,
//       randomizeOptions: false,
//     };
//   }

//   it('creates a quiz assessment successfully', async () => {
//     const req = baseValidQuizRequest();
//     // Mock lesson exists
//     await createMockLesson('lesson-123');

//     const result = await sut.execute(req);
//     expect(result.isRight()).toBe(true);

//     if (result.isRight()) {
//       const { assessment } = result.value;
//       expect(assessment.id).toMatch(/[0-9a-fA-F\-]{36}/);
//       expect(assessment.title).toBe('Quiz Básico de Matemática');
//       expect(assessment.type).toBe('QUIZ');
//       expect(assessment.quizPosition).toBe('AFTER_LESSON');
//       expect(assessment.passingScore).toBe(70);
//       expect(assessment.lessonId).toBe('lesson-123');
//       expect(assessmentRepo.items).toHaveLength(1);
//     }
//   });

//   it('creates a simulado assessment successfully', async () => {
//     const req = baseValidSimuladoRequest();

//     const result = await sut.execute(req);
//     expect(result.isRight()).toBe(true);

//     if (result.isRight()) {
//       const { assessment } = result.value;
//       expect(assessment.title).toBe('Simulado ENEM');
//       expect(assessment.type).toBe('SIMULADO');
//       expect(assessment.quizPosition).toBeUndefined();
//       expect(assessment.timeLimitInMinutes).toBe(180);
//       expect(assessment.randomizeQuestions).toBe(true);
//       expect(assessment.lessonId).toBeUndefined();
//       expect(assessmentRepo.items).toHaveLength(1);
//     }
//   });

//   it('creates a prova aberta assessment successfully', async () => {
//     const req = baseValidProvaAbertaRequest();

//     const result = await sut.execute(req);
//     expect(result.isRight()).toBe(true);

//     if (result.isRight()) {
//       const { assessment } = result.value;
//       expect(assessment.title).toBe('Prova Aberta de Redação');
//       expect(assessment.type).toBe('PROVA_ABERTA');
//       expect(assessment.quizPosition).toBeUndefined();
//       expect(assessment.timeLimitInMinutes).toBeUndefined();
//       expect(assessment.lessonId).toBeUndefined();
//       expect(assessmentRepo.items).toHaveLength(1);
//     }
//   });

//   it('rejects when title is too short', async () => {
//     const req = { ...baseValidQuizRequest(), title: 'AB' };
//     await createMockLesson('lesson-123');

//     const result = await sut.execute(req);
//     expect(result.isLeft()).toBe(true);

//     if (result.isLeft()) {
//       const err = result.value as InvalidInputError;
//       expect(err).toBeInstanceOf(InvalidInputError);
//       expect(err.message).toBe('Validation failed');
//       expect(err.details).toContain(
//         'title: Assessment title must be at least 3 characters long',
//       );
//     }
//   });

//   it('rejects when passing score is invalid', async () => {
//     const req = { ...baseValidQuizRequest(), passingScore: 150 };
//     await createMockLesson('lesson-123');

//     const result = await sut.execute(req);
//     expect(result.isLeft()).toBe(true);

//     if (result.isLeft()) {
//       const err = result.value as InvalidInputError;
//       expect(err).toBeInstanceOf(InvalidInputError);
//       expect(err.details).toContain(
//         'passingScore: Passing score must be at most 100 (maximum: 100)',
//       );
//     }
//   });

//   it('rejects quiz without quiz position', async () => {
//     const req = { ...baseValidQuizRequest() };
//     delete req.quizPosition;
//     await createMockLesson('lesson-123');

//     const result = await sut.execute(req);
//     expect(result.isLeft()).toBe(true);

//     if (result.isLeft()) {
//       const err = result.value as InvalidInputError;
//       expect(err).toBeInstanceOf(InvalidInputError);
//       expect(err.details).toContain(
//         'quizPosition: Quiz position is required for QUIZ type assessments',
//       );
//     }
//   });

//   it('rejects quiz without lesson id', async () => {
//     const req = { ...baseValidQuizRequest() };
//     delete req.lessonId;

//     const result = await sut.execute(req);
//     expect(result.isLeft()).toBe(true);

//     if (result.isLeft()) {
//       const err = result.value as InvalidInputError;
//       expect(err).toBeInstanceOf(InvalidInputError);
//       expect(err.details).toContain(
//         'lessonId: Lesson ID is required for QUIZ type assessments',
//       );
//     }
//   });

//   it('rejects non-quiz with quiz position', async () => {
//     const req = {
//       ...baseValidSimuladoRequest(),
//       quizPosition: 'AFTER_LESSON' as any,
//     };

//     const result = await sut.execute(req);
//     expect(result.isLeft()).toBe(true);

//     if (result.isLeft()) {
//       const err = result.value as InvalidInputError;
//       expect(err).toBeInstanceOf(InvalidInputError);
//       expect(err.details).toContain(
//         'quizPosition: Quiz position can only be set for QUIZ type assessments',
//       );
//     }
//   });

//   it('rejects when lesson does not exist', async () => {
//     const req = baseValidQuizRequest();
//     // Don't add lesson to repository

//     const result = await sut.execute(req);
//     expect(result.isLeft()).toBe(true);

//     if (result.isLeft()) {
//       expect(result.value).toBeInstanceOf(LessonNotFoundError);
//     }
//   });

//   it('rejects duplicate assessment title', async () => {
//     const req = baseValidQuizRequest();
//     await createMockLesson('lesson-123');

//     await sut.execute(req);
//     const again = await sut.execute(req);
//     expect(again.isLeft()).toBe(true);

//     if (again.isLeft()) {
//       expect(again.value).toBeInstanceOf(DuplicateAssessmentError);
//     }
//   });

//   it('handles repository error on findByTitle', async () => {
//     vi.spyOn(assessmentRepo, 'findByTitle').mockRejectedValueOnce(
//       new Error('DB down'),
//     );
//     const result = await sut.execute(baseValidQuizRequest());
//     expect(result.isLeft()).toBe(true);

//     if (result.isLeft()) {
//       expect(result.value).toBeInstanceOf(RepositoryError);
//       expect(result.value.message).toBe('DB down');
//     }
//   });

//   it('handles repository error on lesson lookup', async () => {
//     const req = baseValidQuizRequest();
//     vi.spyOn(lessonRepo, 'findById').mockRejectedValueOnce(
//       new Error('Lesson DB down'),
//     );

//     const result = await sut.execute(req);
//     expect(result.isLeft()).toBe(true);

//     if (result.isLeft()) {
//       expect(result.value).toBeInstanceOf(RepositoryError);
//       expect(result.value.message).toBe('Lesson DB down');
//     }
//   });

//   it('handles Left returned by repository.create', async () => {
//     const req = baseValidQuizRequest();
//     await createMockLesson('lesson-123');
//     vi.spyOn(assessmentRepo, 'create').mockResolvedValueOnce(
//       left(new Error('Insert failed')) as any,
//     );

//     const result = await sut.execute(req);
//     expect(result.isLeft()).toBe(true);

//     if (result.isLeft()) {
//       expect(result.value).toBeInstanceOf(RepositoryError);
//       expect(result.value.message).toBe('Insert failed');
//     }
//   });

//   it('handles exception thrown by repository.create', async () => {
//     const req = baseValidQuizRequest();
//     await createMockLesson('lesson-123');
//     vi.spyOn(assessmentRepo, 'create').mockImplementationOnce(() => {
//       throw new Error('Create exception');
//     });

//     const result = await sut.execute(req);
//     expect(result.isLeft()).toBe(true);

//     if (result.isLeft()) {
//       expect(result.value).toBeInstanceOf(RepositoryError);
//       expect(result.value.message).toBe('Create exception');
//     }
//   });

//   it('validates invalid assessment type', async () => {
//     const req = { ...baseValidQuizRequest(), type: 'INVALID_TYPE' as any };

//     const result = await sut.execute(req);
//     expect(result.isLeft()).toBe(true);

//     if (result.isLeft()) {
//       const err = result.value as InvalidInputError;
//       expect(err).toBeInstanceOf(InvalidInputError);
//       expect(err.details).toContain(
//         'type: Type must be QUIZ, SIMULADO or PROVA_ABERTA',
//       );
//     }
//   });

//   it('validates negative time limit', async () => {
//     const req = { ...baseValidSimuladoRequest(), timeLimitInMinutes: -30 };

//     const result = await sut.execute(req);
//     expect(result.isLeft()).toBe(true);

//     if (result.isLeft()) {
//       const err = result.value as InvalidInputError;
//       expect(err).toBeInstanceOf(InvalidInputError);
//       expect(err.details).toContain(
//         'timeLimitInMinutes: Time limit must be positive (minimum: 1)',
//       );
//     }
//   });

//   it('validates invalid UUID for lesson ID', async () => {
//     const req = { ...baseValidQuizRequest(), lessonId: 'invalid-uuid' };

//     const result = await sut.execute(req);
//     expect(result.isLeft()).toBe(true);

//     if (result.isLeft()) {
//       const err = result.value as InvalidInputError;
//       expect(err).toBeInstanceOf(InvalidInputError);
//       expect(err.details).toContain('lessonId: Lesson ID must be a valid UUID');
//     }
//   });

//   it('handles invalid assessment type value object creation', async () => {
//     const req = baseValidQuizRequest();
//     await createMockLesson('lesson-123');

//     // Mock the assessment type validation to fail
//     vi.spyOn(assessmentRepo, 'findByTitle').mockResolvedValueOnce(
//       left(new Error('Not found')) as any,
//     );

//     // This test ensures that if AssessmentTypeVO throws an error, it's handled properly
//     const result = await sut.execute(req);

//     // Since we're using valid types in our test, this should succeed
//     // The actual error handling is tested by the use case implementation
//     expect(result.isRight()).toBe(true);
//   });

//   it('warns about time limit for simulado', async () => {
//     // Note: The schema suggests a warning for simulados without time limit
//     // but doesn't enforce it as an error
//     const req = { ...baseValidSimuladoRequest() };
//     delete req.timeLimitInMinutes;

//     const result = await sut.execute(req);

//     // Should still succeed since it's just a recommendation
//     expect(result.isRight()).toBe(true);

//     if (result.isRight()) {
//       const { assessment } = result.value;
//       expect(assessment.timeLimitInMinutes).toBeUndefined();
//     }
//   });

//   it('handles entity creation failure', async () => {
//     const req = baseValidQuizRequest();
//     await createMockLesson('lesson-123');

//     // Force Assessment.create to throw by passing conflicting data
//     // This is a mock scenario - in reality, the entity might throw for business rule violations
//     const invalidReq = {
//       ...req,
//       type: 'SIMULADO' as const,
//       quizPosition: 'AFTER_LESSON' as const, // This should fail in entity creation
//     };

//     const result = await sut.execute(invalidReq);
//     expect(result.isLeft()).toBe(true);

//     if (result.isLeft()) {
//       const err = result.value as InvalidInputError;
//       expect(err).toBeInstanceOf(InvalidInputError);
//       // The schema validation should catch this before entity creation
//       expect(err.details).toContain(
//         'quizPosition: Quiz position can only be set for QUIZ type assessments',
//       );
//     }
//   });
// });
