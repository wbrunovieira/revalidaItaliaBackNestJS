import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { FlashcardTagController } from './controllers/flashcard-tag.controller';
import { FlashcardController } from './controllers/flashcard.controller';
import { CreateFlashcardTagUseCase } from '@/domain/flashcard/application/use-cases/create-flashcard-tag.use-case';
import { GetFlashcardTagByIdUseCase } from '@/domain/flashcard/application/use-cases/get-flashcard-tag-by-id.use-case';
import { ListAllFlashcardTagsUseCase } from '@/domain/flashcard/application/use-cases/list-all-flashcard-tags.use-case';
import { CreateFlashcardUseCase } from '@/domain/flashcard/application/use-cases/create-flashcard.use-case';
import { GetFlashcardByIdUseCase } from '@/domain/flashcard/application/use-cases/get-flashcard-by-id.use-case';
import { PrismaFlashcardTagRepository } from './database/prisma/repositories/prisma-flashcard-tag-repository';
import { PrismaFlashcardRepository } from './database/prisma/repositories/prisma-flashcard-repository';
import { PrismaFlashcardInteractionRepository } from './database/prisma/repositories/prisma-flashcard-interaction-repository';
import { PrismaArgumentRepository } from './database/prisma/repositories/prisma-argument-repository';

@Module({
  imports: [DatabaseModule],
  controllers: [FlashcardTagController, FlashcardController],
  providers: [
    // Use Cases
    CreateFlashcardTagUseCase,
    GetFlashcardTagByIdUseCase,
    ListAllFlashcardTagsUseCase,
    CreateFlashcardUseCase,
    GetFlashcardByIdUseCase,

    // Repositories
    {
      provide: 'FlashcardTagRepository',
      useClass: PrismaFlashcardTagRepository,
    } as const,
    {
      provide: 'FlashcardRepository',
      useClass: PrismaFlashcardRepository,
    } as const,
    {
      provide: 'FlashcardInteractionRepository',
      useClass: PrismaFlashcardInteractionRepository,
    } as const,
    {
      provide: 'ArgumentRepository',
      useClass: PrismaArgumentRepository,
    } as const,
  ],
  exports: [
    'FlashcardTagRepository',
    'FlashcardRepository', 
    'FlashcardInteractionRepository',
    'ArgumentRepository',
    CreateFlashcardTagUseCase,
    GetFlashcardTagByIdUseCase,
    ListAllFlashcardTagsUseCase,
    CreateFlashcardUseCase,
    GetFlashcardByIdUseCase,
  ],
})
export class FlashcardModule {}