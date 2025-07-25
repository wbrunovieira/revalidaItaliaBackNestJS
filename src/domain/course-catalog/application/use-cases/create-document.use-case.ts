// src/domain/course-catalog/application/use-cases/create-document.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';

import { Document } from '@/domain/course-catalog/enterprise/entities/document.entity';
import { IDocumentRepository } from '../repositories/i-document-repository';
import { ILessonRepository } from '../repositories/i-lesson-repository';
import {
  DuplicateDocumentError,
  RepositoryError,
  InvalidFileError,
} from '@/domain/course-catalog/domain/exceptions';
import { InvalidInputError } from './errors/invalid-input-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
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
    const data = parseResult.data;

    // 2) verifica existência da aula
    const lessonOrErr = await this.lessonRepo.findById(data.lessonId);
    if (lessonOrErr.isLeft()) {
      return left(new LessonNotFoundError());
    }

    // 3) evita duplicação de filename
    const existingOrErr = await this.documentRepo.findByFilename(data.filename);
    if (existingOrErr.isRight()) {
      return left(new DuplicateDocumentError(data.filename));
    }
    if (
      existingOrErr.isLeft() &&
      existingOrErr.value.message !== 'Document not found'
    ) {
      return left(RepositoryError.find('document', existingOrErr.value));
    }

    // 4) cria entidade de domínio incluindo traduções com URL
    const documentEntity = Document.create({
      filename: data.filename,
      translations: data.translations,
    });

    // 6) persiste no repositório
    const saveOrErr = await this.documentRepo.create(
      data.lessonId,
      documentEntity,
      data.translations,
    );
    if (saveOrErr.isLeft()) {
      return left(RepositoryError.create('document', saveOrErr.value));
    }

    // 7) monta resposta
    const resp = documentEntity.toResponseObject();
    return right({
      document: {
        id: resp.id,
        filename: resp.filename,
        createdAt: resp.createdAt,
        updatedAt: resp.updatedAt,
      },
      translations: resp.translations,
    });
  }
}
