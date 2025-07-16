// src/infra/assessment.module.ts
import { Module } from '@nestjs/common';

import { CreateAssessmentUseCase } from '@/domain/assessment/application/use-cases/create-assessment.use-case';
import { GetQuestionsDetailedUseCase } from '@/domain/assessment/application/use-cases/get-questions-detailed.use-case';

import { PrismaAssessmentRepository } from '@/infra/database/prisma/repositories/prisma-assessment-repository';
import { PrismaLessonRepository } from '@/infra/database/prisma/repositories/prisma-lesson-repository';
import { PrismaQuestionRepository } from '@/infra/database/prisma/repositories/prisma-question-repository';
import { PrismaQuestionOptionRepository } from '@/infra/database/prisma/repositories/prisma-question-option-repository';
import { PrismaAnswerRepository } from '@/infra/database/prisma/repositories/prisma-answer-repository';
import { PrismaArgumentRepository } from '@/infra/database/prisma/repositories/prisma-argument-repository';
import { DatabaseModule } from '@/infra/database/database.module';
import { AssessmentController } from './controllers/assessment.controller';
import { ListAssessmentsUseCase } from '@/domain/assessment/application/use-cases/list-assessments.use-case';
import { GetAssessmentUseCase } from '@/domain/assessment/application/use-cases/get-assessment.use-case';
import { DeleteAssessmentUseCase } from '@/domain/assessment/application/use-cases/delete-assessment.use-case';
import { UpdateAssessmentUseCase } from '@/domain/assessment/application/use-cases/update-assessment.use-case';
import { ListQuestionsByAssessmentUseCase } from '@/domain/assessment/application/use-cases/list-questions-by-assessment.use-case';

@Module({
  imports: [DatabaseModule],
  controllers: [AssessmentController], // Adicione o controller aqui
  providers: [
    CreateAssessmentUseCase,
    ListAssessmentsUseCase,
    GetAssessmentUseCase,
    DeleteAssessmentUseCase,
    UpdateAssessmentUseCase,
    ListQuestionsByAssessmentUseCase,
    GetQuestionsDetailedUseCase,

    {
      provide: 'AssessmentRepository',
      useClass: PrismaAssessmentRepository,
    } as const,
    {
      provide: 'LessonRepository',
      useClass: PrismaLessonRepository,
    } as const,
    {
      provide: 'QuestionRepository',
      useClass: PrismaQuestionRepository,
    } as const,
    {
      provide: 'QuestionOptionRepository',
      useClass: PrismaQuestionOptionRepository,
    } as const,
    {
      provide: 'AnswerRepository',
      useClass: PrismaAnswerRepository,
    } as const,
    {
      provide: 'ArgumentRepository',
      useClass: PrismaArgumentRepository,
    } as const,
  ],
  exports: [
    'AssessmentRepository',
    CreateAssessmentUseCase,
    ListAssessmentsUseCase,
    GetQuestionsDetailedUseCase,
  ], // Exporte o use case se necessário
})
export class AssessmentModule {}
