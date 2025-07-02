// src/domain/course-catalog/application/use-cases/update-module.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IModuleRepository } from '../repositories/i-module-repository';
import { UpdateModuleRequest } from '../dtos/update-module-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { ModuleNotFoundError } from './errors/module-not-found-error';
import { ModuleSlugAlreadyExistsError } from './errors/module-slug-already-exists-error';
import { DuplicateModuleOrderError } from './errors/duplicate-module-order-error';
import { Module } from '../../enterprise/entities/module.entity';
import {
  UpdateModuleSchema,
  updateModuleSchema,
} from './validations/update-module.schema';

type UpdateModuleUseCaseResponse = Either<
  | InvalidInputError
  | ModuleNotFoundError
  | ModuleSlugAlreadyExistsError
  | DuplicateModuleOrderError
  | RepositoryError
  | Error,
  {
    module: Module;
  }
>;

@Injectable()
export class UpdateModuleUseCase {
  constructor(
    @Inject('ModuleRepository')
    private readonly moduleRepository: IModuleRepository,
  ) {}

  async execute(
    request: UpdateModuleRequest,
  ): Promise<UpdateModuleUseCaseResponse> {
    // Validação de entrada
    const parseResult = updateModuleSchema.safeParse(request);
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

    const data: UpdateModuleSchema = parseResult.data;

    try {
      // Buscar o módulo existente
      const moduleResult = await this.moduleRepository.findById(data.id);
      if (moduleResult.isLeft()) {
        return left(new ModuleNotFoundError());
      }

      const existingModule = moduleResult.value;

      // Se está atualizando o slug, verificar se já existe
      if (data.slug && data.slug !== existingModule.slug) {
        const slugCheckResult = await this.moduleRepository.findBySlug(
          data.slug,
        );
        if (slugCheckResult.isLeft()) {
          return left(new RepositoryError(slugCheckResult.value.message));
        }

        if (slugCheckResult.value !== null) {
          return left(new ModuleSlugAlreadyExistsError(data.slug));
        }
      }

      // Se está atualizando a ordem, verificar duplicata
      if (data.order !== undefined && data.order !== existingModule.order) {
        // Buscar o courseId do módulo
        const courseIdResult =
          await this.moduleRepository.findCourseIdByModuleId(data.id);
        if (courseIdResult.isLeft()) {
          return left(new RepositoryError(courseIdResult.value.message));
        }

        const courseId = courseIdResult.value;

        // Verificar se já existe um módulo com essa ordem no curso
        const orderCheckResult =
          await this.moduleRepository.findByCourseIdAndOrder(
            courseId,
            data.order,
          );

        if (orderCheckResult.isRight()) {
          // Se encontrou um módulo com essa ordem e não é o mesmo módulo
          if (orderCheckResult.value.id.toString() !== data.id) {
            return left(new DuplicateModuleOrderError());
          }
        }
      }

      // Atualizar o módulo
      if (data.slug) {
        existingModule.updateDetails({ slug: data.slug });
      }

      if (data.imageUrl !== undefined) {
        if (data.imageUrl === null) {
          existingModule.removeImage();
        } else {
          existingModule.updateImageUrl(data.imageUrl);
        }
      }

      if (data.translations) {
        // Atualizar traduções
        // Por simplicidade, vamos substituir todas as traduções
        // Em um caso real, poderia ser mais sofisticado
        (existingModule as any).props.translations = data.translations.map(
          (t) => ({
            locale: t.locale,
            title: t.title,
            description: t.description,
          }),
        );
        (existingModule as any).touch();
      }

      if (data.order !== undefined) {
        existingModule.updateDetails({ order: data.order });
      }

      // Salvar as alterações
      const updateResult = await this.moduleRepository.update(existingModule);
      if (updateResult.isLeft()) {
        return left(new RepositoryError(updateResult.value.message));
      }

      return right({
        module: existingModule,
      });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}
