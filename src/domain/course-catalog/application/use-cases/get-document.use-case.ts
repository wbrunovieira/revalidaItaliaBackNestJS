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
        url: string;
      }>;
    };
  }
>;

@Injectable()
export class GetDocumentUseCase {
  constructor(
    @Inject('LessonRepository') private readonly lessonRepo: ILessonRepository,
    @Inject('DocumentRepository')
    private readonly documentRepo: IDocumentRepository,
  ) {}

  async execute(
    request: GetDocumentRequest,
  ): Promise<GetDocumentUseCaseResponse> {
    // 1) valida DTO
    const parseResult = getDocumentSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((iss) => ({
        code: iss.code,
        message: iss.message,
        path: iss.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }
    const data = parseResult.data;

    // 2) verifica existência da aula
    const lessonOrErr = await this.lessonRepo.findById(data.lessonId);
    if (lessonOrErr.isLeft()) {
      return left(new LessonNotFoundError());
    }

    // 3) busca documento por ID
    const documentOrErr = await this.documentRepo.findById(data.documentId);
    if (documentOrErr.isLeft()) {
      const err = documentOrErr.value;
      if (err.message === 'Document not found') {
        return left(new DocumentNotFoundError());
      }
      return left(new RepositoryError(err.message));
    }
    const { document } = documentOrErr.value;

    // 4) verifica se pertence à aula
    const docsInLessonOrErr = await this.documentRepo.findByLesson(
      data.lessonId,
    );
    if (docsInLessonOrErr.isLeft()) {
      return left(new RepositoryError(docsInLessonOrErr.value.message));
    }
    const belongs = docsInLessonOrErr.value.some(
      (d) => d.document.id.toString() === data.documentId,
    );
    if (!belongs) {
      return left(new DocumentNotFoundError());
    }

    // 5) monta resposta usando entity.toResponseObject()
    const resp = document.toResponseObject();

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
        translations: resp.translations,
      },
    });
  }
}
