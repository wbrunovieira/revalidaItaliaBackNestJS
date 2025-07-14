// test/e2e/question-options/shared/question-option-test-setup.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { CreateQuestionOptionUseCase } from '../../../../src/domain/assessment/application/use-cases/create-question-option.use-case';
import { ListQuestionOptionsUseCase } from '../../../../src/domain/assessment/application/use-cases/list-question-options.use-case';
import { QuestionOptionController } from '../../../../src/infra/controllers/question-option.controller';
import { PrismaQuestionOptionRepository } from '../../../../src/infra/database/prisma/repositories/prisma-question-option-repository';
import { PrismaQuestionRepository } from '../../../../src/infra/database/prisma/repositories/prisma-question-repository';

@Module({
  controllers: [QuestionOptionController],
  providers: [
    CreateQuestionOptionUseCase,
    ListQuestionOptionsUseCase,
    PrismaService,
    {
      provide: 'QuestionOptionRepository',
      useClass: PrismaQuestionOptionRepository,
    },
    {
      provide: 'QuestionRepository',
      useClass: PrismaQuestionRepository,
    },
  ],
})
export class TestQuestionOptionModule {}

export class QuestionOptionTestSetup {
  public app: INestApplication;
  public prisma: PrismaService;
  public courseId: string;
  public moduleId: string;
  public lessonId: string;
  public quizAssessmentId: string;
  public simuladoAssessmentId: string;
  public provaAbertaAssessmentId: string;
  public multipleChoiceQuestionId: string;
  public openQuestionId: string;

  async initialize(): Promise<void> {
    const moduleRef = await Test.createTestingModule({
      imports: [TestQuestionOptionModule],
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

    // Create base structure: Course > Module > Lesson > Assessments > Questions
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

    // Create different types of assessments
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

    // Create test questions
    const multipleChoiceQuestion = await this.prisma.question.create({
      data: {
        text: 'What is the capital of Brazil?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: this.quizAssessmentId,
      },
    });
    this.multipleChoiceQuestionId = multipleChoiceQuestion.id;

    const openQuestion = await this.prisma.question.create({
      data: {
        text: 'Explain the pathophysiology of hypertension and discuss current treatment guidelines.',
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
      await this.prisma.questionOption.deleteMany({});
      await this.prisma.question.deleteMany({});
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
   * Create a test question with custom data
   */
  async createTestQuestion(data: {
    text: string;
    type: 'MULTIPLE_CHOICE' | 'OPEN';
    assessmentId?: string;
  }): Promise<string> {
    const question = await this.prisma.question.create({
      data: {
        text: data.text,
        type: data.type,
        assessmentId: data.assessmentId || this.quizAssessmentId,
      },
    });
    return question.id;
  }

  /**
   * Create a test question option with custom data
   */
  async createTestQuestionOption(data: {
    text: string;
    questionId: string;
  }): Promise<string> {
    const option = await this.prisma.questionOption.create({
      data: {
        text: data.text,
        questionId: data.questionId,
      },
    });
    return option.id;
  }

  /**
   * Find question options by question ID
   */
  async findQuestionOptionsByQuestionId(questionId: string) {
    return await this.prisma.questionOption.findMany({
      where: { questionId },
      orderBy: { createdAt: 'asc' },
    });
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
   * Get question option count for a question
   */
  async getQuestionOptionCount(questionId: string): Promise<number> {
    return await this.prisma.questionOption.count({
      where: { questionId },
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
   * Verify question option data integrity
   */
  async verifyQuestionOptionDataIntegrity(optionId: string): Promise<boolean> {
    const option = await this.prisma.questionOption.findUnique({
      where: { id: optionId },
    });
    
    if (!option) return false;

    // Check if question exists
    const question = await this.findQuestionById(option.questionId);
    if (!question) return false;

    // Check if option has required fields
    if (!option.text || option.text.trim() === '') return false;

    return true;
  }

  /**
   * Create question with multiple options for testing
   */
  async createQuestionWithOptions(data: {
    questionText: string;
    questionType: 'MULTIPLE_CHOICE' | 'OPEN';
    options: string[];
    assessmentId?: string;
  }): Promise<{ questionId: string; optionIds: string[] }> {
    const questionId = await this.createTestQuestion({
      text: data.questionText,
      type: data.questionType,
      assessmentId: data.assessmentId,
    });

    const optionIds: string[] = [];
    for (const optionText of data.options) {
      const optionId = await this.createTestQuestionOption({
        text: optionText,
        questionId,
      });
      optionIds.push(optionId);
      // Small delay to ensure different timestamps
      await this.wait(1);
    }

    return { questionId, optionIds };
  }

  /**
   * Get question ID by type for testing
   */
  getQuestionIdByType(type: 'MULTIPLE_CHOICE' | 'OPEN'): string {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return this.multipleChoiceQuestionId;
      case 'OPEN':
        return this.openQuestionId;
      default:
        return this.multipleChoiceQuestionId;
    }
  }

  /**
   * Get assessment ID by type for testing
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
}