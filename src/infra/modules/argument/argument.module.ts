// src/infra/argument.module.ts
import { Module } from '@nestjs/common';

import { CreateArgumentUseCase } from '@/domain/assessment/application/use-cases/create-argument.use-case';

import { PrismaArgumentRepository } from '@/infra/database/prisma/repositories/prisma-argument-repository';
import { PrismaAssessmentRepository } from '@/infra/database/prisma/repositories/prisma-assessment-repository';
import { DatabaseModule } from '@/infra/database/database.module';

import { GetArgumentUseCase } from '@/domain/assessment/application/use-cases/get-argument.use-case';
import { ListArgumentsUseCase } from '@/domain/assessment/application/use-cases/list-arguments.use-case';
import { UpdateArgumentUseCase } from '@/domain/assessment/application/use-cases/update-argument.use-case';
import { ArgumentController } from '@/infra/controllers/argument.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ArgumentController],
  providers: [
    CreateArgumentUseCase,
    GetArgumentUseCase,
    ListArgumentsUseCase,
    UpdateArgumentUseCase,

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
