// src/infra/course-catalog/module.module.ts
import { Module as NestModule } from '@nestjs/common';

import { ModuleController } from './controllers/module.controller';
import { CreateModuleUseCase } from '@/domain/course-catalog/application/use-cases/create-module.use-case';
import { CourseModule } from './course.module';
import { PrismaModuleRepository } from './database/prisma/repositories/prisma-module-repository';
import { DatabaseModule } from './database/database.module';
import { GetModulesUseCase } from '@/domain/course-catalog/application/use-cases/get-modules.use-case';
import { GetModuleUseCase } from '@/domain/course-catalog/application/use-cases/get-module.use-case';
import { DeleteModuleUseCase } from '@/domain/course-catalog/application/use-cases/delete-module.use-case';

@NestModule({
  imports: [DatabaseModule, CourseModule],
  controllers: [ModuleController],
  providers: [
    CreateModuleUseCase,
    GetModulesUseCase,
    GetModuleUseCase,
    DeleteModuleUseCase,
    { provide: 'ModuleRepository', useClass: PrismaModuleRepository },
  ],
  exports: [
    'ModuleRepository',
    CreateModuleUseCase,
    GetModulesUseCase,
    GetModuleUseCase,
    DeleteModuleUseCase,
  ],
})
export class ModuleModule {}
