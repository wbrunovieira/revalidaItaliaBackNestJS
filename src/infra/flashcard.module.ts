import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { FlashcardTagController } from './controllers/flashcard-tag.controller';
import { CreateFlashcardTagUseCase } from '@/domain/flashcard/application/use-cases/create-flashcard-tag.use-case';
import { GetFlashcardTagByIdUseCase } from '@/domain/flashcard/application/use-cases/get-flashcard-tag-by-id.use-case';
import { ListAllFlashcardTagsUseCase } from '@/domain/flashcard/application/use-cases/list-all-flashcard-tags.use-case';
import { PrismaFlashcardTagRepository } from './database/prisma/repositories/prisma-flashcard-tag-repository';
import { PrismaFlashcardRepository } from './database/prisma/repositories/prisma-flashcard-repository';
import { PrismaFlashcardInteractionRepository } from './database/prisma/repositories/prisma-flashcard-interaction-repository';

@Module({
  imports: [DatabaseModule],
  controllers: [FlashcardTagController],
  providers: [
    // Use Cases
    CreateFlashcardTagUseCase,
    GetFlashcardTagByIdUseCase,
    ListAllFlashcardTagsUseCase,

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
  ],
  exports: [
    'FlashcardTagRepository',
    'FlashcardRepository', 
    'FlashcardInteractionRepository',
    CreateFlashcardTagUseCase,
    GetFlashcardTagByIdUseCase,
    ListAllFlashcardTagsUseCase,
  ],
})
export class FlashcardModule {}