// test/e2e/attempts/shared/attempt-test-setup.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../../../../src/infra/auth/guards/jwt-auth.guard';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { StartAttemptUseCase } from '../../../../src/domain/assessment/application/use-cases/start-attempt.use-case';
import { SubmitAnswerUseCase } from '../../../../src/domain/assessment/application/use-cases/submit-answer.use-case';
import { SubmitAttemptUseCase } from '../../../../src/domain/assessment/application/use-cases/submit-attempt.use-case';
import { GetAttemptResultsUseCase } from '../../../../src/domain/assessment/application/use-cases/get-attempt-results.use-case';
import { ReviewOpenAnswerUseCase } from '../../../../src/domain/assessment/application/use-cases/review-open-answer.use-case';
import { ListAttemptsUseCase } from '../../../../src/domain/assessment/application/use-cases/list-attempts.use-case';
import { ListPendingReviewsUseCase } from '../../../../src/domain/assessment/application/use-cases/list-pending-reviews.use-case';
import { AttemptController } from '../../../../src/infra/controllers/attempt.controller';
import { PrismaAttemptRepository } from '../../../../src/infra/database/prisma/repositories/prisma-attempt-repository';
import { PrismaAssessmentRepository } from '../../../../src/infra/database/prisma/repositories/prisma-assessment-repository';
import { PrismaUserAggregatedViewRepository } from '../../../../src/infra/database/prisma/repositories/prisma-user-aggregated-view-repository';
import { PrismaQuestionRepository } from '../../../../src/infra/database/prisma/repositories/prisma-question-repository';
import { PrismaAttemptAnswerRepository } from '../../../../src/infra/database/prisma/repositories/prisma-attempt-answer-repository';
import { PrismaAnswerRepository } from '../../../../src/infra/database/prisma/repositories/prisma-answer-repository';
import { PrismaArgumentRepository } from '../../../../src/infra/database/prisma/repositories/prisma-argument-repository';

@Module({
  controllers: [AttemptController],
  providers: [
    StartAttemptUseCase,
    SubmitAnswerUseCase,
    SubmitAttemptUseCase,
    GetAttemptResultsUseCase,
    ReviewOpenAnswerUseCase,
    ListAttemptsUseCase,
    ListPendingReviewsUseCase,
    PrismaService,
    {
      provide: 'AttemptRepository',
      useClass: PrismaAttemptRepository,
    },
    {
      provide: 'AssessmentRepository',
      useClass: PrismaAssessmentRepository,
    },
    {
      provide: 'UserAggregatedViewRepository',
      useClass: PrismaUserAggregatedViewRepository,
    },
    {
      provide: 'QuestionRepository',
      useClass: PrismaQuestionRepository,
    },
    {
      provide: 'AttemptAnswerRepository',
      useClass: PrismaAttemptAnswerRepository,
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
export class TestAttemptModule {}

export class AttemptTestSetup {
  public app: INestApplication;
  public prisma: PrismaService;

  // Base structure IDs
  public courseId: string;
  public moduleId: string;
  public lessonId: string;

  // Assessment IDs
  public quizAssessmentId: string;
  public simuladoAssessmentId: string;
  public provaAbertaAssessmentId: string;

  // User IDs
  public studentUserId: string;
  public tutorUserId: string;

  // Question IDs (for creating assessments)
  public multipleChoiceQuestionId: string;
  public openQuestionId: string;
  public correctOptionId: string;
  public incorrectOptionId: string;

  // Attempt IDs (created during tests)
  public attemptId: string;

  async initialize(): Promise<void> {
    // Mock user that will be injected when @CurrentUser() is used
    const mockUser = {
      sub: '550e8400-e29b-41d4-a716-446655440001', // Default to student user ID
      email: 'student@test.com',
      role: 'student',
    };

    const moduleRef = await Test.createTestingModule({
      imports: [TestAttemptModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const request = context.switchToHttp().getRequest();
          const authHeader = request.headers.authorization;

          // Check if Authorization header is present
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return false; // Reject requests without auth header
          }

          // Extract user info from mock token
          const token = authHeader.replace('Bearer ', '');
          if (token.startsWith('mock-token-')) {
            // Parse token format: mock-token-{userId}-{role}
            const tokenParts = token.replace('mock-token-', '').split('-');
            const userId = tokenParts.slice(0, -1).join('-'); // All parts except last are userId
            const role = tokenParts[tokenParts.length - 1]; // Last part is role

            request.user = {
              sub: userId,
              email: `${role}@test.com`,
              role: role,
            };
            return true;
          }

          // Fallback for other tests
          request.user = mockUser;
          return true;
        },
      })
      .compile();

    this.app = moduleRef.createNestApplication();
    this.app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    await this.app.init();
    this.prisma = this.app.get(PrismaService);

    await this.cleanupDatabase();
  }

  async setupTestData(): Promise<void> {
    // Clean up before each test for isolation
    await this.cleanupDatabase();

    // Create users first
    await this.createTestUsers();

    // Create base structure: Course > Module > Lesson > Assessments
    await this.createBaseCourseStructure();

    // Create assessments
    await this.createTestAssessments();
  }

  private async createTestUsers(): Promise<void> {
    // Create student user
    const studentIdentity = await this.prisma.userIdentity.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'student@test.com',
        password: 'hashed_password',
        emailVerified: true,
        profile: {
          create: {
            fullName: 'Test Student',
            nationalId: '12345678901',
            preferredLanguage: 'pt-BR',
            timezone: 'America/Sao_Paulo',
          },
        },
        authorization: {
          create: {
            role: 'student',
          },
        },
      },
    });
    this.studentUserId = studentIdentity.id;

    // Create tutor user
    const tutorIdentity = await this.prisma.userIdentity.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        email: 'tutor@test.com',
        password: 'hashed_password',
        emailVerified: true,
        profile: {
          create: {
            fullName: 'Test Tutor',
            nationalId: '12345678902',
            preferredLanguage: 'pt-BR',
            timezone: 'America/Sao_Paulo',
          },
        },
        authorization: {
          create: {
            role: 'tutor',
          },
        },
      },
    });
    this.tutorUserId = tutorIdentity.id;
  }

  private async createBaseCourseStructure(): Promise<void> {
    // Create course
    const course = await this.prisma.course.create({
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
    this.courseId = course.id;

    // Create module
    const module = await this.prisma.module.create({
      data: {
        slug: 'test-module',
        order: 1,
        courseId: this.courseId,
        translations: {
          create: [
            { locale: 'pt', title: 'Módulo de Teste', description: 'Desc PT' },
            { locale: 'it', title: 'Modulo di Test', description: 'Desc IT' },
            { locale: 'es', title: 'Módulo de Prueba', description: 'Desc ES' },
          ],
        },
      },
    });
    this.moduleId = module.id;

    // Create lesson
    const lesson = await this.prisma.lesson.create({
      data: {
        slug: 'test-lesson',
        moduleId: this.moduleId,
        order: 1,
        translations: {
          create: [
            { locale: 'pt', title: 'Aula de Teste', description: 'Desc PT' },
            { locale: 'it', title: 'Lezione di Test', description: 'Desc IT' },
            {
              locale: 'es',
              title: 'Lección de Prueba',
              description: 'Desc ES',
            },
          ],
        },
      },
    });
    this.lessonId = lesson.id;
  }

  private async createTestAssessments(): Promise<void> {
    // Create Quiz Assessment
    const quizAssessment = await this.prisma.assessment.create({
      data: {
        slug: 'test-quiz',
        title: 'Test Quiz Assessment',
        description: 'Quiz for multiple choice questions',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: this.lessonId,
      },
    });
    this.quizAssessmentId = quizAssessment.id;

    // Create Simulado Assessment (with time limit)
    const simuladoAssessment = await this.prisma.assessment.create({
      data: {
        slug: 'test-simulado',
        title: 'Test Simulado Assessment',
        description: 'Simulado for multiple choice questions',
        type: 'SIMULADO',
        passingScore: 75,
        timeLimitInMinutes: 120, // 2 hours
        randomizeQuestions: true,
        randomizeOptions: true,
        lessonId: this.lessonId,
      },
    });
    this.simuladoAssessmentId = simuladoAssessment.id;

    // Create Prova Aberta Assessment
    const provaAbertaAssessment = await this.prisma.assessment.create({
      data: {
        slug: 'test-prova-aberta',
        title: 'Test Prova Aberta Assessment',
        description: 'Prova aberta for open questions',
        type: 'PROVA_ABERTA',
        passingScore: 60,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: this.lessonId,
      },
    });
    this.provaAbertaAssessmentId = provaAbertaAssessment.id;

    // Create test questions for assessments
    await this.createTestQuestions();
  }

  private async createTestQuestions(): Promise<void> {
    // Create multiple choice question for quiz
    const multipleChoiceQuestion = await this.prisma.question.create({
      data: {
        text: 'What is the capital of Brazil?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: this.quizAssessmentId,
      },
    });
    this.multipleChoiceQuestionId = multipleChoiceQuestion.id;

    // Create question options for multiple choice question
    const correctOption = await this.prisma.questionOption.create({
      data: {
        text: 'Brasília',
        questionId: this.multipleChoiceQuestionId,
      },
    });
    this.correctOptionId = correctOption.id;

    const incorrectOption = await this.prisma.questionOption.create({
      data: {
        text: 'Rio de Janeiro',
        questionId: this.multipleChoiceQuestionId,
      },
    });
    this.incorrectOptionId = incorrectOption.id;

    // Create answer with correct option
    await this.prisma.answer.create({
      data: {
        questionId: this.multipleChoiceQuestionId,
        correctOptionId: this.correctOptionId,
        explanation: 'Brasília is the capital of Brazil since 1960.',
      },
    });

    // Create a second question for quiz to have 2 questions total
    const secondQuestion = await this.prisma.question.create({
      data: {
        text: 'What is the largest city in Brazil?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: this.quizAssessmentId,
      },
    });

    // Create options for second question
    const correctOption2 = await this.prisma.questionOption.create({
      data: {
        text: 'São Paulo',
        questionId: secondQuestion.id,
      },
    });

    await this.prisma.questionOption.create({
      data: {
        text: 'Rio de Janeiro',
        questionId: secondQuestion.id,
      },
    });

    // Create answer for second question
    await this.prisma.answer.create({
      data: {
        questionId: secondQuestion.id,
        correctOptionId: correctOption2.id,
        explanation: 'São Paulo is the largest city in Brazil.',
      },
    });

    // Create open question for prova aberta
    const openQuestion = await this.prisma.question.create({
      data: {
        text: 'Explain the pathophysiology of hypertension.',
        type: 'OPEN',
        assessmentId: this.provaAbertaAssessmentId,
      },
    });
    this.openQuestionId = openQuestion.id;

    // Create answer for open question
    await this.prisma.answer.create({
      data: {
        questionId: this.openQuestionId,
        explanation: 'Expected answer about hypertension pathophysiology.',
      },
    });
  }

  async cleanupDatabase(): Promise<void> {
    if (!this.prisma) return;

    try {
      // Clean up in correct order to respect foreign keys
      await this.prisma.attemptAnswer.deleteMany({});
      await this.prisma.attempt.deleteMany({});
      await this.prisma.answerTranslation.deleteMany({});
      await this.prisma.answer.deleteMany({});
      await this.prisma.questionOption.deleteMany({});
      await this.prisma.question.deleteMany({});
      await this.prisma.argument.deleteMany({});
      await this.prisma.assessment.deleteMany({});
      // Delete lesson documents before lessons
      await this.prisma.lessonDocument.deleteMany({});
      await this.prisma.lessonTranslation.deleteMany({});
      await this.prisma.lesson.deleteMany({});
      await this.prisma.moduleTranslation.deleteMany({});
      await this.prisma.module.deleteMany({});
      await this.prisma.courseTranslation.deleteMany({});
      await this.prisma.course.deleteMany({});
      await this.prisma.address.deleteMany({});
      await this.prisma.userAuthorization.deleteMany({});
      await this.prisma.userProfile.deleteMany({});
      await this.prisma.userIdentity.deleteMany({});
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  }

  async teardown(): Promise<void> {
    await this.cleanupDatabase();
    if (this.app) {
      await this.app.close();
    }
  }

  /**
   * Get HTTP server instance for supertest
   */
  getHttpServer() {
    return this.app.getHttpServer();
  }

  /**
   * Find attempt by ID
   */
  async findAttemptById(id: string) {
    return await this.prisma.attempt.findUnique({
      where: { id },
    });
  }

  /**
   * Get assessment by ID
   */
  async findAssessmentById(id: string) {
    return await this.prisma.assessment.findUnique({
      where: { id },
    });
  }

  /**
   * Get user by ID
   */
  async findUserById(id: string) {
    return await this.prisma.userIdentity.findUnique({
      where: { id },
      include: {
        profile: true,
        authorization: true,
      },
    });
  }

  /**
   * Create an active attempt for testing conflicts
   */
  async createActiveAttempt(
    userId: string,
    assessmentId: string,
  ): Promise<string> {
    const attempt = await this.prisma.attempt.create({
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        identityId: userId,
        assessmentId,
      },
    });
    return attempt.id;
  }

  /**
   * Get attempts count
   */
  async getAttemptsCount(): Promise<number> {
    return await this.prisma.attempt.count();
  }

  /**
   * Generate a non-existent UUID for testing
   */
  getNonExistentUUID(): string {
    return '00000000-0000-4000-8000-000000000000';
  }

  /**
   * Generate a random UUID for testing
   */
  getRandomUUID(): string {
    return randomUUID();
  }

  /**
   * Wait for a specified time (useful for timestamp testing)
   */
  async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create user with specific role
   */
  async createUser(role: 'student' | 'tutor' | 'admin'): Promise<any> {
    return await this.prisma.userIdentity.create({
      data: {
        id: randomUUID(),
        email: `${role}_${randomUUID()}@test.com`,
        password: 'hashed_password',
        emailVerified: true,
        profile: {
          create: {
            fullName: `Test ${role}`,
            nationalId: `${Math.random().toString().slice(2, 13)}`,
            preferredLanguage: 'pt-BR',
            timezone: 'America/Sao_Paulo',
          },
        },
        authorization: {
          create: {
            role,
          },
        },
      },
      include: {
        profile: true,
        authorization: true,
      },
    });
  }

  /**
   * Create assessment with questions
   */
  async createAssessmentWithQuestions(
    type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA',
    options: {
      numberOfQuestions: number;
      allMultipleChoice?: boolean;
      allOpenQuestions?: boolean;
      mixedQuestionTypes?: boolean;
      timeLimitInMinutes?: number;
    },
  ): Promise<any> {
    // Ensure base structure exists
    if (!this.lessonId) {
      await this.createBaseCourseStructure();
    }

    const assessment = await this.prisma.assessment.create({
      data: {
        slug: `test-${type.toLowerCase()}-${randomUUID()}`,
        title: `Test ${type} Assessment`,
        description: `${type} for testing`,
        type,
        passingScore: 70,
        ...(options.timeLimitInMinutes && {
          timeLimitInMinutes: options.timeLimitInMinutes,
        }),
        randomizeQuestions: type === 'SIMULADO',
        randomizeOptions: type === 'SIMULADO',
        lessonId: this.lessonId,
      },
    });

    const questions: any[] = [];

    for (let i = 0; i < options.numberOfQuestions; i++) {
      let questionType: 'MULTIPLE_CHOICE' | 'OPEN' = 'MULTIPLE_CHOICE';

      if (options.allOpenQuestions) {
        questionType = 'OPEN';
      } else if (options.mixedQuestionTypes) {
        questionType = i % 2 === 0 ? 'MULTIPLE_CHOICE' : 'OPEN';
      }

      const question = await this.prisma.question.create({
        data: {
          text: `Question ${i + 1} for ${assessment.id}`,
          type: questionType,
          assessmentId: assessment.id,
        },
      });

      if (questionType === 'MULTIPLE_CHOICE') {
        const questionOptions: any[] = [];
        const correctOptionIndex = Math.floor(Math.random() * 4);

        for (let j = 0; j < 4; j++) {
          const option = await this.prisma.questionOption.create({
            data: {
              text: `Option ${j + 1}`,
              questionId: question.id,
            },
          });
          questionOptions.push(option);
        }

        // Create answer with correct option
        await this.prisma.answer.create({
          data: {
            questionId: question.id,
            correctOptionId: questionOptions[correctOptionIndex].id,
            explanation: `Explanation for question ${i + 1}`,
          },
        });

        // Add options and correctOptionId as additional properties
        (question as any).options = questionOptions;
        (question as any).correctOptionId =
          questionOptions[correctOptionIndex].id;
      } else {
        // For open questions, create answer with expected content
        await this.prisma.answer.create({
          data: {
            questionId: question.id,
            explanation: `Expected answer criteria for open question ${i + 1}`,
          },
        });
      }

      questions.push(question);
    }

    // Add questions as additional property
    (assessment as any).questions = questions;
    return assessment;
  }

  /**
   * Delete assessment
   */
  async deleteAssessment(assessmentId: string): Promise<void> {
    // Delete dependent records first to respect foreign key constraints
    await this.prisma.attemptAnswer.deleteMany({
      where: {
        attempt: {
          assessmentId: assessmentId,
        },
      },
    });
    await this.prisma.attempt.deleteMany({
      where: { assessmentId: assessmentId },
    });
    await this.prisma.answer.deleteMany({
      where: {
        question: {
          assessmentId: assessmentId,
        },
      },
    });
    await this.prisma.questionOption.deleteMany({
      where: {
        question: {
          assessmentId: assessmentId,
        },
      },
    });
    await this.prisma.question.deleteMany({
      where: { assessmentId: assessmentId },
    });
    await this.prisma.assessment.delete({
      where: { id: assessmentId },
    });
  }

  /**
   * Create a graded attempt
   */
  async createGradedAttempt(
    userId: string,
    assessmentId: string,
  ): Promise<any> {
    return await this.prisma.attempt.create({
      data: {
        status: 'GRADED',
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        submittedAt: new Date(Date.now() - 1800000), // 30 minutes ago
        gradedAt: new Date(Date.now() - 900000), // 15 minutes ago
        identityId: userId,
        assessmentId,
      },
    });
  }

  /**
   * Expire an attempt (simulate time limit expiration)
   */
  async expireAttempt(attemptId: string): Promise<void> {
    const pastDate = new Date(Date.now() - 7200000); // 2 hours ago
    await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        timeLimitExpiresAt: pastDate,
      },
    });
  }

  /**
   * Initialize the test setup
   */
  async init(): Promise<void> {
    await this.initialize();
  }

  /**
   * Create attempt with open answers for review testing
   */
  async createAttemptWithOpenAnswers(
    userId: string,
    assessmentId: string,
    status: 'SUBMITTED' | 'GRADED' = 'SUBMITTED',
  ): Promise<{ attemptId: string; attemptAnswerIds: string[] }> {
    const attempt = await this.prisma.attempt.create({
      data: {
        status,
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        ...(status === 'SUBMITTED' && {
          submittedAt: new Date(Date.now() - 1800000),
        }), // 30 minutes ago
        ...(status === 'GRADED' && {
          submittedAt: new Date(Date.now() - 1800000),
          gradedAt: new Date(Date.now() - 900000), // 15 minutes ago
        }),
        identityId: userId,
        assessmentId,
      },
    });

    // Get open questions from the assessment
    const openQuestions = await this.prisma.question.findMany({
      where: {
        assessmentId,
        type: 'OPEN',
      },
    });

    const attemptAnswerIds: string[] = [];

    for (const question of openQuestions) {
      const attemptAnswer = await this.prisma.attemptAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: question.id,
          textAnswer: `Sample answer for question: ${question.text}`,
          status: status === 'GRADED' ? 'GRADED' : 'SUBMITTED',
          ...(status === 'GRADED' && {
            isCorrect: true,
            teacherComment: 'Good answer',
            reviewedAt: new Date(Date.now() - 900000), // 15 minutes ago
            reviewerId: this.tutorUserId,
          }),
        },
      });
      attemptAnswerIds.push(attemptAnswer.id);
    }

    return {
      attemptId: attempt.id,
      attemptAnswerIds,
    };
  }

  /**
   * Create attempt answer for specific testing scenarios
   */
  async createAttemptAnswer(
    attemptId: string,
    questionId: string,
    textAnswer: string,
    status: 'SUBMITTED' | 'GRADING' | 'GRADED' = 'SUBMITTED',
  ): Promise<string> {
    const attemptAnswer = await this.prisma.attemptAnswer.create({
      data: {
        attemptId,
        questionId,
        textAnswer,
        status,
      },
    });
    return attemptAnswer.id;
  }

  /**
   * Find attempt answer by ID
   */
  async findAttemptAnswerById(id: string) {
    return await this.prisma.attemptAnswer.findUnique({
      where: { id },
      include: {
        attempt: true,
        question: true,
      },
    });
  }

  /**
   * Mark attempt answer as already reviewed
   */
  async markAttemptAnswerAsReviewed(
    attemptAnswerId: string,
    reviewerId: string,
    isCorrect: boolean,
    teacherComment?: string,
  ): Promise<void> {
    await this.prisma.attemptAnswer.update({
      where: { id: attemptAnswerId },
      data: {
        status: 'GRADED',
        isCorrect,
        teacherComment,
        reviewedAt: new Date(),
        reviewerId,
      },
    });
  }

  /**
   * Create attempt from multiple choice question (non-reviewable)
   */
  async createMultipleChoiceAttemptAnswer(
    attemptId: string,
    questionId: string,
    selectedOptionId: string,
  ): Promise<string> {
    const attemptAnswer = await this.prisma.attemptAnswer.create({
      data: {
        attemptId,
        questionId,
        selectedOptionId,
        status: 'GRADED',
        isCorrect: true, // Assume correct for testing
      },
    });
    return attemptAnswer.id;
  }

  /**
   * Create test data for list attempts tests
   */
  async createTestData(): Promise<{
    adminUser: any;
    studentUser: any;
    otherStudentUser: any;
    assessment: any;
    otherAssessment: any;
    attempt: any;
  }> {
    await this.setupTestData();

    const adminUser = await this.createUser('admin');
    const studentUser = await this.findUserById(this.studentUserId);
    const otherStudentUser = await this.createUser('student');

    if (!studentUser) {
      throw new Error('Student user not found');
    }

    const assessment = await this.findAssessmentById(this.quizAssessmentId);
    const otherAssessment = await this.findAssessmentById(
      this.simuladoAssessmentId,
    );

    if (!assessment) {
      throw new Error('Quiz assessment not found');
    }

    if (!otherAssessment) {
      throw new Error('Simulado assessment not found');
    }

    const attempt = await this.createActiveAttempt(
      studentUser.id,
      assessment.id,
    );

    return {
      adminUser,
      studentUser,
      otherStudentUser,
      assessment,
      otherAssessment,
      attempt,
    };
  }

  /**
   * Create attempt for specific user and assessment
   */
  async createAttemptForUser(
    userId: string,
    assessmentId: string,
  ): Promise<any> {
    return await this.prisma.attempt.create({
      data: {
        status: 'SUBMITTED',
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        submittedAt: new Date(Date.now() - 1800000), // 30 minutes ago
        identityId: userId,
        assessmentId,
      },
    });
  }

  /**
   * Create attempt with specific status
   */
  async createAttemptWithStatus(
    userId: string,
    assessmentId: string,
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED',
  ): Promise<any> {
    const data: any = {
      status,
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      identityId: userId,
      assessmentId,
    };

    if (status !== 'IN_PROGRESS') {
      data.submittedAt = new Date(Date.now() - 1800000); // 30 minutes ago
    }

    if (status === 'GRADED') {
      data.gradedAt = new Date(Date.now() - 900000); // 15 minutes ago
    }

    return await this.prisma.attempt.create({ data });
  }

  /**
   * Generate JWT token for testing
   */
  generateJwtToken(user: any): string {
    // Simple mock token - in real tests you might want to use actual JWT
    const role = user.authorization?.role || user.role || 'student';
    return `mock-token-${user.id}-${role}`;
  }

  /**
   * Create app instance for testing
   */
  async createApp(): Promise<INestApplication> {
    await this.initialize();
    return this.app;
  }

  /**
   * Cleanup after tests
   */
  async cleanup(): Promise<void> {
    await this.teardown();
  }
}
