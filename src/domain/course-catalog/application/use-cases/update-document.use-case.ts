// src/domain/course-catalog/application/use-cases/update-document.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IDocumentRepository } from '../repositories/i-document-repository';
import { UpdateDocumentRequest } from '../dtos/update-document-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { DocumentNotFoundError } from './errors/document-not-found-error';
import { Document } from '../../enterprise/entities/document.entity';
import {
  UpdateDocumentSchema,
  updateDocumentSchema,
} from './validations/update-document.schema';

type UpdateDocumentUseCaseResponse = Either<
  InvalidInputError | DocumentNotFoundError | RepositoryError | Error,
  {
    document: Document;
    translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
      url: string;
    }>;
  }
>;

@Injectable()
export class UpdateDocumentUseCase {
  constructor(
    @Inject('DocumentRepository')
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async execute(
    request: UpdateDocumentRequest,
  ): Promise<UpdateDocumentUseCaseResponse> {
    // Validação de entrada
    const parseResult = updateDocumentSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => {
        const detail: any = {
          code: issue.code,
          message: issue.message,
          path: issue.path,
        };
        if (issue.code === 'invalid_type') {
          detail.expected = (issue as any).expected;
          detail.received = (issue as any).received;
        }
        return detail;
      });
      return left(new InvalidInputError('Validation failed', details));
    }

    const data: UpdateDocumentSchema = parseResult.data;

    try {
      // Buscar o documento existente
      const documentResult = await this.documentRepository.findById(data.id);
      if (documentResult.isLeft()) {
        return left(new DocumentNotFoundError());
      }

      const { document: existingDocument, translations: currentTranslations } =
        documentResult.value;

      // Atualizar os campos do documento se fornecidos
      if (
        data.filename !== undefined ||
        data.fileSize !== undefined ||
        data.mimeType !== undefined ||
        data.isDownloadable !== undefined
      ) {
        existingDocument.updateDetails({
          filename: data.filename,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          isDownloadable: data.isDownloadable,
        });
      }

      // Preparar traduções para atualização
      let updatedTranslations = currentTranslations;

      if (data.translations) {
        // Atualizar traduções com as novas
        updatedTranslations = data.translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          description: t.description,
          url: t.url,
        }));
      }

      // Salvar as alterações
      const updateResult = await this.documentRepository.update(
        existingDocument,
        updatedTranslations,
      );
      if (updateResult.isLeft()) {
        return left(new RepositoryError(updateResult.value.message));
      }

      return right({
        document: existingDocument,
        translations: updatedTranslations,
      });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}
