// src/domain/course-catalog/application/use-cases/delete-document.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IDocumentRepository } from '../repositories/i-document-repository';
import { DeleteDocumentRequest } from '../dtos/delete-document-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { DocumentNotFoundError } from './errors/document-not-found-error';
import { DocumentHasDependenciesError } from './errors/document-has-dependencies-error';
import { DocumentDependencyInfo } from '../dtos/document-dependencies.dto';
import {
  DeleteDocumentSchema,
  deleteDocumentSchema,
} from './validations/delete-document.schema';

type DeleteDocumentUseCaseResponse = Either<
  | InvalidInputError
  | DocumentNotFoundError
  | DocumentHasDependenciesError
  | RepositoryError
  | Error,
  {
    message: string;
    deletedAt: Date;
  }
>;

@Injectable()
export class DeleteDocumentUseCase {
  constructor(
    @Inject('DocumentRepository')
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async execute(
    request: DeleteDocumentRequest,
  ): Promise<DeleteDocumentUseCaseResponse> {
    // Validação de entrada
    const parseResult = deleteDocumentSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => {
        const detail: any = {
          code: issue.code,
          message: issue.message,
          path: issue.path,
        };
        if (issue.code === 'invalid_type') {
          detail.expected = 'string';
          detail.received = (issue as any).received;
        } else if ('expected' in issue) {
          detail.expected = (issue as any).expected;
        }
        if ('received' in issue && issue.code !== 'invalid_type') {
          detail.received = (issue as any).received;
        }
        return detail;
      });
      return left(new InvalidInputError('Validation failed', details));
    }

    const data: DeleteDocumentSchema = parseResult.data;

    try {
      // Verificar se o documento existe
      const existingDocumentResult = await this.documentRepository.findById(data.id);

      if (existingDocumentResult.isLeft()) {
        return left(new DocumentNotFoundError());
      }

      // Verificar dependências com informações detalhadas
      const dependenciesResult =
        await this.documentRepository.checkDocumentDependencies(data.id);

      if (dependenciesResult.isLeft()) {
        return left(new RepositoryError(dependenciesResult.value.message));
      }

      const dependencyInfo = dependenciesResult.value;

      // Se não pode deletar, retornar erro detalhado
      if (!dependencyInfo.canDelete) {
        const dependencyNames = dependencyInfo.dependencies.map(
          (dep) => dep.name,
        );

        // Criar erro customizado com informações para o frontend
        const error = new DocumentHasDependenciesError(
          dependencyNames,
          dependencyInfo,
        );
        (error as any).dependencyInfo = dependencyInfo; // Adicionar info extra

        return left(error);
      }

      // Deletar o documento
      const deleteResult = await this.documentRepository.delete(data.id);

      if (deleteResult.isLeft()) {
        return left(new RepositoryError(deleteResult.value.message));
      }

      return right({
        message: 'Document deleted successfully',
        deletedAt: new Date(),
      });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}