// test/e2e/attempts/shared/attempt-test-setup.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { StartAttemptUseCase } from '../../../../src/domain/assessment/application/use-cases/start-attempt.use-case';
import { AttemptController } from '../../../../src/infra/controllers/attempt.controller';
import { PrismaAttemptRepository } from '../../../../src/infra/database/prisma/repositories/prisma-attempt-repository';
import { PrismaAssessmentRepository } from '../../../../src/infra/database/prisma/repositories/prisma-assessment-repository';
import { PrismaAccountRepository } from '../../../../src/infra/database/prisma/repositories/prisma-account-repositories';

@Module({
  controllers: [AttemptController],
  providers: [
    StartAttemptUseCase,
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
      provide: 'AccountRepository',
      useClass: PrismaAccountRepository,
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
  
  // Attempt IDs (created during tests)
  public attemptId: string;

  async initialize(): Promise<void> {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAttemptModule],
    }).compile();

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
    const studentUser = await this.prisma.user.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Test Student',
        email: 'student@test.com',
        password: 'hashed_password',
        cpf: '12345678901',
        role: 'student',
      },
    });
    this.studentUserId = studentUser.id;

    // Create tutor user
    const tutorUser = await this.prisma.user.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Test Tutor',
        email: 'tutor@test.com',
        password: 'hashed_password',
        cpf: '12345678902',
        role: 'tutor',
      },
    });
    this.tutorUserId = tutorUser.id;
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
            { locale: 'es', title: 'Lección de Prueba', description: 'Desc ES' },
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

    // Create open question for prova aberta
    const openQuestion = await this.prisma.question.create({
      data: {
        text: 'Explain the pathophysiology of hypertension.',
        type: 'OPEN',
        assessmentId: this.provaAbertaAssessmentId,
      },
    });
    this.openQuestionId = openQuestion.id;
  }

  async cleanupDatabase(): Promise<void> {
    if (!this.prisma) return;

    try {
      // Clean up in correct order to respect foreign keys
      await this.prisma.attempt.deleteMany({});
      await this.prisma.answerTranslation.deleteMany({});
      await this.prisma.answer.deleteMany({});
      await this.prisma.questionOption.deleteMany({});
      await this.prisma.question.deleteMany({});
      await this.prisma.assessment.deleteMany({});
      await this.prisma.lessonTranslation.deleteMany({});
      await this.prisma.lesson.deleteMany({});
      await this.prisma.moduleTranslation.deleteMany({});
      await this.prisma.module.deleteMany({});
      await this.prisma.courseTranslation.deleteMany({});
      await this.prisma.course.deleteMany({});
      await this.prisma.address.deleteMany({});
      await this.prisma.user.deleteMany({});
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
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Create an active attempt for testing conflicts
   */
  async createActiveAttempt(userId: string, assessmentId: string): Promise<string> {
    const attempt = await this.prisma.attempt.create({
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        userId,
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
    return '00000000-0000-0000-0000-000000000000';
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
}