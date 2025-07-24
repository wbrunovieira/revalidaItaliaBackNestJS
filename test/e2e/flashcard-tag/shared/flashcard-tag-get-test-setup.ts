// test/e2e/flashcard-tag/shared/flashcard-tag-get-test-setup.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { FlashcardTagController } from '../../../../src/infra/controllers/flashcard-tag.controller';
import { CreateFlashcardTagUseCase } from '../../../../src/domain/flashcard/application/use-cases/create-flashcard-tag.use-case';
import { GetFlashcardTagByIdUseCase } from '../../../../src/domain/flashcard/application/use-cases/get-flashcard-tag-by-id.use-case';
import { ListAllFlashcardTagsUseCase } from '../../../../src/domain/flashcard/application/use-cases/list-all-flashcard-tags.use-case';
import { PrismaFlashcardTagRepository } from '../../../../src/infra/database/prisma/repositories/prisma-flashcard-tag-repository';

@Module({
  controllers: [FlashcardTagController],
  providers: [
    CreateFlashcardTagUseCase,
    GetFlashcardTagByIdUseCase,
    ListAllFlashcardTagsUseCase,
    PrismaService,
    {
      provide: 'FlashcardTagRepository',
      useClass: PrismaFlashcardTagRepository,
    },
  ],
})
export class TestFlashcardTagModule {}

export class FlashcardTagGetTestSetup {
  public app: INestApplication;
  public prisma: PrismaService;
  public flashcardTagId1: string;
  public flashcardTagId2: string;
  public flashcardTagId3: string;
  public flashcardTagId4: string;
  public flashcardTagId5: string;

  constructor() {
    this.flashcardTagId1 = '550e8400-e29b-41d4-a716-446655440070';
    this.flashcardTagId2 = '550e8400-e29b-41d4-a716-446655440071';
    this.flashcardTagId3 = '550e8400-e29b-41d4-a716-446655440072';
    this.flashcardTagId4 = '550e8400-e29b-41d4-a716-446655440073';
    this.flashcardTagId5 = '550e8400-e29b-41d4-a716-446655440074';
  }

  async initialize(): Promise<void> {
    const moduleRef = await Test.createTestingModule({
      imports: [TestFlashcardTagModule],
    }).compile();

    this.app = moduleRef.createNestApplication();
    this.prisma = moduleRef.get(PrismaService);

    this.app.useGlobalPipes(new ValidationPipe());
    await this.app.init();
  }

  async setupTestData(): Promise<void> {
    // Clean up existing data
    await this.prisma.flashcardTag.deleteMany({});

    // Create test data for GET tests
    await this.prisma.flashcardTag.createMany({
      data: [
        {
          id: this.flashcardTagId1,
          name: 'Farmacologia',
          slug: 'farmacologia',
        },
        {
          id: this.flashcardTagId2,
          name: 'Anatomia',
          slug: 'anatomia',
        },
        {
          id: this.flashcardTagId3,
          name: 'Fisiologia',
          slug: 'fisiologia',
        },
        {
          id: this.flashcardTagId4,
          name: 'Patologia',
          slug: 'patologia',
        },
        {
          id: this.flashcardTagId5,
          name: 'Anatomia & Fisiologia',
          slug: 'anatomia-fisiologia',
        },
      ],
    });
  }

  async teardown(): Promise<void> {
    // Clean up test data
    await this.prisma.flashcardTag.deleteMany({});
    await this.app.close();
  }

  getHttpServer() {
    return this.app.getHttpServer();
  }
}
