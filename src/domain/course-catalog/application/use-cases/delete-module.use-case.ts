// src/domain/course-catalog/application/use-cases/delete-module.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IModuleRepository } from '../repositories/i-module-repository';
import { DeleteModuleRequest } from '../dtos/delete-module-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { ModuleNotFoundError } from './errors/module-not-found-error';
import { ModuleHasDependenciesError } from './errors/module-has-dependencies-error';
import { ModuleDependencyInfo } from '../dtos/module-dependencies.dto';
import {
  DeleteModuleSchema,
  deleteModuleSchema,
} from './validations/delete-module.schema';

type DeleteModuleUseCaseResponse = Either<
  | InvalidInputError
  | ModuleNotFoundError
  | ModuleHasDependenciesError
  | RepositoryError
  | Error,
  {
    message: string;
    deletedAt: Date;
  }
>;

@Injectable()
export class DeleteModuleUseCase {
  constructor(
    @Inject('ModuleRepository')
    private readonly moduleRepository: IModuleRepository,
  ) {}

  async execute(
    request: DeleteModuleRequest,
  ): Promise<DeleteModuleUseCaseResponse> {
    // Validação de entrada
    const parseResult = deleteModuleSchema.safeParse(request);
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

    const data: DeleteModuleSchema = parseResult.data;

    try {
      // Verificar se o módulo existe
      const existingModuleResult = await this.moduleRepository.findById(
        data.id,
      );

      if (existingModuleResult.isLeft()) {
        return left(new ModuleNotFoundError());
      }

      // Verificar dependências com informações detalhadas
      const dependenciesResult =
        await this.moduleRepository.checkModuleDependencies(data.id);

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
        const error = new ModuleHasDependenciesError(
          dependencyNames,
          dependencyInfo,
        );
        (error as any).dependencyInfo = dependencyInfo; // Adicionar info extra

        return left(error);
      }

      // Deletar o módulo
      const deleteResult = await this.moduleRepository.delete(data.id);

      if (deleteResult.isLeft()) {
        return left(new RepositoryError(deleteResult.value.message));
      }

      return right({
        message: 'Module deleted successfully',
        deletedAt: new Date(),
      });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}
