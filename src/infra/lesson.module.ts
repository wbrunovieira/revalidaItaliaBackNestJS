// src/infra/course-catalog/lesson.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infra/database/database.module';
import { CreateLessonUseCase } from '@/domain/course-catalog/application/use-cases/create-lesson.use-case';
import { PrismaModuleRepository } from '@/infra/database/prisma/repositories/prisma-module-repository';
import { PrismaLessonRepository } from '@/infra/database/prisma/repositories/prisma-lesson-repository';
import { LessonController } from './controllers/lesson.controller';

@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [LessonController],
  providers: [
    // Use‐case
    CreateLessonUseCase,

    // Repositories
    {
      provide: 'ModuleRepository',
      useClass: PrismaModuleRepository,
    },
    {
      provide: 'LessonRepository',
      useClass: PrismaLessonRepository,
    },
  ],
  exports: [
    'ModuleRepository',
    'LessonRepository',
  ],
})
export class LessonModule {}