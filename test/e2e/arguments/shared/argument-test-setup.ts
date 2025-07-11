// test/e2e/arguments/shared/argument-test-setup.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { CreateArgumentUseCase } from '../../../../src/domain/assessment/application/use-cases/create-argument.use-case';
import { ArgumentController } from '../../../../src/infra/controllers/argument.controller';
import { PrismaArgumentRepository } from '../../../../src/infra/database/prisma/repositories/prisma-argument-repository';
import { PrismaAssessmentRepository } from '../../../../src/infra/database/prisma/repositories/prisma-assessment-repository';
import { GetArgumentUseCase } from '@/domain/assessment/application/use-cases/get-argument.use-case';
import { ListArgumentsUseCase } from '@/domain/assessment/application/use-cases/list-arguments.use-case';
import { UpdateArgumentUseCase } from '@/domain/assessment/application/use-cases/update-argument.use-case';

@Module({
  controllers: [ArgumentController],
  providers: [
    CreateArgumentUseCase,
    GetArgumentUseCase,
    ListArgumentsUseCase,
    UpdateArgumentUseCase,
    PrismaService,
    {
      provide: 'ArgumentRepository',
      useClass: PrismaArgumentRepository,
    },
    {
      provide: 'AssessmentRepository',
      useClass: PrismaAssessmentRepository,
    },
  ],
})
export class TestArgumentModule {}

export class ArgumentTestSetup {
  public app: INestApplication;
  public prisma: PrismaService;
  public courseId: string;
  public moduleId: string;
  public lessonId: string;
  public assessmentId: string;

  async initialize(): Promise<void> {
    const moduleRef = await Test.createTestingModule({
      imports: [TestArgumentModule],
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

    // Create base structure: Course > Module > Lesson > Assessment
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

    const assessment = await this.prisma.assessment.create({
      data: {
        slug: 'test-assessment',
        title: 'Test Assessment',
        description: 'Test assessment for arguments',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: this.lessonId,
      },
    });
    this.assessmentId = assessment.id;
  }

  async cleanupDatabase(): Promise<void> {
    if (!this.prisma) return;

    try {
      // Clean up in correct order to respect foreign keys
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
    type?: string;
    slug?: string;
  }): Promise<string> {
    const assessment = await this.prisma.assessment.create({
      data: {
        slug: data.slug || `test-${Date.now()}`,
        title: data.title,
        description: `Test assessment: ${data.title}`,
        type: (data.type as any) || 'QUIZ',
        quizPosition: data.type === 'QUIZ' ? 'AFTER_LESSON' : undefined,
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
   * Get argument count for testing
   */
  async getArgumentCount(): Promise<number> {
    return await this.prisma.argument.count();
  }

  /**
   * Find argument by ID
   */
  async findArgumentById(id: string) {
    return await this.prisma.argument.findUnique({
      where: { id },
    });
  }

  /**
   * Find arguments by title (for duplicate testing)
   */
  async findArgumentsByTitle(title: string) {
    return await this.prisma.argument.findMany({
      where: { title },
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
}
