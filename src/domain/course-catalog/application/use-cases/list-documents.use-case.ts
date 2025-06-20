// src/domain/course-catalog/application/use-cases/list-documents.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';

import { IDocumentRepository } from '../repositories/i-document-repository';
import { ILessonRepository } from '../repositories/i-lesson-repository';
import { InvalidInputError } from './errors/invalid-input-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { ListDocumentsRequest } from '../dtos/list-documents-request.dto';
import {
  ListDocumentsSchema,
  listDocumentsSchema,
} from './validations/list-documents.schema';

export type ListDocumentsUseCaseResponse = Either<
  InvalidInputError | LessonNotFoundError | RepositoryError,
  {
    documents: Array<{
      id: string;
      url: string;
      filename: string;
      title: string;
      fileSize: number;
      fileSizeInMB: number;
      mimeType: string;
      isDownloadable: boolean;
      downloadCount: number;
      createdAt: Date;
      updatedAt: Date;
      translations: Array<{
        locale: 'pt' | 'it' | 'es';
        title: string;
        description: string;
      }>;
    }>;
  }
>;

@Injectable()
export class ListDocumentsUseCase {
  constructor(
    @Inject('LessonRepository')
    private readonly lessonRepo: ILessonRepository,

    @Inject('DocumentRepository')
    private readonly documentRepo: IDocumentRepository,
  ) {}

  async execute(
    request: ListDocumentsRequest,
  ): Promise<ListDocumentsUseCaseResponse> {
    // 1) Validate DTO
    const parseResult = listDocumentsSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((iss) => ({
        code: iss.code,
        message: iss.message,
        path: iss.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }
    const data = parseResult.data as ListDocumentsSchema;

    // 2) Check that the lesson exists
    const lessonOrErr = await this.lessonRepo.findById(data.lessonId);
    if (lessonOrErr.isLeft()) {
      return left(new LessonNotFoundError());
    }

    // 3) Get documents for this lesson
    const documentsOrErr = await this.documentRepo.findByLesson(data.lessonId);
    if (documentsOrErr.isLeft()) {
      return left(new RepositoryError(documentsOrErr.value.message));
    }

    // 4) Transform to response format
    const documents = documentsOrErr.value.map(
      ({ document, translations }) => ({
        id: document.id.toString(),
        url: document.url,
        filename: document.filename,
        title: document.title,
        fileSize: document.fileSize,
        fileSizeInMB: document.getFileSizeInMB(),
        mimeType: document.mimeType,
        isDownloadable: document.isDownloadable,
        downloadCount: document.downloadCount,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        translations,
      }),
    );

    return right({ documents });
  }
}
