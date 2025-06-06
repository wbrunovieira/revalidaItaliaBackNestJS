// src/infra/course-catalog/course.module.ts
import { Module } from '@nestjs/common'

import { CreateCourseUseCase } from '@/domain/course-catalog/application/use-cases/create-course.use-case'

import { PrismaCourseRepository } from '@/infra/database/prisma/repositories/prisma-course-repository'
import { DatabaseModule } from '@/infra/database/database.module'
import { CourseController } from './controllers/course.controller'
import { ListCoursesUseCase } from '@/domain/course-catalog/application/use-cases/list-courses.use-case'

@Module({
  imports: [DatabaseModule],
  controllers: [CourseController], 

  providers: [
    CreateCourseUseCase,
    ListCoursesUseCase,
    {
      provide: 'CourseRepository',
      useClass: PrismaCourseRepository,
    } as const,
  ],
})
export class CourseModule {}