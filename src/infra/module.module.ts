// src/infra/course-catalog/module.module.ts
import { Module as NestModule } from '@nestjs/common';

import { ModuleController } from './controllers/module.controller';
import { CreateModuleUseCase } from '@/domain/course-catalog/application/use-cases/create-module.use-case';
import { CourseModule } from './course.module'; 
import { PrismaModuleRepository } from './database/prisma/repositories/prisma-module-repository';
import { DatabaseModule } from './database/database.module';

@NestModule({
  imports: [DatabaseModule,CourseModule], 
  controllers: [ModuleController],
  providers: [
    CreateModuleUseCase,
    { provide: 'ModuleRepository', useClass: PrismaModuleRepository },
  ],
})
export class ModuleModule {}