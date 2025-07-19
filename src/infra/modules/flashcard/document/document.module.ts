// src/infra/document.module.ts
import { Module } from '@nestjs/common';
import { CreateDocumentUseCase } from '@/domain/course-catalog/application/use-cases/create-document.use-case';
import { ListDocumentsUseCase } from '@/domain/course-catalog/application/use-cases/list-documents.use-case';

import { PrismaDocumentRepository } from '@/infra/database/prisma/repositories/prisma-document-repository';
import { PrismaLessonRepository } from '@/infra/database/prisma/repositories/prisma-lesson-repository';
import { DatabaseModule } from '@/infra/database/database.module';
import { ConfigModule } from '@nestjs/config';

import { GetDocumentUseCase } from '@/domain/course-catalog/application/use-cases/get-document.use-case';
import { DeleteDocumentUseCase } from '@/domain/course-catalog/application/use-cases/delete-document.use-case';
import { UpdateDocumentUseCase } from '@/domain/course-catalog/application/use-cases/update-document.use-case';
import { ModuleModule } from '../module/module.module';
import { DocumentController } from '@/infra/controllers/document.controller';

@Module({
  imports: [DatabaseModule, ConfigModule, ModuleModule],
  controllers: [DocumentController],
  providers: [
    CreateDocumentUseCase,
    ListDocumentsUseCase,
    GetDocumentUseCase,
    DeleteDocumentUseCase,
    UpdateDocumentUseCase,

    // TODO: Adicionar quando implementados
    // GetDocumentUseCase,
    // DeleteDocumentUseCase,
    // IncrementDownloadUseCase,

    { provide: 'DocumentRepository', useClass: PrismaDocumentRepository },
    { provide: 'LessonRepository', useClass: PrismaLessonRepository },
  ],
  exports: [
    CreateDocumentUseCase,
    ListDocumentsUseCase,
    DeleteDocumentUseCase,
    UpdateDocumentUseCase,
    'DocumentRepository',
    'LessonRepository',

    // TODO: Exportar quando implementados
    // GetDocumentUseCase,
    // DeleteDocumentUseCase,
    // IncrementDownloadUseCase,
  ],
})
export class DocumentModule {}
