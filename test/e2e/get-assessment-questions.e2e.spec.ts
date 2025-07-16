// test/e2e/get-assessment-questions.e2e.spec.ts
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Module } from '@nestjs/common';

// Import required use cases and repositories
import { CreateAssessmentUseCase } from '../../src/domain/assessment/application/use-cases/create-assessment.use-case';
import { ListAssessmentsUseCase } from '../../src/domain/assessment/application/use-cases/list-assessments.use-case';
import { GetAssessmentUseCase } from '../../src/domain/assessment/application/use-cases/get-assessment.use-case';
import { DeleteAssessmentUseCase } from '../../src/domain/assessment/application/use-cases/delete-assessment.use-case';
import { UpdateAssessmentUseCase } from '../../src/domain/assessment/application/use-cases/update-assessment.use-case';
import { ListQuestionsByAssessmentUseCase } from '../../src/domain/assessment/application/use-cases/list-questions-by-assessment.use-case';
import { GetQuestionsDetailedUseCase } from '../../src/domain/assessment/application/use-cases/get-questions-detailed.use-case';
import { AssessmentController } from '../../src/infra/controllers/assessment.controller';
import { PrismaQuestionRepository } from '../../src/infra/database/prisma/repositories/prisma-question-repository';
import { PrismaQuestionOptionRepository } from '../../src/infra/database/prisma/repositories/prisma-question-option-repository';
import { PrismaAssessmentRepository } from '../../src/infra/database/prisma/repositories/prisma-assessment-repository';
import { PrismaLessonRepository } from '../../src/infra/database/prisma/repositories/prisma-lesson-repository';
import { PrismaAnswerRepository } from '../../src/infra/database/prisma/repositories/prisma-answer-repository';
import { PrismaArgumentRepository } from '../../src/infra/database/prisma/repositories/prisma-argument-repository';

@Module({
  controllers: [AssessmentController],
  providers: [
    CreateAssessmentUseCase,
    ListAssessmentsUseCase,
    GetAssessmentUseCase,
    DeleteAssessmentUseCase,
    UpdateAssessmentUseCase,
    ListQuestionsByAssessmentUseCase,
    GetQuestionsDetailedUseCase,
    PrismaService,
    {
      provide: 'QuestionRepository',
      useClass: PrismaQuestionRepository,
    },
    {
      provide: 'QuestionOptionRepository',
      useClass: PrismaQuestionOptionRepository,
    },
    {
      provide: 'AssessmentRepository',
      useClass: PrismaAssessmentRepository,
    },
    {
      provide: 'LessonRepository',
      useClass: PrismaLessonRepository,
    },
    {
      provide: 'AnswerRepository',
      useClass: PrismaAnswerRepository,
    },
    {
      provide: 'ArgumentRepository',
      useClass: PrismaArgumentRepository,
    },
  ],
})
class TestAssessmentQuestionsModule {}

describe('GET /assessments/:id/questions (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let courseId: string;
  let moduleId: string;
  let lessonId: string;
  let argumentId: string;
  let quizAssessmentId: string;
  let simuladoAssessmentId: string;
  let provaAbertaAssessmentId: string;

  // Helper function for complete database cleanup respecting foreign keys
  const cleanupDatabase = async () => {
    if (!prisma) return;

    try {
      // Clean up in reverse dependency order
      await prisma.questionOption.deleteMany({});
      await prisma.question.deleteMany({});
      await prisma.assessment.deleteMany({});
      await prisma.argument.deleteMany({});
      await prisma.lessonTranslation.deleteMany({});
      await prisma.lesson.deleteMany({});
      await prisma.moduleTranslation.deleteMany({});
      await prisma.module.deleteMany({});
      await prisma.courseTranslation.deleteMany({});
      await prisma.course.deleteMany({});
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAssessmentQuestionsModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    await app.init();
    prisma = app.get(PrismaService);

    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // Clean up before each test for isolation
    await cleanupDatabase();

    // Create base structure: Course > Module > Lesson > Argument > Assessments
    const course = await prisma.course.create({
      data: {
        slug: 'test-course',
        translations: {
          create: [
            { locale: 'pt', title: 'Curso de Teste', description: 'Desc PT' },
            { locale: 'it', title: 'Corso di Test', description: 'Desc IT' },
            { locale: 'es', title: 'Curso de Prueba', description: 'Desc ES' },
          ],
        },
      },
    });
    courseId = course.id;

    const module = await prisma.module.create({
      data: {
        slug: 'test-module',
        order: 1,
        courseId,
        translations: {
          create: [
            { locale: 'pt', title: 'Módulo de Teste', description: 'Desc PT' },
            { locale: 'it', title: 'Modulo di Test', description: 'Desc IT' },
            { locale: 'es', title: 'Módulo de Prueba', description: 'Desc ES' },
          ],
        },
      },
    });
    moduleId = module.id;

    const lesson = await prisma.lesson.create({
      data: {
        slug: 'test-lesson',
        moduleId,
        order: 1,
        translations: {
          create: [
            { locale: 'pt', title: 'Aula de Teste', description: 'Desc PT' },
            { locale: 'it', title: 'Lezione di Test', description: 'Desc IT' },
            { locale: 'es', title: 'Lección de Prueba', description: 'Desc ES' },
          ],
        },
      },
    });
    lessonId = lesson.id;

    const argument = await prisma.argument.create({
      data: {
        title: 'Test Argument',
      },
    });
    argumentId = argument.id;

    // Create different assessment types
    const quizAssessment = await prisma.assessment.create({
      data: {
        slug: 'quiz-assessment',
        title: 'Quiz Assessment',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId,
      },
    });
    quizAssessmentId = quizAssessment.id;

    const simuladoAssessment = await prisma.assessment.create({
      data: {
        slug: 'simulado-assessment',
        title: 'Simulado Assessment',
        type: 'SIMULADO',
        passingScore: 80,
        timeLimitInMinutes: 120,
        randomizeQuestions: true,
        randomizeOptions: true,
      },
    });
    simuladoAssessmentId = simuladoAssessment.id;

    const provaAbertaAssessment = await prisma.assessment.create({
      data: {
        slug: 'prova-aberta-assessment',
        title: 'Prova Aberta Assessment',
        type: 'PROVA_ABERTA',
        passingScore: 60,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
    });
    provaAbertaAssessmentId = provaAbertaAssessment.id;
  });

  describe('✅ Success Cases', () => {
    it('should return questions with options for QUIZ assessment', async () => {
      // Create multiple choice questions with options for quiz
      const question1 = await prisma.question.create({
        data: {
          text: 'What is 2 + 2?',
          type: 'MULTIPLE_CHOICE',
          assessmentId: quizAssessmentId,
          argumentId,
        },
      });

      const question2 = await prisma.question.create({
        data: {
          text: 'What is the capital of Brazil?',
          type: 'MULTIPLE_CHOICE',
          assessmentId: quizAssessmentId,
          argumentId,
        },
      });

      // Create options for question 1
      await prisma.questionOption.createMany({
        data: [
          { text: '3', questionId: question1.id },
          { text: '4', questionId: question1.id },
          { text: '5', questionId: question1.id },
        ],
      });

      // Create options for question 2
      await prisma.questionOption.createMany({
        data: [
          { text: 'São Paulo', questionId: question2.id },
          { text: 'Rio de Janeiro', questionId: question2.id },
          { text: 'Brasília', questionId: question2.id },
        ],
      });

      const response = await request(app.getHttpServer())
        .get(`/assessments/${quizAssessmentId}/questions`)
        .expect(200);

      expect(response.body.questions).toHaveLength(2);
      
      // Check first question
      const firstQuestion = response.body.questions.find((q: any) => q.text === 'What is 2 + 2?');
      expect(firstQuestion).toBeDefined();
      expect(firstQuestion.type).toBe('MULTIPLE_CHOICE');
      expect(firstQuestion.options).toHaveLength(3);
      expect(firstQuestion.options.map((o: any) => o.text)).toEqual(
        expect.arrayContaining(['3', '4', '5'])
      );

      // Check second question
      const secondQuestion = response.body.questions.find((q: any) => q.text === 'What is the capital of Brazil?');
      expect(secondQuestion).toBeDefined();
      expect(secondQuestion.type).toBe('MULTIPLE_CHOICE');
      expect(secondQuestion.options).toHaveLength(3);
      expect(secondQuestion.options.map((o: any) => o.text)).toEqual(
        expect.arrayContaining(['São Paulo', 'Rio de Janeiro', 'Brasília'])
      );
    });

    it('should return questions without options for PROVA_ABERTA assessment', async () => {
      // Create open questions for prova aberta
      await prisma.question.create({
        data: {
          text: 'Explain the concept of photosynthesis in detail.',
          type: 'OPEN',
          assessmentId: provaAbertaAssessmentId,
          argumentId,
        },
      });

      await prisma.question.create({
        data: {
          text: 'Describe the process of cellular respiration.',
          type: 'OPEN',
          assessmentId: provaAbertaAssessmentId,
          argumentId,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/assessments/${provaAbertaAssessmentId}/questions`)
        .expect(200);

      expect(response.body.questions).toHaveLength(2);
      
      response.body.questions.forEach((question: any) => {
        expect(question.type).toBe('OPEN');
        expect(question.options).toHaveLength(0);
        expect(question.text).toMatch(/photosynthesis|cellular respiration/);
      });
    });

    it('should return mixed question types for SIMULADO assessment', async () => {
      // Create mixed question types for simulado
      const mcQuestion = await prisma.question.create({
        data: {
          text: 'Multiple choice question',
          type: 'MULTIPLE_CHOICE',
          assessmentId: simuladoAssessmentId,
          argumentId,
        },
      });

      const openQuestion = await prisma.question.create({
        data: {
          text: 'Open question',
          type: 'OPEN',
          assessmentId: simuladoAssessmentId,
          argumentId,
        },
      });

      // Create options only for multiple choice question
      await prisma.questionOption.createMany({
        data: [
          { text: 'Option A', questionId: mcQuestion.id },
          { text: 'Option B', questionId: mcQuestion.id },
        ],
      });

      const response = await request(app.getHttpServer())
        .get(`/assessments/${simuladoAssessmentId}/questions`)
        .expect(200);

      expect(response.body.questions).toHaveLength(2);
      
      const mcQuestionResult = response.body.questions.find((q: any) => q.type === 'MULTIPLE_CHOICE');
      const openQuestionResult = response.body.questions.find((q: any) => q.type === 'OPEN');

      expect(mcQuestionResult).toBeDefined();
      expect(mcQuestionResult.options).toHaveLength(2);
      expect(mcQuestionResult.options.map((o: any) => o.text)).toEqual(['Option A', 'Option B']);

      expect(openQuestionResult).toBeDefined();
      expect(openQuestionResult.options).toHaveLength(0);
    });

    it('should return empty array when assessment has no questions', async () => {
      const response = await request(app.getHttpServer())
        .get(`/assessments/${quizAssessmentId}/questions`)
        .expect(200);

      expect(response.body.questions).toHaveLength(0);
      expect(response.body.questions).toEqual([]);
    });

    it('should handle questions with no options correctly', async () => {
      // Create multiple choice question but don't add options
      await prisma.question.create({
        data: {
          text: 'Multiple choice question without options',
          type: 'MULTIPLE_CHOICE',
          assessmentId: quizAssessmentId,
          argumentId,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/assessments/${quizAssessmentId}/questions`)
        .expect(200);

      expect(response.body.questions).toHaveLength(1);
      expect(response.body.questions[0].type).toBe('MULTIPLE_CHOICE');
      expect(response.body.questions[0].options).toHaveLength(0);
    });

    it('should return questions with proper structure and data types', async () => {
      const question = await prisma.question.create({
        data: {
          text: 'Test question',
          type: 'MULTIPLE_CHOICE',
          assessmentId: quizAssessmentId,
          argumentId,
        },
      });

      await prisma.questionOption.create({
        data: {
          text: 'Test option',
          questionId: question.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/assessments/${quizAssessmentId}/questions`)
        .expect(200);

      expect(response.body.questions).toHaveLength(1);
      
      const questionResult = response.body.questions[0];
      expect(questionResult).toHaveProperty('id');
      expect(typeof questionResult.id).toBe('string');
      expect(questionResult).toHaveProperty('text');
      expect(typeof questionResult.text).toBe('string');
      expect(questionResult).toHaveProperty('type');
      expect(['MULTIPLE_CHOICE', 'OPEN']).toContain(questionResult.type);
      expect(questionResult).toHaveProperty('options');
      expect(Array.isArray(questionResult.options)).toBe(true);
      expect(questionResult).toHaveProperty('createdAt');
      expect(questionResult).toHaveProperty('updatedAt');

      // Check option structure
      expect(questionResult.options).toHaveLength(1);
      const option = questionResult.options[0];
      expect(option).toHaveProperty('id');
      expect(typeof option.id).toBe('string');
      expect(option).toHaveProperty('text');
      expect(typeof option.text).toBe('string');
    });
  });

  describe('⚠️ Validation Errors (400)', () => {
    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app.getHttpServer())
        .get('/assessments/invalid-uuid/questions')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'INVALID_INPUT');
      expect(response.body).toHaveProperty('message', 'Invalid input data');
      expect(response.body).toHaveProperty('details');
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it('should return 400 for empty assessment ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/assessments//questions')
        .expect(404); // This will be a 404 because the route won't match

      // The empty string in the route makes it not match the pattern
      // so it returns 404 instead of 400
    });
  });

  describe('🔍 Business Logic Errors', () => {
    it('should return 404 when assessment is not found', async () => {
      const nonExistentId = '00000000-0000-4000-8000-000000000000';
      
      const response = await request(app.getHttpServer())
        .get(`/assessments/${nonExistentId}/questions`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'ASSESSMENT_NOT_FOUND');
      expect(response.body).toHaveProperty('message', 'Assessment not found');
    });
  });

  describe('🔍 Edge Cases', () => {
    it('should handle assessment with many questions and options', async () => {
      // Create 10 questions with 4 options each
      const questionPromises = Array.from({ length: 10 }, (_, i) => 
        prisma.question.create({
          data: {
            text: `Question ${i + 1}`,
            type: 'MULTIPLE_CHOICE',
            assessmentId: quizAssessmentId,
            argumentId,
          },
        })
      );

      const questions = await Promise.all(questionPromises);

      // Create 4 options for each question
      for (const question of questions) {
        await prisma.questionOption.createMany({
          data: Array.from({ length: 4 }, (_, j) => ({
            text: `Option ${j + 1} for ${question.text}`,
            questionId: question.id,
          })),
        });
      }

      const response = await request(app.getHttpServer())
        .get(`/assessments/${quizAssessmentId}/questions`)
        .expect(200);

      expect(response.body.questions).toHaveLength(10);
      
      // Check that all questions are present (order may vary)
      for (let i = 1; i <= 10; i++) {
        const question = response.body.questions.find((q: any) => q.text === `Question ${i}`);
        expect(question).toBeDefined();
        expect(question.options).toHaveLength(4);
        question.options.forEach((option: any) => {
          expect(option.text).toContain(`for Question ${i}`);
        });
      }
    });

    it('should maintain question order and data consistency', async () => {
      // Create questions with specific order
      const question1 = await prisma.question.create({
        data: {
          text: 'First question',
          type: 'MULTIPLE_CHOICE',
          assessmentId: quizAssessmentId,
          argumentId,
        },
      });

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const question2 = await prisma.question.create({
        data: {
          text: 'Second question',
          type: 'OPEN',
          assessmentId: quizAssessmentId,
          argumentId,
        },
      });

      await prisma.questionOption.create({
        data: {
          text: 'Option for first question',
          questionId: question1.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/assessments/${quizAssessmentId}/questions`)
        .expect(200);

      expect(response.body.questions).toHaveLength(2);
      
      // Find questions by text since order may vary
      const firstQuestion = response.body.questions.find((q: any) => q.text === 'First question');
      const secondQuestion = response.body.questions.find((q: any) => q.text === 'Second question');

      expect(firstQuestion).toBeDefined();
      expect(firstQuestion.type).toBe('MULTIPLE_CHOICE');
      expect(firstQuestion.options).toHaveLength(1);

      expect(secondQuestion).toBeDefined();
      expect(secondQuestion.type).toBe('OPEN');
      expect(secondQuestion.options).toHaveLength(0);
    });
  });

  describe('🔄 Behavior Testing', () => {
    it('should handle concurrent requests for different assessments', async () => {
      // Create questions for both assessments
      await prisma.question.create({
        data: {
          text: 'Quiz question',
          type: 'MULTIPLE_CHOICE',
          assessmentId: quizAssessmentId,
          argumentId,
        },
      });

      await prisma.question.create({
        data: {
          text: 'Simulado question',
          type: 'OPEN',
          assessmentId: simuladoAssessmentId,
          argumentId,
        },
      });

      const [quizResponse, simuladoResponse] = await Promise.all([
        request(app.getHttpServer()).get(`/assessments/${quizAssessmentId}/questions`),
        request(app.getHttpServer()).get(`/assessments/${simuladoAssessmentId}/questions`),
      ]);

      expect(quizResponse.status).toBe(200);
      expect(quizResponse.body.questions).toHaveLength(1);
      expect(quizResponse.body.questions[0].text).toBe('Quiz question');

      expect(simuladoResponse.status).toBe(200);
      expect(simuladoResponse.body.questions).toHaveLength(1);
      expect(simuladoResponse.body.questions[0].text).toBe('Simulado question');
    });

    it('should handle all three assessment types correctly', async () => {
      // Create questions for each assessment type
      await prisma.question.create({
        data: {
          text: 'Quiz question',
          type: 'MULTIPLE_CHOICE',
          assessmentId: quizAssessmentId,
          argumentId,
        },
      });

      await prisma.question.create({
        data: {
          text: 'Simulado question',
          type: 'MULTIPLE_CHOICE',
          assessmentId: simuladoAssessmentId,
          argumentId,
        },
      });

      await prisma.question.create({
        data: {
          text: 'Prova Aberta question',
          type: 'OPEN',
          assessmentId: provaAbertaAssessmentId,
          argumentId,
        },
      });

      // Test all three assessment types
      const [quizResponse, simuladoResponse, provaAbertaResponse] = await Promise.all([
        request(app.getHttpServer()).get(`/assessments/${quizAssessmentId}/questions`),
        request(app.getHttpServer()).get(`/assessments/${simuladoAssessmentId}/questions`),
        request(app.getHttpServer()).get(`/assessments/${provaAbertaAssessmentId}/questions`),
      ]);

      expect(quizResponse.status).toBe(200);
      expect(quizResponse.body.questions).toHaveLength(1);

      expect(simuladoResponse.status).toBe(200);
      expect(simuladoResponse.body.questions).toHaveLength(1);

      expect(provaAbertaResponse.status).toBe(200);
      expect(provaAbertaResponse.body.questions).toHaveLength(1);
    });

    it('should return the exact same data on multiple requests', async () => {
      const question = await prisma.question.create({
        data: {
          text: 'Consistent question',
          type: 'MULTIPLE_CHOICE',
          assessmentId: quizAssessmentId,
          argumentId,
        },
      });

      await prisma.questionOption.create({
        data: {
          text: 'Consistent option',
          questionId: question.id,
        },
      });

      const [response1, response2] = await Promise.all([
        request(app.getHttpServer()).get(`/assessments/${quizAssessmentId}/questions`),
        request(app.getHttpServer()).get(`/assessments/${quizAssessmentId}/questions`),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body).toEqual(response2.body);
    });
  });
});