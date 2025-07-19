// src/infra/course-catalog/lesson.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infra/database/database.module';
import { CreateLessonUseCase } from '@/domain/course-catalog/application/use-cases/create-lesson.use-case';
import { PrismaModuleRepository } from '@/infra/database/prisma/repositories/prisma-module-repository';
import { PrismaLessonRepository } from '@/infra/database/prisma/repositories/prisma-lesson-repository';

import { ListLessonsUseCase } from '@/domain/course-catalog/application/use-cases/list-lessons.use-case';
import { GetLessonUseCase } from '@/domain/course-catalog/application/use-cases/get-lesson.use-case';
import { DeleteLessonUseCase } from '@/domain/course-catalog/application/use-cases/delete-lesson.use-case';
import { UpdateLessonUseCase } from '@/domain/course-catalog/application/use-cases/update-lesson.use-case';
import { VideoModule } from '../video/video.module';
import { LessonController } from '@/infra/controllers/lesson.controller';

@Module({
  imports: [DatabaseModule, VideoModule],
  controllers: [LessonController],
  providers: [
    // Use‐case
    CreateLessonUseCase,
    ListLessonsUseCase,
    GetLessonUseCase,
    DeleteLessonUseCase,
    UpdateLessonUseCase,

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
  exports: ['ModuleRepository', 'LessonRepository'],
})
export class LessonModule {}
