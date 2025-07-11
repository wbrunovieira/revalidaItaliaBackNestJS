// src/infra/argument.module.ts
import { Module } from '@nestjs/common';

import { CreateArgumentUseCase } from '@/domain/assessment/application/use-cases/create-argument.use-case';

import { PrismaArgumentRepository } from '@/infra/database/prisma/repositories/prisma-argument-repository';
import { PrismaAssessmentRepository } from '@/infra/database/prisma/repositories/prisma-assessment-repository';
import { DatabaseModule } from '@/infra/database/database.module';
import { ArgumentController } from './controllers/argument.controller';
import { GetArgumentUseCase } from '@/domain/assessment/application/use-cases/get-argument.use-case';

@Module({
  imports: [DatabaseModule],
  controllers: [ArgumentController],
  providers: [
    CreateArgumentUseCase,
    GetArgumentUseCase,

    {
      provide: 'ArgumentRepository',
      useClass: PrismaArgumentRepository,
    } as const,
    {
      provide: 'AssessmentRepository',
      useClass: PrismaAssessmentRepository,
    } as const,
  ],
  exports: ['ArgumentRepository', CreateArgumentUseCase],
})
export class ArgumentModule {}
