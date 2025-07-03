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
      filename: string;
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
    @Inject('LessonRepository') private readonly lessonRepo: ILessonRepository,
    @Inject('DocumentRepository')
    private readonly documentRepo: IDocumentRepository,
  ) {}

  async execute(
    request: ListDocumentsRequest,
  ): Promise<ListDocumentsUseCaseResponse> {
    // 1) Validate input DTO
    const parseResult = listDocumentsSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((iss) => ({
        code: iss.code,
        message: iss.message,
        path: iss.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }
    const { lessonId } = parseResult.data as ListDocumentsSchema;

    // 2) Ensure lesson exists
    const lessonOrErr = await this.lessonRepo.findById(lessonId);
    if (lessonOrErr.isLeft()) {
      return left(new LessonNotFoundError());
    }

    // 3) Retrieve documents for this lesson
    const docsOrErr = await this.documentRepo.findByLesson(lessonId);
    if (docsOrErr.isLeft()) {
      return left(new RepositoryError(docsOrErr.value.message));
    }

    // 4) Map entity to response including translations
    const documents = docsOrErr.value.map(({ document, translations }) => {
      const base = document.toResponseObject();
      return {
        ...base,
        translations: translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          description: t.description,
          url: t.url,
        })),
      };
    });

    return right({ documents });
  }
}
