// src/infra/answer.module.ts
import { Module } from '@nestjs/common';

import { GetAnswerUseCase } from '@/domain/assessment/application/use-cases/get-answer.use-case';

import { PrismaAnswerRepository } from '@/infra/database/prisma/repositories/prisma-answer-repository';
import { DatabaseModule } from '@/infra/database/database.module';
import { AnswerController } from './controllers/answer.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AnswerController],
  providers: [
    GetAnswerUseCase,

    {
      provide: 'AnswerRepository',
      useClass: PrismaAnswerRepository,
    } as const,
  ],
  exports: [
    'AnswerRepository',
    GetAnswerUseCase,
  ],
})
export class AnswerModule {}