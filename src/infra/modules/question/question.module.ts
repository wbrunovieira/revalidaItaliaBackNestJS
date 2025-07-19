// src/infra/question.module.ts
import { Module } from '@nestjs/common';

import { CreateQuestionUseCase } from '@/domain/assessment/application/use-cases/create-question.use-case';

import { PrismaQuestionRepository } from '@/infra/database/prisma/repositories/prisma-question-repository';
import { PrismaAssessmentRepository } from '@/infra/database/prisma/repositories/prisma-assessment-repository';
import { PrismaArgumentRepository } from '@/infra/database/prisma/repositories/prisma-argument-repository';
import { DatabaseModule } from '@/infra/database/database.module';

import { GetQuestionUseCase } from '@/domain/assessment/application/use-cases/get-question.use-case';
import { QuestionController } from '@/infra/controllers/question.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [QuestionController],
  providers: [
    CreateQuestionUseCase,
    GetQuestionUseCase,

    {
      provide: 'QuestionRepository',
      useClass: PrismaQuestionRepository,
    } as const,
    {
      provide: 'AssessmentRepository',
      useClass: PrismaAssessmentRepository,
    } as const,
    {
      provide: 'ArgumentRepository',
      useClass: PrismaArgumentRepository,
    } as const,
  ],
  exports: ['QuestionRepository', CreateQuestionUseCase],
})
export class QuestionModule {}
