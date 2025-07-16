import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Either, left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { GetQuestionsDetailedUseCase } from './get-questions-detailed.use-case';
import { GetQuestionsDetailedRequest } from '../dtos/get-questions-detailed-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { QuestionOption } from '@/domain/assessment/enterprise/entities/question-option.entity';
import { Answer } from '@/domain/assessment/enterprise/entities/answer.entity';
import { Argument } from '@/domain/assessment/enterprise/entities/argument.entity';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { QuestionTypeVO } from '@/domain/assessment/enterprise/value-objects/question-type.vo';
import { AnswerTranslationVO } from '@/domain/assessment/enterprise/value-objects/answer-translation.vo';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { IQuestionOptionRepository } from '../repositories/i-question-option-repository';
import { IAnswerRepository } from '../repositories/i-answer.repository';
import { IArgumentRepository } from '../repositories/i-argument-repository';
import { ILessonRepository } from '@/domain/course-catalog/application/repositories/i-lesson-repository';

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

class MockQuestionRepository implements IQuestionRepository {
  findById = vi.fn();
  findByAssessmentId = vi.fn();
  findByArgumentId = vi.fn();
  findByAssessmentIdAndArgumentId = vi.fn();
  create = vi.fn();
  findAll = vi.fn();
  findAllPaginated = vi.fn();
  update = vi.fn();
  delete = vi.fn();
  countByAssessmentId = vi.fn();
  countByArgumentId = vi.fn();
}

class MockQuestionOptionRepository implements IQuestionOptionRepository {
  findById = vi.fn();
  findByQuestionId = vi.fn();
  findByQuestionIds = vi.fn();
  create = vi.fn();
  createMany = vi.fn();
  update = vi.fn();
  delete = vi.fn();
  deleteByQuestionId = vi.fn();
  countByQuestionId = vi.fn();
}

class MockAnswerRepository implements IAnswerRepository {
  create = vi.fn();
  findById = vi.fn();
  findByQuestionId = vi.fn();
  findManyByQuestionIds = vi.fn();
  findAllPaginated = vi.fn();
  update = vi.fn();
  delete = vi.fn();
  exists = vi.fn();
  existsByQuestionId = vi.fn();
}

class MockArgumentRepository implements IArgumentRepository {
  findById = vi.fn();
  findByAssessmentId = vi.fn();
  findByTitle = vi.fn();
  findByTitleAndAssessmentId = vi.fn();
  create = vi.fn();
  update = vi.fn();
  delete = vi.fn();
  countByAssessmentId = vi.fn();
  findAll = vi.fn();
  findAllPaginated = vi.fn();
}

class MockLessonRepository implements ILessonRepository {
  checkLessonDependencies = vi.fn();
  findByModuleIdAndOrder = vi.fn();
  findById = vi.fn();
  findAll = vi.fn();
  findByModuleId = vi.fn();
  findBySlug = vi.fn();
  create = vi.fn();
  update = vi.fn();
  delete = vi.fn();
  findByOrderAndModuleId = vi.fn();
}

describe('GetQuestionsDetailedUseCase', () => {
  let useCase: GetQuestionsDetailedUseCase;
  let assessmentRepo: MockAssessmentRepository;
  let questionRepo: MockQuestionRepository;
  let questionOptionRepo: MockQuestionOptionRepository;
  let answerRepo: MockAnswerRepository;
  let argumentRepo: MockArgumentRepository;
  let lessonRepo: MockLessonRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    assessmentRepo = new MockAssessmentRepository();
    questionRepo = new MockQuestionRepository();
    questionOptionRepo = new MockQuestionOptionRepository();
    answerRepo = new MockAnswerRepository();
    argumentRepo = new MockArgumentRepository();
    lessonRepo = new MockLessonRepository();

    useCase = new GetQuestionsDetailedUseCase(
      assessmentRepo,
      questionRepo,
      questionOptionRepo,
      answerRepo,
      argumentRepo,
      lessonRepo,
    );
  });

  describe('Validation Errors', () => {
    it('should return InvalidInputError when assessmentId is not UUID', async () => {
      const request: GetQuestionsDetailedRequest = {
        assessmentId: 'invalid-uuid',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Validation failed');
        expect((result.value as InvalidInputError).details).toContain(
          'assessmentId: Assessment ID must be a valid UUID',
        );
      }
    });

    it('should return InvalidInputError when assessmentId is empty', async () => {
      const request: GetQuestionsDetailedRequest = {
        assessmentId: '',
      };

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });

  describe('Business Logic Errors', () => {
    it('should return AssessmentNotFoundError when assessment does not exist', async () => {
      const request: GetQuestionsDetailedRequest = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
      };

      assessmentRepo.findById.mockResolvedValueOnce(
        left(new Error('Not found')),
      );

      const result = await useCase.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
      }
    });
  });

  describe('Repository Errors', () => {
    it('should return RepositoryError when questions fetch fails', async () => {
      const assessment = Assessment.create({
        slug: 'test-assessment',
        title: 'Test Assessment',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(
        left(new Error('DB error')),
      );

      const result = await useCase.execute({
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to fetch questions');
      }
    });

    it('should return RepositoryError when options fetch fails', async () => {
      const assessment = Assessment.create({
        slug: 'test-assessment',
        title: 'Test Assessment',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      const question = Question.create({
        text: 'Test question?',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: new UniqueEntityID(),
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([question]));
      questionOptionRepo.findByQuestionIds.mockResolvedValueOnce(
        left(new Error('DB error')),
      );

      const result = await useCase.execute({
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to fetch question options');
      }
    });

    it('should return RepositoryError when answers fetch fails', async () => {
      const assessment = Assessment.create({
        slug: 'test-assessment',
        title: 'Test Assessment',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      const question = Question.create({
        text: 'Test question?',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: new UniqueEntityID(),
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([question]));
      questionOptionRepo.findByQuestionIds.mockResolvedValueOnce(right([]));
      answerRepo.findManyByQuestionIds.mockResolvedValueOnce(
        left(new Error('DB error')),
      );

      const result = await useCase.execute({
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to fetch answers');
      }
    });
  });

  describe('Success Cases', () => {
    it('should return complete assessment data for QUIZ without lesson', async () => {
      const assessmentId = new UniqueEntityID();
      const questionId = new UniqueEntityID();
      const optionId1 = new UniqueEntityID();
      const optionId2 = new UniqueEntityID();
      const answerId = new UniqueEntityID();

      const assessment = Assessment.create(
        {
          slug: 'test-quiz',
          title: 'Test Quiz',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      const question = Question.create(
        {
          text: 'What is 2+2?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: assessmentId,
        },
        questionId,
      );

      const option1 = QuestionOption.create(
        {
          text: '3',
          questionId: questionId,
        },
        optionId1,
      );

      const option2 = QuestionOption.create(
        {
          text: '4',
          questionId: questionId,
        },
        optionId2,
      );

      const answer = Answer.create(
        {
          correctOptionId: optionId2,
          explanation: 'Two plus two equals four',
          questionId: questionId,
          translations: [
            new AnswerTranslationVO('pt', 'Dois mais dois é igual a quatro'),
            new AnswerTranslationVO('it', 'Due più due fa quattro'),
          ],
        },
        answerId,
      );

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([question]));
      questionOptionRepo.findByQuestionIds.mockResolvedValueOnce(
        right([option1, option2]),
      );
      answerRepo.findManyByQuestionIds.mockResolvedValueOnce(right([answer]));

      const result = await useCase.execute({
        assessmentId: assessmentId.toString(),
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;

        // Check assessment data
        expect(response.assessment.id).toBe(assessmentId.toString());
        expect(response.assessment.title).toBe('Test Quiz');
        expect(response.assessment.type).toBe('QUIZ');
        expect(response.lesson).toBeUndefined();
        expect(response.arguments).toEqual([]);

        // Check questions
        expect(response.totalQuestions).toBe(1);
        expect(response.totalQuestionsWithAnswers).toBe(1);
        expect(response.questions).toHaveLength(1);

        const questionResponse = response.questions[0];
        expect(questionResponse.text).toBe('What is 2+2?');
        expect(questionResponse.type).toBe('MULTIPLE_CHOICE');
        expect(questionResponse.options).toHaveLength(2);
        expect(questionResponse.options[0].text).toBe('3');
        expect(questionResponse.options[1].text).toBe('4');

        // Check answer
        expect(questionResponse.answer).toBeDefined();
        expect(questionResponse.answer?.correctOptionId).toBe(
          optionId2.toString(),
        );
        expect(questionResponse.answer?.explanation).toBe(
          'Two plus two equals four',
        );
        expect(questionResponse.answer?.translations).toHaveLength(2);
      }
    });

    it('should return complete assessment data with lesson info', async () => {
      const assessmentId = new UniqueEntityID();
      const lessonId = new UniqueEntityID();

      const assessment = Assessment.create(
        {
          slug: 'test-quiz',
          title: 'Test Quiz',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
          lessonId: lessonId,
        },
        assessmentId,
      );

      const lesson = Lesson.create(
        {
          slug: 'test-lesson',
          moduleId: 'module-123',
          order: 1,
          flashcardIds: [],
          commentIds: [],
          translations: [
            { locale: 'pt', title: 'Aula Teste', description: 'Descrição' },
            { locale: 'it', title: 'Lezione Test' },
          ],
          videos: [],
          documents: [],
          assessments: [],
        },
        lessonId,
      );

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      lessonRepo.findById.mockResolvedValueOnce(right(lesson));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionOptionRepo.findByQuestionIds.mockResolvedValueOnce(right([]));
      answerRepo.findManyByQuestionIds.mockResolvedValueOnce(right([]));

      const result = await useCase.execute({
        assessmentId: assessmentId.toString(),
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.lesson).toBeDefined();
        expect(result.value.lesson?.id).toBe(lessonId.toString());
        expect(result.value.lesson?.title).toBe('Aula Teste');
        expect(result.value.lesson?.order).toBe(1);
      }
    });

    it('should return complete assessment data for SIMULADO with arguments', async () => {
      const assessmentId = new UniqueEntityID();
      const argumentId = new UniqueEntityID();
      const questionId = new UniqueEntityID();

      const assessment = Assessment.create(
        {
          slug: 'test-simulado',
          title: 'Test Simulado',
          type: 'SIMULADO',
          passingScore: 80,
          timeLimitInMinutes: 120,
          randomizeQuestions: true,
          randomizeOptions: true,
        },
        assessmentId,
      );

      const argument = Argument.create(
        {
          title: 'Cardiology',
          assessmentId: assessmentId,
        },
        argumentId,
      );

      const question = Question.create(
        {
          text: 'Heart question?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: assessmentId,
          argumentId: argumentId,
        },
        questionId,
      );

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      argumentRepo.findByAssessmentId.mockResolvedValueOnce(right([argument]));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([question]));
      questionOptionRepo.findByQuestionIds.mockResolvedValueOnce(right([]));
      answerRepo.findManyByQuestionIds.mockResolvedValueOnce(right([]));

      const result = await useCase.execute({
        assessmentId: assessmentId.toString(),
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;

        expect(response.assessment.type).toBe('SIMULADO');
        expect(response.arguments).toHaveLength(1);
        expect(response.arguments[0].title).toBe('Cardiology');
        expect(response.arguments[0].questions).toHaveLength(1);
        expect(response.arguments[0].questions[0].text).toBe('Heart question?');
      }
    });

    it('should handle PROVA_ABERTA with open questions', async () => {
      const assessmentId = new UniqueEntityID();
      const questionId = new UniqueEntityID();

      const assessment = Assessment.create(
        {
          slug: 'test-prova',
          title: 'Test Prova Aberta',
          type: 'PROVA_ABERTA',
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      const question = Question.create(
        {
          text: 'Explain the cardiovascular system',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: assessmentId,
        },
        questionId,
      );

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([question]));
      questionOptionRepo.findByQuestionIds.mockResolvedValueOnce(right([]));
      answerRepo.findManyByQuestionIds.mockResolvedValueOnce(right([]));

      const result = await useCase.execute({
        assessmentId: assessmentId.toString(),
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;

        expect(response.assessment.type).toBe('PROVA_ABERTA');
        expect(response.assessment.passingScore).toBeUndefined();
        expect(response.questions).toHaveLength(1);
        expect(response.questions[0].type).toBe('OPEN');
        expect(response.questions[0].options).toHaveLength(0);
        expect(response.questions[0].answer).toBeUndefined();
        expect(response.totalQuestionsWithAnswers).toBe(0);
      }
    });

    it('should handle assessment without questions', async () => {
      const assessment = Assessment.create({
        slug: 'empty-assessment',
        title: 'Empty Assessment',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionOptionRepo.findByQuestionIds.mockResolvedValueOnce(right([]));
      answerRepo.findManyByQuestionIds.mockResolvedValueOnce(right([]));

      const result = await useCase.execute({
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.totalQuestions).toBe(0);
        expect(result.value.totalQuestionsWithAnswers).toBe(0);
        expect(result.value.questions).toHaveLength(0);
      }
    });

    it('should handle lesson fetch failure gracefully', async () => {
      const assessmentId = new UniqueEntityID();
      const lessonId = new UniqueEntityID();

      const assessment = Assessment.create(
        {
          slug: 'test-quiz',
          title: 'Test Quiz',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
          lessonId: lessonId,
        },
        assessmentId,
      );

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      lessonRepo.findById.mockResolvedValueOnce(
        left(new Error('Lesson not found')),
      );
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionOptionRepo.findByQuestionIds.mockResolvedValueOnce(right([]));
      answerRepo.findManyByQuestionIds.mockResolvedValueOnce(right([]));

      const result = await useCase.execute({
        assessmentId: assessmentId.toString(),
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.lesson).toBeUndefined();
      }
    });

    it('should handle arguments fetch failure gracefully for SIMULADO', async () => {
      const assessment = Assessment.create({
        slug: 'test-simulado',
        title: 'Test Simulado',
        type: 'SIMULADO',
        passingScore: 80,
        timeLimitInMinutes: 120,
        randomizeQuestions: true,
        randomizeOptions: true,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      argumentRepo.findByAssessmentId.mockResolvedValueOnce(
        left(new Error('DB error')),
      );
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionOptionRepo.findByQuestionIds.mockResolvedValueOnce(right([]));
      answerRepo.findManyByQuestionIds.mockResolvedValueOnce(right([]));

      const result = await useCase.execute({
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.arguments).toEqual([]);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle unexpected errors', async () => {
      assessmentRepo.findById.mockRejectedValueOnce(
        new Error('Unexpected error'),
      );

      const result = await useCase.execute({
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('An unexpected error occurred');
      }
    });

    it('should handle lesson without Portuguese translation', async () => {
      const assessmentId = new UniqueEntityID();
      const lessonId = new UniqueEntityID();

      const assessment = Assessment.create(
        {
          slug: 'test-quiz',
          title: 'Test Quiz',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
          lessonId: lessonId,
        },
        assessmentId,
      );

      const lesson = Lesson.create(
        {
          slug: 'test-lesson',
          moduleId: 'module-123',
          order: 1,
          flashcardIds: [],
          commentIds: [],
          translations: [
            { locale: 'it', title: 'Lezione Test' },
            { locale: 'es', title: 'Lección Test' },
          ],
          videos: [],
          documents: [],
          assessments: [],
        },
        lessonId,
      );

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      lessonRepo.findById.mockResolvedValueOnce(right(lesson));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionOptionRepo.findByQuestionIds.mockResolvedValueOnce(right([]));
      answerRepo.findManyByQuestionIds.mockResolvedValueOnce(right([]));

      const result = await useCase.execute({
        assessmentId: assessmentId.toString(),
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.lesson?.title).toBe('Lezione Test'); // Falls back to first translation
      }
    });

    it('should handle arguments without assessmentId', async () => {
      const assessmentId = new UniqueEntityID();

      const assessment = Assessment.create(
        {
          slug: 'test-simulado',
          title: 'Test Simulado',
          type: 'SIMULADO',
          passingScore: 80,
          randomizeQuestions: true,
          randomizeOptions: true,
        },
        assessmentId,
      );

      const argumentWithoutAssessmentId = Argument.create({
        title: 'Orphan Argument',
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      argumentRepo.findByAssessmentId.mockResolvedValueOnce(
        right([argumentWithoutAssessmentId]),
      );
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionOptionRepo.findByQuestionIds.mockResolvedValueOnce(right([]));
      answerRepo.findManyByQuestionIds.mockResolvedValueOnce(right([]));

      const result = await useCase.execute({
        assessmentId: assessmentId.toString(),
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.arguments).toEqual([]); // Orphan argument is filtered out
      }
    });
  });
});
