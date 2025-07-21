// src/infra/attempt.module.ts
import { Module } from '@nestjs/common';

import { StartAttemptUseCase } from '@/domain/assessment/application/use-cases/start-attempt.use-case';
import { SubmitAnswerUseCase } from '@/domain/assessment/application/use-cases/submit-answer.use-case';
import { SubmitAttemptUseCase } from '@/domain/assessment/application/use-cases/submit-attempt.use-case';
import { GetAttemptResultsUseCase } from '@/domain/assessment/application/use-cases/get-attempt-results.use-case';
import { ReviewOpenAnswerUseCase } from '@/domain/assessment/application/use-cases/review-open-answer.use-case';
import { ListAttemptsUseCase } from '@/domain/assessment/application/use-cases/list-attempts.use-case';
import { ListPendingReviewsUseCase } from '@/domain/assessment/application/use-cases/list-pending-reviews.use-case';
import { PrismaAttemptRepository } from '@/infra/database/prisma/repositories/prisma-attempt-repository';
import { PrismaAssessmentRepository } from '@/infra/database/prisma/repositories/prisma-assessment-repository';
import { UserModule } from '@/infra/modules/user/user.module';
import { IUserAggregatedViewRepository } from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { PrismaQuestionRepository } from '@/infra/database/prisma/repositories/prisma-question-repository';
import { PrismaAttemptAnswerRepository } from '@/infra/database/prisma/repositories/prisma-attempt-answer-repository';
import { PrismaAnswerRepository } from '@/infra/database/prisma/repositories/prisma-answer-repository';
import { PrismaArgumentRepository } from '@/infra/database/prisma/repositories/prisma-argument-repository';
import { DatabaseModule } from '@/infra/database/database.module';
import { AttemptController } from '@/infra/controllers/attempt.controller';

@Module({
  imports: [DatabaseModule, UserModule],
  controllers: [AttemptController],
  providers: [
    StartAttemptUseCase,
    SubmitAnswerUseCase,
    SubmitAttemptUseCase,
    GetAttemptResultsUseCase,
    ReviewOpenAnswerUseCase,
    ListAttemptsUseCase,
    ListPendingReviewsUseCase,
    {
      provide: 'AttemptRepository',
      useClass: PrismaAttemptRepository,
    },
    {
      provide: 'AssessmentRepository',
      useClass: PrismaAssessmentRepository,
    },
    // UserAggregatedViewRepository is provided by UserModule
    {
      provide: 'QuestionRepository',
      useClass: PrismaQuestionRepository,
    },
    {
      provide: 'AttemptAnswerRepository',
      useClass: PrismaAttemptAnswerRepository,
    },
    {
      provide: 'AnswerRepository',
      useClass: PrismaAnswerRepository,
    },
    {
      provide: 'ArgumentRepository',
      useClass: PrismaArgumentRepository,
    },
  ],
  exports: [
    'AttemptRepository',
    'QuestionRepository',
    'AttemptAnswerRepository',
    StartAttemptUseCase,
    SubmitAnswerUseCase,
    SubmitAttemptUseCase,
    GetAttemptResultsUseCase,
    ReviewOpenAnswerUseCase,
    ListAttemptsUseCase,
    ListPendingReviewsUseCase,
  ],
})
export class AttemptModule {}
