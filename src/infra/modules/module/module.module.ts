// src/infra/course-catalog/module.module.ts
import { Module as NestModule } from '@nestjs/common';

import { GetModulesUseCase } from '@/domain/course-catalog/application/use-cases/get-modules.use-case';
import { GetModuleUseCase } from '@/domain/course-catalog/application/use-cases/get-module.use-case';
import { DeleteModuleUseCase } from '@/domain/course-catalog/application/use-cases/delete-module.use-case';
import { UpdateModuleUseCase } from '@/domain/course-catalog/application/use-cases/update-module.use-case';
import { DatabaseModule } from '@/infra/database/database.module';
import { CourseModule } from '../courses/course.module';
import { ModuleController } from '@/infra/controllers/module.controller';
import { CreateModuleUseCase } from '@/domain/course-catalog/application/use-cases/create-module.use-case';
import { PrismaModuleRepository } from '@/infra/database/prisma/repositories/prisma-module-repository';

@NestModule({
  imports: [DatabaseModule, CourseModule],
  controllers: [ModuleController],
  providers: [
    CreateModuleUseCase,
    GetModulesUseCase,
    GetModuleUseCase,
    DeleteModuleUseCase,
    UpdateModuleUseCase,
    { provide: 'ModuleRepository', useClass: PrismaModuleRepository },
  ],
  exports: [
    'ModuleRepository',
    CreateModuleUseCase,
    GetModulesUseCase,
    GetModuleUseCase,
    DeleteModuleUseCase,
    UpdateModuleUseCase,
  ],
})
export class ModuleModule {}
