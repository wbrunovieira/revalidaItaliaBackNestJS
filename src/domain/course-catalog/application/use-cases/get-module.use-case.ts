// src/domain/course-catalog/application/use-cases/get-module.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { Module as ModuleEntity } from '@/domain/course-catalog/enterprise/entities/module.entity';
import { IModuleRepository } from '../repositories/i-module-repository';
import { GetModuleRequest } from '../dtos/get-module-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';

import { GetModuleSchema, getModuleSchema } from './validations/get-module.schema';
import { ModuleNotFoundError } from './errors/module-not-found-error';

type GetModuleUseCaseResponse = Either<
  | InvalidInputError
  | ModuleNotFoundError
  | RepositoryError
  | Error,
  {
    module: {
      id: string;
      slug: string;
      order: number;
      translations: Array<{
        locale: 'pt' | 'it' | 'es';
        title: string;
        description: string;
      }>;
    };
  }
>;

@Injectable()
export class GetModuleUseCase {
  constructor(
    @Inject('ModuleRepository')
    private readonly moduleRepository: IModuleRepository
  ) {}

  async execute(
    request: GetModuleRequest
  ): Promise<GetModuleUseCaseResponse> {
    // 1) Validate input
    const parseResult = getModuleSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }

    const { moduleId } = parseResult.data;

    // 2) Fetch from repository
    try {
      const foundOrError = await this.moduleRepository.findById(moduleId);
      if (foundOrError.isLeft()) {
        return left(new ModuleNotFoundError());
      }
      const mod: ModuleEntity = foundOrError.value;

      // 3) Map to DTO
      const dto = {
        id: mod.id.toString(),
        slug: mod.slug,
        order: mod.order,
        translations: mod.translations,
      };

      return right({ module: dto });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}