// src/infra/assessment.module.ts
import { Module } from '@nestjs/common';

import { CreateAssessmentUseCase } from '@/domain/assessment/application/use-cases/create-assessment.use-case';

import { PrismaAssessmentRepository } from '@/infra/database/prisma/repositories/prisma-assessment-repository';
import { PrismaLessonRepository } from '@/infra/database/prisma/repositories/prisma-lesson-repository';
import { DatabaseModule } from '@/infra/database/database.module';
import { AssessmentController } from './controllers/assessment.controller';
import { ListAssessmentsUseCase } from '@/domain/assessment/application/use-cases/list-assessments.use-case';
import { GetAssessmentUseCase } from '@/domain/assessment/application/use-cases/get-assessment.use-case';
import { DeleteAssessmentUseCase } from '@/domain/assessment/application/use-cases/delete-assessment.use-case';

@Module({
  imports: [DatabaseModule],
  controllers: [AssessmentController], // Adicione o controller aqui
  providers: [
    CreateAssessmentUseCase,
    ListAssessmentsUseCase,
    GetAssessmentUseCase,
    DeleteAssessmentUseCase,

    {
      provide: 'AssessmentRepository',
      useClass: PrismaAssessmentRepository,
    } as const,
    {
      provide: 'LessonRepository',
      useClass: PrismaLessonRepository,
    } as const,
  ],
  exports: [
    'AssessmentRepository',
    CreateAssessmentUseCase,
    ListAssessmentsUseCase,
  ], // Exporte o use case se necessário
})
export class AssessmentModule {}
