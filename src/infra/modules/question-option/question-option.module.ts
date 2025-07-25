// src/infra/question-option.module.ts
import { Module } from '@nestjs/common';

import { CreateQuestionOptionUseCase } from '@/domain/assessment/application/use-cases/create-question-option.use-case';
import { ListQuestionOptionsUseCase } from '@/domain/assessment/application/use-cases/list-question-options.use-case';

import { PrismaQuestionOptionRepository } from '@/infra/database/prisma/repositories/prisma-question-option-repository';
import { PrismaQuestionRepository } from '@/infra/database/prisma/repositories/prisma-question-repository';
import { DatabaseModule } from '@/infra/database/database.module';
import { QuestionOptionController } from '@/infra/controllers/question-option.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [QuestionOptionController],
  providers: [
    CreateQuestionOptionUseCase,
    ListQuestionOptionsUseCase,

    {
      provide: 'QuestionOptionRepository',
      useClass: PrismaQuestionOptionRepository,
    } as const,
    {
      provide: 'QuestionRepository',
      useClass: PrismaQuestionRepository,
    } as const,
  ],
  exports: [
    'QuestionOptionRepository',
    CreateQuestionOptionUseCase,
    ListQuestionOptionsUseCase,
  ],
})
export class QuestionOptionModule {}
