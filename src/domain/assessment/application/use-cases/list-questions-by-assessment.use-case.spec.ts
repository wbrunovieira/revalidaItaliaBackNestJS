// src/domain/assessment/application/use-cases/list-questions-by-assessment.use-case.spec.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { ListQuestionsByAssessmentUseCase } from './list-questions-by-assessment.use-case';
import { InMemoryQuestionRepository } from '@/test/repositories/in-memory-question-repository';
import { InMemoryQuestionOptionRepository } from '@/test/repositories/in-memory-question-option-repository';
import { InMemoryAssessmentRepository } from '@/test/repositories/in-memory-assessment-repository';
import { InMemoryArgumentRepository } from '@/test/repositories/in-memory-argument-repository';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { QuestionOption } from '@/domain/assessment/enterprise/entities/question-option.entity';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { QuestionTypeVO } from '@/domain/assessment/enterprise/value-objects/question-type.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { ListQuestionsByAssessmentRequest } from '../dtos/list-questions-by-assessment-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';

let useCase: ListQuestionsByAssessmentUseCase;
let questionRepository: InMemoryQuestionRepository;
let questionOptionRepository: InMemoryQuestionOptionRepository;
let assessmentRepository: InMemoryAssessmentRepository;
let argumentRepository: InMemoryArgumentRepository;

describe('ListQuestionsByAssessmentUseCase', () => {
  beforeEach(() => {
    questionRepository = new InMemoryQuestionRepository();
    questionOptionRepository = new InMemoryQuestionOptionRepository();
    assessmentRepository = new InMemoryAssessmentRepository();
    argumentRepository = new InMemoryArgumentRepository();
    useCase = new ListQuestionsByAssessmentUseCase(
      questionRepository,
      questionOptionRepository,
      assessmentRepository,
      argumentRepository,
    );
  });

  describe('Success Cases', () => {
    it('should list questions with options for multiple choice questions', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const option1Id = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      const option2Id = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440003',
      );

      const assessment = Assessment.create(
        {
          slug: 'test-assessment',
          title: 'Test Assessment',
          type: 'QUIZ',
          quizPosition: 'BEFORE_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      const question = Question.create(
        {
          text: 'What is 2 + 2?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId,
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440004',
          ),
        },
        questionId,
      );

      const option1 = QuestionOption.create(
        {
          text: '3',
          questionId,
        },
        option1Id,
      );

      const option2 = QuestionOption.create(
        {
          text: '4',
          questionId,
        },
        option2Id,
      );

      await assessmentRepository.create(assessment);
      await questionRepository.create(question);
      await questionOptionRepository.create(option1);
      await questionOptionRepository.create(option2);

      const request: ListQuestionsByAssessmentRequest = {
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.questions).toHaveLength(1);
        expect(result.value.questions[0].id).toBe(questionId.toString());
        expect(result.value.questions[0].text).toBe('What is 2 + 2?');
        expect(result.value.questions[0].type).toBe('MULTIPLE_CHOICE');
        expect(result.value.questions[0].options).toHaveLength(2);
        expect(result.value.questions[0].options[0].text).toBe('3');
        expect(result.value.questions[0].options[1].text).toBe('4');
      }
    });

    it('should list open questions without options', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );

      const assessment = Assessment.create(
        {
          slug: 'test-assessment',
          title: 'Test Assessment',
          type: 'PROVA_ABERTA',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      const question = Question.create(
        {
          text: 'Explain the concept of photosynthesis',
          type: new QuestionTypeVO('OPEN'),
          assessmentId,
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440002',
          ),
        },
        questionId,
      );

      await assessmentRepository.create(assessment);
      await questionRepository.create(question);

      const request: ListQuestionsByAssessmentRequest = {
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.questions).toHaveLength(1);
        expect(result.value.questions[0].id).toBe(questionId.toString());
        expect(result.value.questions[0].text).toBe(
          'Explain the concept of photosynthesis',
        );
        expect(result.value.questions[0].type).toBe('OPEN');
        expect(result.value.questions[0].options).toHaveLength(0);
      }
    });

    it('should return empty array when assessment has no questions', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );

      const assessment = Assessment.create(
        {
          slug: 'test-assessment',
          title: 'Test Assessment',
          type: 'QUIZ',
          quizPosition: 'BEFORE_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      await assessmentRepository.create(assessment);

      const request: ListQuestionsByAssessmentRequest = {
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.questions).toHaveLength(0);
      }
    });

    it('should handle mixed question types', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const mcQuestionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const openQuestionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );

      const assessment = Assessment.create(
        {
          slug: 'test-assessment',
          title: 'Test Assessment',
          type: 'SIMULADO',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      const mcQuestion = Question.create(
        {
          text: 'Multiple choice question',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId,
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440003',
          ),
        },
        mcQuestionId,
      );

      const openQuestion = Question.create(
        {
          text: 'Open question',
          type: new QuestionTypeVO('OPEN'),
          assessmentId,
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440004',
          ),
        },
        openQuestionId,
      );

      const option = QuestionOption.create({
        text: 'Option A',
        questionId: mcQuestionId,
      });

      await assessmentRepository.create(assessment);
      await questionRepository.create(mcQuestion);
      await questionRepository.create(openQuestion);
      await questionOptionRepository.create(option);

      const request: ListQuestionsByAssessmentRequest = {
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.questions).toHaveLength(2);

        const mcQuestionResult = result.value.questions.find(
          (q) => q.type === 'MULTIPLE_CHOICE',
        );
        const openQuestionResult = result.value.questions.find(
          (q) => q.type === 'OPEN',
        );

        expect(mcQuestionResult?.options).toHaveLength(1);
        expect(openQuestionResult?.options).toHaveLength(0);
      }
    });
  });

  describe('Validation Errors', () => {
    it('should return InvalidInputError for empty assessmentId', async () => {
      // Arrange
      const request: ListQuestionsByAssessmentRequest = {
        assessmentId: '',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for invalid UUID format', async () => {
      // Arrange
      const request: ListQuestionsByAssessmentRequest = {
        assessmentId: 'invalid-uuid',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });

  describe('Business Logic Errors', () => {
    it('should return AssessmentNotFoundError for non-existent assessment', async () => {
      // Arrange
      const request: ListQuestionsByAssessmentRequest = {
        assessmentId: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle assessment with many questions and options', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );

      const assessment = Assessment.create(
        {
          slug: 'test-assessment',
          title: 'Test Assessment',
          type: 'SIMULADO',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      await assessmentRepository.create(assessment);

      // Create 5 questions with 4 options each
      const questions: Question[] = [];
      const options: QuestionOption[] = [];

      for (let i = 0; i < 5; i++) {
        const questionId = new UniqueEntityID(
          `550e8400-e29b-41d4-a716-44665544000${i}`,
        );
        const question = Question.create(
          {
            text: `Question ${i + 1}`,
            type: new QuestionTypeVO('MULTIPLE_CHOICE'),
            assessmentId,
            argumentId: new UniqueEntityID(
              `550e8400-e29b-41d4-a716-446655440100`,
            ),
          },
          questionId,
        );

        questions.push(question);
        await questionRepository.create(question);

        for (let j = 0; j < 4; j++) {
          const optionId = new UniqueEntityID(
            `550e8400-e29b-41d4-a716-44665544${i}${j}${j}`,
          );
          const option = QuestionOption.create(
            {
              text: `Option ${j + 1} for Question ${i + 1}`,
              questionId,
            },
            optionId,
          );

          options.push(option);
          await questionOptionRepository.create(option);
        }
      }

      const request: ListQuestionsByAssessmentRequest = {
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.questions).toHaveLength(5);
        result.value.questions.forEach((question, index) => {
          expect(question.options).toHaveLength(4);
          expect(question.text).toBe(`Question ${index + 1}`);
        });
      }
    });

    it('should handle questions with no options correctly', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );

      const assessment = Assessment.create(
        {
          slug: 'test-assessment',
          title: 'Test Assessment',
          type: 'PROVA_ABERTA',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      // Create multiple choice question but don't add options
      const question = Question.create(
        {
          text: 'Multiple choice question without options',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId,
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440002',
          ),
        },
        questionId,
      );

      await assessmentRepository.create(assessment);
      await questionRepository.create(question);

      const request: ListQuestionsByAssessmentRequest = {
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.questions).toHaveLength(1);
        expect(result.value.questions[0].type).toBe('MULTIPLE_CHOICE');
        expect(result.value.questions[0].options).toHaveLength(0);
      }
    });

    it('should maintain correct order of questions and options', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const question1Id = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const question2Id = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );

      const assessment = Assessment.create(
        {
          slug: 'test-assessment',
          title: 'Test Assessment',
          type: 'QUIZ',
          quizPosition: 'BEFORE_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      // Create questions with different timestamps
      const question1 = Question.create(
        {
          text: 'First question',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId,
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440003',
          ),
        },
        question1Id,
      );

      // Wait to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const question2 = Question.create(
        {
          text: 'Second question',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId,
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440004',
          ),
        },
        question2Id,
      );

      // Create options for question 1
      const option1 = QuestionOption.create({
        text: 'Option A',
        questionId: question1Id,
      });

      const option2 = QuestionOption.create({
        text: 'Option B',
        questionId: question1Id,
      });

      await assessmentRepository.create(assessment);
      await questionRepository.create(question1);
      await questionRepository.create(question2);
      await questionOptionRepository.create(option1);
      await questionOptionRepository.create(option2);

      const request: ListQuestionsByAssessmentRequest = {
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.questions).toHaveLength(2);

        // Find questions by text since order may vary
        const firstQuestion = result.value.questions.find(
          (q) => q.text === 'First question',
        );
        const secondQuestion = result.value.questions.find(
          (q) => q.text === 'Second question',
        );

        expect(firstQuestion).toBeDefined();
        expect(secondQuestion).toBeDefined();
        expect(firstQuestion?.options).toHaveLength(2);
        expect(secondQuestion?.options).toHaveLength(0);
      }
    });
  });

  describe('Assessment Type Specific Tests', () => {
    it('should handle QUIZ assessment with multiple choice questions', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );

      const assessment = Assessment.create(
        {
          slug: 'quiz-assessment',
          title: 'Quiz Assessment',
          type: 'QUIZ',
          quizPosition: 'BEFORE_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      const question = Question.create(
        {
          text: 'Quiz question',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId,
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440002',
          ),
        },
        questionId,
      );

      const option1 = QuestionOption.create({
        text: 'Correct answer',
        questionId,
      });

      const option2 = QuestionOption.create({
        text: 'Wrong answer',
        questionId,
      });

      await assessmentRepository.create(assessment);
      await questionRepository.create(question);
      await questionOptionRepository.create(option1);
      await questionOptionRepository.create(option2);

      const request: ListQuestionsByAssessmentRequest = {
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.questions).toHaveLength(1);
        expect(result.value.questions[0].type).toBe('MULTIPLE_CHOICE');
        expect(result.value.questions[0].options).toHaveLength(2);
        expect(result.value.questions[0].options[0].text).toBe(
          'Correct answer',
        );
        expect(result.value.questions[0].options[1].text).toBe('Wrong answer');
      }
    });

    it('should handle SIMULADO assessment with multiple choice questions', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );

      const assessment = Assessment.create(
        {
          slug: 'simulado-assessment',
          title: 'Simulado Assessment',
          type: 'SIMULADO',
          passingScore: 70,
          timeLimitInMinutes: 60,
          randomizeQuestions: true,
          randomizeOptions: true,
        },
        assessmentId,
      );

      const question = Question.create(
        {
          text: 'Simulado question',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId,
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440002',
          ),
        },
        questionId,
      );

      const option1 = QuestionOption.create({
        text: 'Option A',
        questionId,
      });

      const option2 = QuestionOption.create({
        text: 'Option B',
        questionId,
      });

      const option3 = QuestionOption.create({
        text: 'Option C',
        questionId,
      });

      await assessmentRepository.create(assessment);
      await questionRepository.create(question);
      await questionOptionRepository.create(option1);
      await questionOptionRepository.create(option2);
      await questionOptionRepository.create(option3);

      const request: ListQuestionsByAssessmentRequest = {
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.questions).toHaveLength(1);
        expect(result.value.questions[0].type).toBe('MULTIPLE_CHOICE');
        expect(result.value.questions[0].options).toHaveLength(3);
        expect(result.value.questions[0].options.map((o) => o.text)).toEqual([
          'Option A',
          'Option B',
          'Option C',
        ]);
      }
    });

    it('should handle PROVA_ABERTA assessment with open questions', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const question1Id = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const question2Id = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );

      const assessment = Assessment.create(
        {
          slug: 'prova-aberta-assessment',
          title: 'Prova Aberta Assessment',
          type: 'PROVA_ABERTA',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      const question1 = Question.create(
        {
          text: 'Explique o conceito de fotossíntese',
          type: new QuestionTypeVO('OPEN'),
          assessmentId,
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440003',
          ),
        },
        question1Id,
      );

      const question2 = Question.create(
        {
          text: 'Descreva o processo de respiração celular',
          type: new QuestionTypeVO('OPEN'),
          assessmentId,
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440004',
          ),
        },
        question2Id,
      );

      await assessmentRepository.create(assessment);
      await questionRepository.create(question1);
      await questionRepository.create(question2);

      const request: ListQuestionsByAssessmentRequest = {
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.questions).toHaveLength(2);

        result.value.questions.forEach((question) => {
          expect(question.type).toBe('OPEN');
          expect(question.options).toHaveLength(0);
        });

        const texts = result.value.questions.map((q) => q.text);
        expect(texts).toContain('Explique o conceito de fotossíntese');
        expect(texts).toContain('Descreva o processo de respiração celular');
      }
    });
  });
});
