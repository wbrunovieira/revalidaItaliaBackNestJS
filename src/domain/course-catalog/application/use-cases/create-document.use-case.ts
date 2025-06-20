// src/domain/course-catalog/application/use-cases/create-document.use-case.ts
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
      url: string;
      filename: string;
      title: string;
      fileSize: number;
      fileSizeInMB: number;
      mimeType: string;
      isDownloadable: boolean;
      downloadCount: number;
    };
    translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
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
    // 1) Validate DTO
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

    // 2) Check that the lesson exists
    const lessonOrErr = await this.lessonRepo.findById(data.lessonId);
    if (lessonOrErr.isLeft()) {
      return left(new LessonNotFoundError());
    }

    // 3) Check for duplicate filename
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

    // 4) Additional file validation
    if (data.fileSize > 50 * 1024 * 1024) {
      // 50MB
      return left(new InvalidFileError('File size exceeds 50MB limit'));
    }

    // 5) Build our domain Document
    const ptTr = data.translations.find((t) => t.locale === 'pt')!;
    const documentEntity = Document.create({
      url: data.url,
      filename: data.filename,
      title: ptTr.title,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      isDownloadable: data.isDownloadable ?? true,
    });

    // 6) Persist under that lesson
    const saveOrErr = await this.documentRepo.create(
      data.lessonId,
      documentEntity,
      data.translations,
    );
    if (saveOrErr.isLeft()) {
      return left(new RepositoryError(saveOrErr.value.message));
    }

    // 7) Return DTO view including translations
    return right({
      document: {
        id: documentEntity.id.toString(),
        url: documentEntity.url,
        filename: documentEntity.filename,
        title: documentEntity.title,
        fileSize: documentEntity.fileSize,
        fileSizeInMB: documentEntity.getFileSizeInMB(),
        mimeType: documentEntity.mimeType,
        isDownloadable: documentEntity.isDownloadable,
        downloadCount: documentEntity.downloadCount,
      },
      translations: data.translations,
    });
  }
}
