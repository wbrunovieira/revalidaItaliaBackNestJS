// src/domain/assessment/application/use-cases/create-question.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Either, left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { CreateQuestionUseCase } from './create-question.use-case';
import { CreateQuestionRequest } from '../dtos/create-question-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { DuplicateQuestionError } from './errors/duplicate-question-error';
import { RepositoryError } from './errors/repository-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { ArgumentNotFoundError } from './errors/argument-not-found-error';
import { QuestionTypeMismatchError } from './errors/question-type-mismatch-error';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { Argument } from '@/domain/assessment/enterprise/entities/argument.entity';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { IArgumentRepository } from '../repositories/i-argument-repository';
import { QuestionTypeVO } from '@/domain/assessment/enterprise/value-objects/question-type.vo';

class MockQuestionRepository implements IQuestionRepository {
  findById = vi.fn();
  findByAssessmentId = vi.fn();
  findByArgumentId = vi.fn();
  findByAssessmentIdAndArgumentId = vi.fn();
  create = vi.fn();
  update = vi.fn();
  delete = vi.fn();
  findAll = vi.fn();
  findAllPaginated = vi.fn();
  countByAssessmentId = vi.fn();
  countByArgumentId = vi.fn();
}

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

class MockArgumentRepository implements IArgumentRepository {
  findById = vi.fn();
  findByTitle = vi.fn();
  findByAssessmentId = vi.fn();
  create = vi.fn();
  findAll = vi.fn();
  findAllPaginated = vi.fn();
  update = vi.fn();
  delete = vi.fn();
  findByTitleAndAssessmentId = vi.fn();
}

describe('CreateQuestionUseCase', () => {
  let useCase: CreateQuestionUseCase;
  let questionRepo: MockQuestionRepository;
  let assessmentRepo: MockAssessmentRepository;
  let argumentRepo: MockArgumentRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    questionRepo = new MockQuestionRepository();
    assessmentRepo = new MockAssessmentRepository();
    argumentRepo = new MockArgumentRepository();
    useCase = new CreateQuestionUseCase(questionRepo, assessmentRepo, argumentRepo);
  });

  describe('Success Cases by Assessment Type', () => {
    const createAssessment = (type: string) => Assessment.create({
      slug: 'test-assessment',
      title: 'Test Assessment',
      type: type as any,
      passingScore: 70,
      randomizeQuestions: false,
      randomizeOptions: false,
    });

    const createSuccessScenario = async (request: CreateQuestionRequest, assessmentType: string) => {
      const assessment = createAssessment(assessmentType);
      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      if (request.argumentId) {
        argumentRepo.findById.mockResolvedValueOnce(right({} as Argument));
      }
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionRepo.create.mockResolvedValueOnce(right(undefined));
      return useCase.execute(request);
    };

    it.each([
      [
        'creates MULTIPLE_CHOICE for QUIZ assessment',
        {
          text: 'What is the capital of Brazil?',
          type: 'MULTIPLE_CHOICE' as const,
          assessmentId: '11111111-1111-1111-1111-111111111111',
        },
        'QUIZ'
      ],
      [
        'creates MULTIPLE_CHOICE for SIMULADO assessment',
        {
          text: 'Which organ performs gas exchange?',
          type: 'MULTIPLE_CHOICE' as const,
          assessmentId: '22222222-2222-2222-2222-222222222222',
        },
        'SIMULADO'
      ],
      [
        'creates OPEN for PROVA_ABERTA assessment',
        {
          text: 'Explain the pathophysiology of hypertension.',
          type: 'OPEN' as const,
          assessmentId: '33333333-3333-3333-3333-333333333333',
        },
        'PROVA_ABERTA'
      ]
    ])('%s', async (_name, req, assessmentType) => {
      const result = await createSuccessScenario(req, assessmentType);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { question } = result.value;
        expect(question.type).toBe(req.type);
        expect(question.text).toBe(req.text);
        expect(question.assessmentId).toBe(req.assessmentId);
      }
    });

    it('creates question with argument for medical specialization', async () => {
      const request: CreateQuestionRequest = {
        text: 'Describe the treatment protocol for acute myocardial infarction.',
        type: 'OPEN',
        assessmentId: '44444444-4444-4444-4444-444444444444',
        argumentId: '55555555-5555-5555-5555-555555555555',
      };

      const result = await createSuccessScenario(request, 'PROVA_ABERTA');
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { question } = result.value;
        expect(question.argumentId).toBe(request.argumentId);
        expect(question.text).toBe(request.text);
      }
    });

    it('creates question without argument for general assessment', async () => {
      const request: CreateQuestionRequest = {
        text: 'Select the correct anatomy structure.',
        type: 'MULTIPLE_CHOICE',
        assessmentId: '66666666-6666-6666-6666-666666666666',
      };

      const result = await createSuccessScenario(request, 'QUIZ');
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { question } = result.value;
        expect(question.argumentId).toBeUndefined();
        expect(question.type).toBe('MULTIPLE_CHOICE');
      }
    });

    it('generates valid timestamps and UUID', async () => {
      const beforeTest = new Date();
      const request: CreateQuestionRequest = {
        text: 'Test question for timestamps',
        type: 'MULTIPLE_CHOICE',
        assessmentId: '77777777-7777-7777-7777-777777777777',
      };

      const result = await createSuccessScenario(request, 'QUIZ');
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { question } = result.value;
        expect(question.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
        expect(question.createdAt).toBeInstanceOf(Date);
        expect(question.updatedAt).toBeInstanceOf(Date);
        expect(question.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
      }
    });
  });

  describe('Question Type Business Rules', () => {
    it('rejects OPEN question for QUIZ assessment', async () => {
      const assessment = Assessment.create({
        slug: 'quiz-test',
        title: 'Quiz Test',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));

      const result = await useCase.execute({
        text: 'Explain this concept in detail.',
        type: 'OPEN',
        assessmentId: '88888888-8888-8888-8888-888888888888',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(QuestionTypeMismatchError);
    });

    it('rejects OPEN question for SIMULADO assessment', async () => {
      const assessment = Assessment.create({
        slug: 'simulado-test',
        title: 'Simulado Test',
        type: 'SIMULADO',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));

      const result = await useCase.execute({
        text: 'Write an essay about this topic.',
        type: 'OPEN',
        assessmentId: '99999999-9999-9999-9999-999999999999',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(QuestionTypeMismatchError);
    });

    it('rejects MULTIPLE_CHOICE question for PROVA_ABERTA assessment', async () => {
      const assessment = Assessment.create({
        slug: 'prova-aberta-test',
        title: 'Prova Aberta Test',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));

      const result = await useCase.execute({
        text: 'Select the correct option:',
        type: 'MULTIPLE_CHOICE',
        assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(QuestionTypeMismatchError);
    });
  });

  describe('Validation Errors', () => {
    type ErrCase = [string, any, string[]];
    const cases: ErrCase[] = [
      [
        'text too short',
        {
          text: 'Short',
          type: 'MULTIPLE_CHOICE',
          assessmentId: '11111111-1111-1111-1111-111111111111',
        },
        ['text: Question text must be at least 10 characters long']
      ],
      [
        'text too long',
        {
          text: 'A'.repeat(1001),
          type: 'MULTIPLE_CHOICE',
          assessmentId: '11111111-1111-1111-1111-111111111111',
        },
        ['text: Question text must be at most 1000 characters long']
      ],
      [
        'invalid question type',
        {
          text: 'What is the correct answer?',
          type: 'INVALID_TYPE',
          assessmentId: '11111111-1111-1111-1111-111111111111',
        },
        ['type: Type must be MULTIPLE_CHOICE or OPEN']
      ],
      [
        'invalid assessmentId UUID',
        {
          text: 'What is the correct answer?',
          type: 'MULTIPLE_CHOICE',
          assessmentId: 'invalid-uuid',
        },
        ['assessmentId: Assessment ID must be a valid UUID']
      ],
      [
        'invalid argumentId UUID',
        {
          text: 'What is the correct answer?',
          type: 'MULTIPLE_CHOICE',
          assessmentId: '11111111-1111-1111-1111-111111111111',
          argumentId: 'invalid-uuid',
        },
        ['argumentId: Argument ID must be a valid UUID']
      ],
      [
        'empty text',
        {
          text: '',
          type: 'MULTIPLE_CHOICE',
          assessmentId: '11111111-1111-1111-1111-111111111111',
        },
        ['text: Question text must be at least 10 characters long']
      ],
      [
        'whitespace only text',
        {
          text: '        ',
          type: 'MULTIPLE_CHOICE',
          assessmentId: '11111111-1111-1111-1111-111111111111',
        },
        ['text: Question text must be at least 10 characters long']
      ],
      [
        'missing type',
        {
          text: 'What is the correct answer?',
          assessmentId: '11111111-1111-1111-1111-111111111111',
        },
        ['type: Type must be MULTIPLE_CHOICE or OPEN']
      ],
      [
        'missing assessmentId',
        {
          text: 'What is the correct answer?',
          type: 'MULTIPLE_CHOICE',
        },
        ['assessmentId: Required']
      ]
    ];

    it.each(cases)('%s', async (_name, req, expected) => {
      const result = await useCase.execute(req as CreateQuestionRequest);
      expect(result.isLeft()).toBe(true);
      if (result.isLeft() && result.value instanceof InvalidInputError) {
        const error = result.value;
        expected.forEach((msg) => expect(error.details).toContain(msg));
      }
    });
  });

  describe('Business Logic Errors', () => {
    it('duplicate question text in same assessment', async () => {
      const assessmentId = '11111111-1111-1111-1111-111111111111';
      const duplicateText = 'What is the capital of Brazil?';
      
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      const existingQuestion = Question.create({
        text: duplicateText,
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: new UniqueEntityID(assessmentId),
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([existingQuestion]));

      const result = await useCase.execute({
        text: duplicateText,
        type: 'MULTIPLE_CHOICE',
        assessmentId,
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(DuplicateQuestionError);
    });

    it('case insensitive duplicate detection', async () => {
      const assessmentId = '22222222-2222-2222-2222-222222222222';
      
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      const existingQuestion = Question.create({
        text: 'WHAT IS THE CAPITAL OF BRAZIL?',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: new UniqueEntityID(assessmentId),
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([existingQuestion]));

      const result = await useCase.execute({
        text: 'what is the capital of brazil?',
        type: 'MULTIPLE_CHOICE',
        assessmentId,
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(DuplicateQuestionError);
    });

    it('assessment not found', async () => {
      assessmentRepo.findById.mockResolvedValueOnce(left(new Error('not found')));

      const result = await useCase.execute({
        text: 'What is the correct answer?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: '99999999-9999-9999-9999-999999999999',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
    });

    it('argument not found', async () => {
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      argumentRepo.findById.mockResolvedValueOnce(left(new Error('not found')));

      const result = await useCase.execute({
        text: 'What is the correct answer?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
        argumentId: '99999999-9999-9999-9999-999999999999',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ArgumentNotFoundError);
    });
  });

  describe('Repository Errors', () => {
    it('throws on assessment repository findById', async () => {
      assessmentRepo.findById.mockRejectedValueOnce(new Error('DB down'));

      const result = await useCase.execute({
        text: 'What is the correct answer?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('throws on argument repository findById', async () => {
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      argumentRepo.findById.mockRejectedValueOnce(new Error('Argument DB error'));

      const result = await useCase.execute({
        text: 'What is the correct answer?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
        argumentId: '22222222-2222-2222-2222-222222222222',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('throws on question repository findByAssessmentId', async () => {
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockRejectedValueOnce(new Error('Question DB error'));

      const result = await useCase.execute({
        text: 'What is the correct answer?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('error on create', async () => {
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionRepo.create.mockResolvedValueOnce(left(new Error('constraint failed')));

      const result = await useCase.execute({
        text: 'What is the correct answer?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('throws on create', async () => {
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionRepo.create.mockRejectedValueOnce(new Error('connection lost'));

      const result = await useCase.execute({
        text: 'What is the correct answer?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });
  });

  describe('Edge Cases', () => {
    it('minimum text length', async () => {
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        text: '1234567890', // exactly 10 characters
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.text).toBe('1234567890');
      }
    });

    it('maximum text length', async () => {
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      const maxText = 'A'.repeat(1000);
      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        text: maxText,
        type: 'OPEN',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.text).toBe(maxText);
        expect(result.value.question.text.length).toBe(1000);
      }
    });

    it('unicode and special characters in text', async () => {
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      const unicodeText = 'Qual é a capital do Brasil? 🇧🇷 中文 العربية';
      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        text: unicodeText,
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.text).toBe(unicodeText);
      }
    });

    it('handles newlines and tabs in text', async () => {
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      const textWithFormatting = 'Question with\n\tnewlines and\ttabs\nfor formatting';
      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        text: textWithFormatting,
        type: 'OPEN',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.text).toBe(textWithFormatting);
      }
    });

    it('allows same text in different assessments', async () => {
      const assessment1 = Assessment.create({
        slug: 'test1',
        title: 'Test 1',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      const duplicateText = 'What is the correct answer?';
      const existingQuestionInDifferentAssessment = Question.create({
        text: duplicateText,
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: new UniqueEntityID('22222222-2222-2222-2222-222222222222'),
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment1));
      // Return empty array - no questions in THIS assessment with same text
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        text: duplicateText,
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.question.text).toBe(duplicateText);
      }
    });
  });

  describe('Concurrency and Race Conditions', () => {
    it('handles assessment deletion between validation and creation', async () => {
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      // Assessment gets deleted/disabled between validation and creation
      questionRepo.create.mockResolvedValueOnce(
        left(new Error('Foreign key constraint failed'))
      );

      const result = await useCase.execute({
        text: 'What is the correct answer?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('handles simultaneous question creation with same text', async () => {
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      const questionText = 'Concurrent question text';

      // First call succeeds
      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionRepo.create.mockResolvedValueOnce(right(undefined));

      const result1 = await useCase.execute({
        text: questionText,
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result1.isRight()).toBe(true);

      // Second call finds duplicate
      const existingQuestion = Question.create({
        text: questionText,
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: new UniqueEntityID('11111111-1111-1111-1111-111111111111'),
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([existingQuestion]));

      const result2 = await useCase.execute({
        text: questionText,
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result2.isLeft()).toBe(true);
      expect(result2.value).toBeInstanceOf(DuplicateQuestionError);
    });
  });

  describe('Missing Coverage Scenarios', () => {
    it('handles question with text containing only spaces after trim', async () => {
      // This test shows that 10 spaces pass Zod validation (length >= 10)
      // but would fail in Question.create entity validation
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));

      const result = await useCase.execute({
        text: '          ', // 10 spaces - passes Zod but fails entity creation
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isLeft()).toBe(true);
      // The error comes from Question.create validation, properly wrapped as InvalidInputError
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('allows creation of multiple questions for same argument in same assessment', async () => {
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'SIMULADO',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      const argumentId = '11111111-1111-1111-1111-111111111111';
      const assessmentId = '22222222-2222-2222-2222-222222222222';

      // First question for this argument
      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      argumentRepo.findById.mockResolvedValueOnce(right({} as Argument));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionRepo.create.mockResolvedValueOnce(right(undefined));

      const result1 = await useCase.execute({
        text: 'First question for this argument',
        type: 'MULTIPLE_CHOICE',
        assessmentId,
        argumentId,
      });

      expect(result1.isRight()).toBe(true);

      // Second question for same argument
      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      argumentRepo.findById.mockResolvedValueOnce(right({} as Argument));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionRepo.create.mockResolvedValueOnce(right(undefined));

      const result2 = await useCase.execute({
        text: 'Second question for same argument',
        type: 'MULTIPLE_CHOICE',
        assessmentId,
        argumentId,
      });

      expect(result2.isRight()).toBe(true);
    });

    it('validates that argument belongs to same assessment (future business rule)', async () => {
      // This test demonstrates that currently we don't validate argument-assessment relationship
      // But the system structure supports it for future implementation
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      argumentRepo.findById.mockResolvedValueOnce(right({} as Argument));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        text: 'Question with potentially unrelated argument',
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
        argumentId: '99999999-9999-9999-9999-999999999999', // Different assessment's argument
      });

      // Currently passes - no cross-validation implemented
      expect(result.isRight()).toBe(true);
    });

    it('handles question creation when assessment type is unknown/invalid', async () => {
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'UNKNOWN_TYPE' as any, // Invalid type
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        text: 'Question for unknown assessment type',
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      // Should default to MULTIPLE_CHOICE recommendation
      expect(result.isRight()).toBe(true);
    });

    it('handles very large number of existing questions in assessment', async () => {
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      // Create 100 existing questions
      const existingQuestions = Array.from({ length: 100 }, (_, i) => 
        Question.create({
          text: `Existing question ${i + 1}`,
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: new UniqueEntityID('11111111-1111-1111-1111-111111111111'),
        })
      );

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right(existingQuestions));
      questionRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        text: 'New unique question text',
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isRight()).toBe(true);
    });
  });

  describe('Medical Context Scenarios', () => {
    it('creates clinical case question for medical assessment', async () => {
      const assessment = Assessment.create({
        slug: 'clinical-cases',
        title: 'Clinical Cases Assessment',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      });

      const clinicalCase = 'Patient presents with chest pain, dyspnea, and diaphoresis. ECG shows ST elevation in leads II, III, and aVF. Troponin levels are elevated. Describe your diagnostic approach and immediate management plan.';

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      argumentRepo.findById.mockResolvedValueOnce(right({} as Argument));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        text: clinicalCase,
        type: 'OPEN',
        assessmentId: '11111111-1111-1111-1111-111111111111',
        argumentId: '22222222-2222-2222-2222-222222222222',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { question } = result.value;
        expect(question.text).toBe(clinicalCase);
        expect(question.type).toBe('OPEN');
        expect(question.argumentId).toBeDefined();
      }
    });

    it('creates anatomy question for quiz', async () => {
      const assessment = Assessment.create({
        slug: 'anatomy-quiz',
        title: 'Basic Anatomy Quiz',
        type: 'QUIZ',
        passingScore: 80,
        randomizeQuestions: true,
        randomizeOptions: true,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        text: 'Which structure is responsible for gas exchange in the lungs?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: '33333333-3333-3333-3333-333333333333',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { question } = result.value;
        expect(question.text).toContain('gas exchange');
        expect(question.type).toBe('MULTIPLE_CHOICE');
      }
    });

    it('creates pharmacology question for simulado', async () => {
      const assessment = Assessment.create({
        slug: 'pharmacology-simulado',
        title: 'Pharmacology Simulation Exam',
        type: 'SIMULADO',
        passingScore: 75,
        timeLimitInMinutes: 180,
        randomizeQuestions: true,
        randomizeOptions: false,
      });

      assessmentRepo.findById.mockResolvedValueOnce(right(assessment));
      argumentRepo.findById.mockResolvedValueOnce(right({} as Argument));
      questionRepo.findByAssessmentId.mockResolvedValueOnce(right([]));
      questionRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        text: 'What is the mechanism of action of ACE inhibitors in treating hypertension?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: '44444444-4444-4444-4444-444444444444',
        argumentId: '55555555-5555-5555-5555-555555555555',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { question } = result.value;
        expect(question.text).toContain('ACE inhibitors');
        expect(question.type).toBe('MULTIPLE_CHOICE');
        expect(question.argumentId).toBeDefined();
      }
    });
  });
});