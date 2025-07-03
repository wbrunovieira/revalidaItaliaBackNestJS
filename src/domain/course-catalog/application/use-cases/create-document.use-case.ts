import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';

import { Document } from '@/domain/course-catalog/enterprise/entities/document.entity';
import { IDocumentRepository } from '../repositories/i-document-repository';
import { ILessonRepository } from '../repositories/i-lesson-repository';
import { InvalidInputError } from './errors/invalid-input-error';
import { DuplicateDocumentError } from './errors/duplicate-document-error';
import { RepositoryError } from './errors/repository-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { InvalidFileError } from './errors/invalid-file-error';
import {
  createDocumentSchema,
  CreateDocumentSchema,
} from './validations/create-document.schema';
import { CreateDocumentRequest } from '../dtos/create-document-request.dto';

export type CreateDocumentUseCaseResponse = Either<
  | InvalidInputError
  | LessonNotFoundError
  | DuplicateDocumentError
  | InvalidFileError
  | RepositoryError,
  {
    document: {
      id: string;
      filename: string;
      fileSize: number;
      fileSizeInMB: number;
      mimeType: string;
      isDownloadable: boolean;
      downloadCount: number;
      createdAt: Date;
      updatedAt: Date;
    };
    translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
      url: string;
    }>;
  }
>;

@Injectable()
export class CreateDocumentUseCase {
  constructor(
    @Inject('LessonRepository')
    private readonly lessonRepo: ILessonRepository,

    @Inject('DocumentRepository')
    private readonly documentRepo: IDocumentRepository,
  ) {}

  async execute(
    request: CreateDocumentRequest,
  ): Promise<CreateDocumentUseCaseResponse> {
    // 1) valida DTO
    const parseResult = createDocumentSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((iss) => ({
        code: iss.code,
        message: iss.message,
        path: iss.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }
    const data = parseResult.data as CreateDocumentSchema;

    // 2) verifica existência da aula
    const lessonOrErr = await this.lessonRepo.findById(data.lessonId);
    if (lessonOrErr.isLeft()) {
      return left(new LessonNotFoundError());
    }

    // 3) evita duplicação de filename
    const existingOrErr = await this.documentRepo.findByFilename(data.filename);
    if (existingOrErr.isRight()) {
      return left(new DuplicateDocumentError());
    }
    if (
      existingOrErr.isLeft() &&
      existingOrErr.value.message !== 'Document not found'
    ) {
      return left(new RepositoryError(existingOrErr.value.message));
    }

    // 4) valida tamanho de arquivo (caso extra)
    if (data.fileSize > 50 * 1024 * 1024) {
      return left(new InvalidFileError('File size exceeds 50MB limit'));
    }

    // 5) cria entidade de domínio incluindo traduções com URL
    const documentEntity = Document.create({
      filename: data.filename,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      isDownloadable: data.isDownloadable,
      translations: data.translations,
    });

    // 6) persiste no repositório
    const saveOrErr = await this.documentRepo.create(
      data.lessonId,
      documentEntity,
      data.translations,
    );
    if (saveOrErr.isLeft()) {
      return left(new RepositoryError(saveOrErr.value.message));
    }

    // 7) monta resposta
    const resp = documentEntity.toResponseObject();
    return right({
      document: {
        id: resp.id,
        filename: resp.filename,
        fileSize: resp.fileSize,
        fileSizeInMB: resp.fileSizeInMB,
        mimeType: resp.mimeType,
        isDownloadable: resp.isDownloadable,
        downloadCount: resp.downloadCount,
        createdAt: resp.createdAt,
        updatedAt: resp.updatedAt,
      },
      translations: resp.translations,
    });
  }
}
