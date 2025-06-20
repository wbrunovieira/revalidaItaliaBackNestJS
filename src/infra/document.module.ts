// src/infra/document.module.ts
import { Module } from '@nestjs/common';
import { CreateDocumentUseCase } from '@/domain/course-catalog/application/use-cases/create-document.use-case';

import { PrismaDocumentRepository } from '@/infra/database/prisma/repositories/prisma-document-repository';
import { PrismaLessonRepository } from '@/infra/database/prisma/repositories/prisma-lesson-repository';
import { DatabaseModule } from '@/infra/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { ModuleModule } from './module.module';
import { DocumentController } from './controllers/document.controller';

@Module({
  imports: [DatabaseModule, ConfigModule, ModuleModule],
  controllers: [DocumentController],
  providers: [
    CreateDocumentUseCase,

    // TODO: Adicionar quando implementados
    // GetDocumentUseCase,
    // ListDocumentsUseCase,
    // DeleteDocumentUseCase,
    // IncrementDownloadUseCase,

    { provide: 'DocumentRepository', useClass: PrismaDocumentRepository },
    { provide: 'LessonRepository', useClass: PrismaLessonRepository },
  ],
  exports: [
    CreateDocumentUseCase,
    'DocumentRepository',
    'LessonRepository',

    // TODO: Exportar quando implementados
    // GetDocumentUseCase,
    // ListDocumentsUseCase,
    // DeleteDocumentUseCase,
    // IncrementDownloadUseCase,
  ],
})
export class DocumentModule {}
