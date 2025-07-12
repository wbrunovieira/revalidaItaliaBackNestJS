// test/e2e/questions/shared/question-test-setup.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { CreateQuestionUseCase } from '../../../../src/domain/assessment/application/use-cases/create-question.use-case';
import { QuestionController } from '../../../../src/infra/controllers/question.controller';
import { PrismaQuestionRepository } from '../../../../src/infra/database/prisma/repositories/prisma-question-repository';
import { PrismaAssessmentRepository } from '../../../../src/infra/database/prisma/repositories/prisma-assessment-repository';
import { PrismaArgumentRepository } from '../../../../src/infra/database/prisma/repositories/prisma-argument-repository';

@Module({
  controllers: [QuestionController],
  providers: [
    CreateQuestionUseCase,
    PrismaService,
    {
      provide: 'QuestionRepository',
      useClass: PrismaQuestionRepository,
    },
    {
      provide: 'AssessmentRepository',
      useClass: PrismaAssessmentRepository,
    },
    {
      provide: 'ArgumentRepository',
      useClass: PrismaArgumentRepository,
    },
  ],
})
export class TestQuestionModule {}

export class QuestionTestSetup {
  public app: INestApplication;
  public prisma: PrismaService;
  public courseId: string;
  public moduleId: string;
  public lessonId: string;
  public quizAssessmentId: string;
  public simuladoAssessmentId: string;
  public provaAbertaAssessmentId: string;
  public argumentId: string;

  async initialize(): Promise<void> {
    const moduleRef = await Test.createTestingModule({
      imports: [TestQuestionModule],
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

    // Create base structure: Course > Module > Lesson > Assessments
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

    // Create different types of assessments for testing question type rules
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

    const simuladoAssessment = await this.prisma.assessment.create({
      data: {
        slug: 'test-simulado',
        title: 'Test Simulado Assessment',
        description: 'Simulado for multiple choice questions',
        type: 'SIMULADO',
        passingScore: 75,
        timeLimitInMinutes: 120,
        randomizeQuestions: true,
        randomizeOptions: true,
        lessonId: this.lessonId,
      },
    });
    this.simuladoAssessmentId = simuladoAssessment.id;

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

    // Create a test argument for testing questions with arguments
    const argument = await this.prisma.argument.create({
      data: {
        title: 'Test Argument for Questions',
        assessmentId: this.simuladoAssessmentId,
      },
    });
    this.argumentId = argument.id;
  }

  async cleanupDatabase(): Promise<void> {
    if (!this.prisma) return;

    try {
      // Clean up in correct order to respect foreign keys
      await this.prisma.question.deleteMany({});
      await this.prisma.argument.deleteMany({});
      await this.prisma.assessment.deleteMany({});
      await this.prisma.lessonTranslation.deleteMany({});
      await this.prisma.lesson.deleteMany({});
      await this.prisma.moduleTranslation.deleteMany({});
      await this.prisma.module.deleteMany({});
      await this.prisma.courseTranslation.deleteMany({});
      await this.prisma.course.deleteMany({});
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
   * Create a test assessment with custom data
   */
  async createTestAssessment(data: {
    title: string;
    type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
    slug?: string;
  }): Promise<string> {
    const assessment = await this.prisma.assessment.create({
      data: {
        slug: data.slug || `test-${Date.now()}`,
        title: data.title,
        description: `Test assessment: ${data.title}`,
        type: data.type,
        quizPosition: data.type === 'QUIZ' ? 'AFTER_LESSON' : undefined,
        timeLimitInMinutes: data.type === 'SIMULADO' ? 60 : undefined,
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: this.lessonId,
      },
    });
    return assessment.id;
  }

  /**
   * Create a test argument with custom data
   */
  async createTestArgument(data: {
    title: string;
    assessmentId?: string;
  }): Promise<string> {
    const argument = await this.prisma.argument.create({
      data: {
        title: data.title,
        assessmentId: data.assessmentId || null,
      },
    });
    return argument.id;
  }

  /**
   * Create a test question with custom data
   */
  async createTestQuestion(data: {
    text: string;
    type: 'MULTIPLE_CHOICE' | 'OPEN';
    assessmentId?: string;
    argumentId?: string;
  }): Promise<string> {
    const question = await this.prisma.question.create({
      data: {
        text: data.text,
        type: data.type,
        assessmentId: data.assessmentId || this.quizAssessmentId,
        argumentId: data.argumentId || null,
      },
    });
    return question.id;
  }

  /**
   * Get question count for testing
   */
  async getQuestionCount(): Promise<number> {
    return await this.prisma.question.count();
  }

  /**
   * Find question by ID
   */
  async findQuestionById(id: string) {
    return await this.prisma.question.findUnique({
      where: { id },
    });
  }

  /**
   * Find questions by assessment ID
   */
  async findQuestionsByAssessmentId(assessmentId: string) {
    return await this.prisma.question.findMany({
      where: { assessmentId },
    });
  }

  /**
   * Find questions by text (for duplicate testing)
   */
  async findQuestionsByText(text: string, assessmentId: string) {
    return await this.prisma.question.findMany({
      where: { 
        text,
        assessmentId,
      },
    });
  }

  /**
   * Find questions by argument ID
   */
  async findQuestionsByArgumentId(argumentId: string) {
    return await this.prisma.question.findMany({
      where: { argumentId },
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
   * Get argument by ID
   */
  async findArgumentById(id: string) {
    return await this.prisma.argument.findUnique({
      where: { id },
    });
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
    return crypto.randomUUID();
  }

  /**
   * Wait for a specified time (useful for timestamp testing)
   */
  async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get assessment IDs by type for testing
   */
  getAssessmentIdByType(type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA'): string {
    switch (type) {
      case 'QUIZ':
        return this.quizAssessmentId;
      case 'SIMULADO':
        return this.simuladoAssessmentId;
      case 'PROVA_ABERTA':
        return this.provaAbertaAssessmentId;
      default:
        return this.quizAssessmentId;
    }
  }

  /**
   * Get recommended question type for assessment type
   */
  getRecommendedQuestionType(assessmentType: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA'): 'MULTIPLE_CHOICE' | 'OPEN' {
    return assessmentType === 'PROVA_ABERTA' ? 'OPEN' : 'MULTIPLE_CHOICE';
  }

  /**
   * Get invalid question type for assessment type (for testing mismatches)
   */
  getInvalidQuestionType(assessmentType: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA'): 'MULTIPLE_CHOICE' | 'OPEN' {
    return assessmentType === 'PROVA_ABERTA' ? 'MULTIPLE_CHOICE' : 'OPEN';
  }
}