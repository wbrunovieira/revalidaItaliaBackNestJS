// src/infra/answer.module.ts
import { Module } from '@nestjs/common';

import { GetAnswerUseCase } from '@/domain/assessment/application/use-cases/get-answer.use-case';
import { CreateAnswerUseCase } from '@/domain/assessment/application/use-cases/create-answer.use-case';
import { ListAnswersUseCase } from '@/domain/assessment/application/use-cases/list-answers.use-case';

import { PrismaAnswerRepository } from '@/infra/database/prisma/repositories/prisma-answer-repository';
import { PrismaQuestionRepository } from '@/infra/database/prisma/repositories/prisma-question-repository';
import { PrismaAssessmentRepository } from '@/infra/database/prisma/repositories/prisma-assessment-repository';
import { DatabaseModule } from '@/infra/database/database.module';
import { AnswerController } from '@/infra/controllers/answer.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AnswerController],
  providers: [
    GetAnswerUseCase,
    CreateAnswerUseCase,
    ListAnswersUseCase,

    {
      provide: 'AnswerRepository',
      useClass: PrismaAnswerRepository,
    } as const,
    {
      provide: 'QuestionRepository',
      useClass: PrismaQuestionRepository,
    } as const,
    {
      provide: 'AssessmentRepository',
      useClass: PrismaAssessmentRepository,
    } as const,
  ],
  exports: [
    'AnswerRepository',
    GetAnswerUseCase,
    CreateAnswerUseCase,
    ListAnswersUseCase,
  ],
})
export class AnswerModule {}
