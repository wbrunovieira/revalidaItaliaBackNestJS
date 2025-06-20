// src/domain/course-catalog/application/use-cases/get-document.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';

import { IDocumentRepository } from '../repositories/i-document-repository';
import { ILessonRepository } from '../repositories/i-lesson-repository';
import { InvalidInputError } from './errors/invalid-input-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { DocumentNotFoundError } from './errors/document-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { GetDocumentRequest } from '../dtos/get-document-request.dto';
import {
  GetDocumentSchema,
  getDocumentSchema,
} from './validations/get-document.schema';

export type GetDocumentUseCaseResponse = Either<
  | InvalidInputError
  | LessonNotFoundError
  | DocumentNotFoundError
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
      createdAt: Date;
      updatedAt: Date;
      translations: Array<{
        locale: 'pt' | 'it' | 'es';
        title: string;
        description: string;
      }>;
    };
  }
>;

@Injectable()
export class GetDocumentUseCase {
  constructor(
    @Inject('LessonRepository')
    private readonly lessonRepo: ILessonRepository,

    @Inject('DocumentRepository')
    private readonly documentRepo: IDocumentRepository,
  ) {}

  async execute(
    request: GetDocumentRequest,
  ): Promise<GetDocumentUseCaseResponse> {
    // 1) Validate DTO
    const parseResult = getDocumentSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((iss) => ({
        code: iss.code,
        message: iss.message,
        path: iss.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }
    const data = parseResult.data as GetDocumentSchema;

    // 2) Check that the lesson exists
    const lessonOrErr = await this.lessonRepo.findById(data.lessonId);
    if (lessonOrErr.isLeft()) {
      return left(new LessonNotFoundError());
    }

    // 3) Get document by ID
    const documentOrErr = await this.documentRepo.findById(data.documentId);
    if (documentOrErr.isLeft()) {
      if (documentOrErr.value.message === 'Document not found') {
        return left(new DocumentNotFoundError());
      }
      return left(new RepositoryError(documentOrErr.value.message));
    }

    const { document, translations } = documentOrErr.value;

    // 4) Verify document belongs to the lesson (security check)
    const documentsInLessonOrErr = await this.documentRepo.findByLesson(
      data.lessonId,
    );
    if (documentsInLessonOrErr.isLeft()) {
      return left(new RepositoryError(documentsInLessonOrErr.value.message));
    }

    const documentBelongsToLesson = documentsInLessonOrErr.value.some(
      ({ document: doc }) => doc.id.toString() === data.documentId,
    );

    if (!documentBelongsToLesson) {
      return left(new DocumentNotFoundError());
    }

    // 5) Transform to response format
    const documentResponse = {
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
    };

    return right({ document: documentResponse });
  }
}
