// test/e2e/flashcard/shared/flashcard-test-setup.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { FlashcardContentType } from '@prisma/client';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { FlashcardController } from '../../../../src/infra/controllers/flashcard.controller';
import { CreateFlashcardUseCase } from '../../../../src/domain/flashcard/application/use-cases/create-flashcard.use-case';
import { GetFlashcardByIdUseCase } from '../../../../src/domain/flashcard/application/use-cases/get-flashcard-by-id.use-case';
import { PrismaFlashcardRepository } from '../../../../src/infra/database/prisma/repositories/prisma-flashcard-repository';
import { PrismaFlashcardTagRepository } from '../../../../src/infra/database/prisma/repositories/prisma-flashcard-tag-repository';
import { PrismaArgumentRepository } from '../../../../src/infra/database/prisma/repositories/prisma-argument-repository';

@Module({
  controllers: [FlashcardController],
  providers: [
    CreateFlashcardUseCase,
    GetFlashcardByIdUseCase,
    PrismaService,
    {
      provide: 'FlashcardRepository',
      useClass: PrismaFlashcardRepository,
    },
    {
      provide: 'FlashcardTagRepository',
      useClass: PrismaFlashcardTagRepository,
    },
    {
      provide: 'ArgumentRepository',
      useClass: PrismaArgumentRepository,
    },
  ],
})
export class TestFlashcardModule {}

export class FlashcardTestSetup {
  public app: INestApplication;
  public prisma: PrismaService;
  
  // Pre-defined test IDs
  public argumentId: string = '7f5a6c3b-1234-4567-8901-234567890123';
  public flashcardTagId1: string = 'a1234567-1234-4567-8901-234567890123';
  public flashcardTagId2: string = 'b1234567-1234-4567-8901-234567890123';
  public flashcardId1: string = 'c1234567-1234-4567-8901-234567890123';
  public flashcardId2: string = 'd1234567-1234-4567-8901-234567890123';
  public userId: string = 'e1234567-1234-4567-8901-234567890123';

  async initialize(): Promise<void> {
    const moduleRef = await Test.createTestingModule({
      imports: [TestFlashcardModule],
    }).compile();

    this.app = moduleRef.createNestApplication();
    this.prisma = moduleRef.get(PrismaService);

    this.app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await this.app.init();
  }

  async setupTestData(): Promise<void> {
    // Clean up existing data in the correct order to respect foreign key constraints
    await this.prisma.$transaction(async (tx) => {
      // First clean junction tables and dependent data
      await tx.flashcardInteraction.deleteMany({});
      await tx.flashcardInteractionContext.deleteMany({});
      await tx.lessonFlashcard.deleteMany({});
      
      // Then clean main tables
      await tx.flashcard.deleteMany({});
      await tx.flashcardTag.deleteMany({});
      await tx.argument.deleteMany({});
      await tx.assessment.deleteMany({});
      await tx.lessonTranslation.deleteMany({});
      await tx.moduleTranslation.deleteMany({});
      await tx.courseTranslation.deleteMany({});
      await tx.lesson.deleteMany({});
      await tx.module.deleteMany({});
      await tx.course.deleteMany({});
      await tx.user.deleteMany({});
    });

    // Create test data
    await this.prisma.$transaction(async (tx) => {
      // Create test user
      await tx.user.create({
        data: {
          id: this.userId,
          email: 'test@example.com',
          name: 'Test User',
          cpf: '12345678901',
          password: 'hashedpassword',
          role: 'STUDENT',
        },
      });

      // Create test course
      const courseId = 'f1234567-1234-4567-8901-234567890123';
      await tx.course.create({
        data: {
          id: courseId,
          slug: 'test-course',
          imageUrl: 'https://example.com/course.jpg',
          translations: {
            create: [
              {
                locale: 'pt',
                title: 'Curso Teste',
                description: 'Descrição do curso teste',
              },
              {
                locale: 'it',
                title: 'Corso Test',
                description: 'Descrizione del corso test',
              },
              {
                locale: 'es',
                title: 'Curso Test',
                description: 'Descripción del curso test',
              },
            ],
          },
        },
      });

      // Create test module
      const moduleId = '01234567-1234-4567-8901-234567890123';
      await tx.module.create({
        data: {
          id: moduleId,
          slug: 'test-module',
          courseId,
          order: 1,
          translations: {
            create: [
              {
                locale: 'pt',
                title: 'Módulo Teste',
                description: 'Descrição do módulo teste',
              },
              {
                locale: 'it',
                title: 'Modulo Test',
                description: 'Descrizione del modulo test',
              },
              {
                locale: 'es',
                title: 'Módulo Test',
                description: 'Descripción del módulo test',
              },
            ],
          },
        },
      });

      // Create test lesson
      const lessonId = '11234567-1234-4567-8901-234567890123';
      await tx.lesson.create({
        data: {
          id: lessonId,
          slug: 'test-lesson',
          moduleId,
          order: 1,
          translations: {
            create: [
              {
                locale: 'pt',
                title: 'Aula Teste',
                description: 'Descrição da aula teste',
              },
              {
                locale: 'it',
                title: 'Lezione Test',
                description: 'Descrizione della lezione test',
              },
              {
                locale: 'es',
                title: 'Lección Test',
                description: 'Descripción de la lección test',
              },
            ],
          },
        },
      });

      // Create test assessment
      const assessmentId = '21234567-1234-4567-8901-234567890123';
      await tx.assessment.create({
        data: {
          id: assessmentId,
          slug: 'test-assessment',
          title: 'Test Assessment',
          description: 'Test assessment for flashcards',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
          lessonId,
        },
      });

      // Create test argument
      await tx.argument.create({
        data: {
          id: this.argumentId,
          title: 'Test Argument',
          assessmentId,
        },
      });

      // Create test flashcard tags
      await tx.flashcardTag.create({
        data: {
          id: this.flashcardTagId1,
          name: 'Anatomy',
          slug: 'anatomy',
        },
      });

      await tx.flashcardTag.create({
        data: {
          id: this.flashcardTagId2,
          name: 'Physiology',
          slug: 'physiology',
        },
      });
    });
  }

  async createFlashcardWithSlug(slug: string): Promise<void> {
    await this.prisma.flashcard.create({
      data: {
        id: this.flashcardId1,
        slug,
        questionText: 'Existing question',
        questionType: FlashcardContentType.TEXT,
        answerText: 'Existing answer',
        answerType: FlashcardContentType.TEXT,
        argumentId: this.argumentId,
      },
    });
  }

  async createTestFlashcard(options?: {
    id?: string;
    slug?: string;
    withTags?: boolean;
    questionType?: FlashcardContentType;
    answerType?: FlashcardContentType;
  }): Promise<string> {
    const flashcardId = options?.id || this.flashcardId1;
    
    const flashcardData: any = {
      id: flashcardId,
      slug: options?.slug || 'test-flashcard',
      questionText: 'What is Domain-Driven Design?',
      questionType: options?.questionType || FlashcardContentType.TEXT,
      answerText: 'DDD is an approach to software development that centers the development on programming a domain model',
      answerType: options?.answerType || FlashcardContentType.TEXT,
      argumentId: this.argumentId,
    };

    if (options?.questionType === FlashcardContentType.IMAGE) {
      flashcardData.questionText = null;
      flashcardData.questionImageUrl = 'https://example.com/question.jpg';
    }

    if (options?.answerType === FlashcardContentType.IMAGE) {
      flashcardData.answerText = null;
      flashcardData.answerImageUrl = 'https://example.com/answer.jpg';
    }

    if (options?.withTags) {
      flashcardData.tags = {
        connect: [
          { id: this.flashcardTagId1 },
          { id: this.flashcardTagId2 },
        ],
      };
    }

    await this.prisma.flashcard.create({ data: flashcardData });
    return flashcardId;
  }

  async teardown(): Promise<void> {
    // Clean up test data in the correct order
    await this.prisma.$transaction(async (tx) => {
      await tx.flashcardInteraction.deleteMany({});
      await tx.flashcardInteractionContext.deleteMany({});
      await tx.lessonFlashcard.deleteMany({});
      await tx.flashcard.deleteMany({});
      await tx.flashcardTag.deleteMany({});
      await tx.argument.deleteMany({});
      await tx.assessment.deleteMany({});
      await tx.lessonTranslation.deleteMany({});
      await tx.moduleTranslation.deleteMany({});
      await tx.courseTranslation.deleteMany({});
      await tx.lesson.deleteMany({});
      await tx.module.deleteMany({});
      await tx.course.deleteMany({});
      await tx.user.deleteMany({});
    });
    
    await this.app.close();
  }

  getHttpServer() {
    return this.app.getHttpServer();
  }
}