// src/infra/attempt.module.ts
import { Module } from '@nestjs/common';

import { StartAttemptUseCase } from '@/domain/assessment/application/use-cases/start-attempt.use-case';
import { PrismaAttemptRepository } from '@/infra/database/prisma/repositories/prisma-attempt-repository';
import { PrismaAssessmentRepository } from '@/infra/database/prisma/repositories/prisma-assessment-repository';
import { PrismaAccountRepository } from '@/infra/database/prisma/repositories/prisma-account-repositories';
import { DatabaseModule } from '@/infra/database/database.module';
import { AttemptController } from './controllers/attempt.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AttemptController],
  providers: [
    StartAttemptUseCase,
    {
      provide: 'AttemptRepository',
      useClass: PrismaAttemptRepository,
    },
    {
      provide: 'AssessmentRepository',
      useClass: PrismaAssessmentRepository,
    },
    {
      provide: 'AccountRepository',
      useClass: PrismaAccountRepository,
    },
  ],
  exports: [
    'AttemptRepository',
    StartAttemptUseCase,
  ],
})
export class AttemptModule {}