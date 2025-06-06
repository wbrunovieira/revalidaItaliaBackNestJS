// src/domain/course-catalog/application/use-cases/get-modules.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { Module as ModuleEntity } from '@/domain/course-catalog/enterprise/entities/module.entity';
import { IModuleRepository } from '../repositories/i-module-repository';
import { GetModulesRequest } from '../dtos/get-modules-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { GetModulesSchema, getModulesSchema } from './validations/get-modules.schema';

type GetModulesUseCaseResponse = Either<
  | InvalidInputError
  | RepositoryError
  | Error,
  {
    modules: Array<{
      id: string;
      slug: string;
      order: number;
      translations: Array<{
        locale: 'pt' | 'it' | 'es';
        title: string;
        description: string;
      }>;
    }>;
  }
>;

@Injectable()
export class GetModulesUseCase {
  constructor(
    @Inject('ModuleRepository')
    private readonly moduleRepository: IModuleRepository
  ) {}

  async execute(
    request: GetModulesRequest
  ): Promise<GetModulesUseCaseResponse> {

    const parseResult = getModulesSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }

    const { courseId } = parseResult.data;

    
    try {
      const allOrError = await this.moduleRepository.findByCourseId(courseId);
      if (allOrError.isLeft()) {
      
        return left(new RepositoryError(allOrError.value.message));
      }
      const domainModules = allOrError.value as ModuleEntity[];


      const payloadModules = domainModules.map((mod) => ({
        id: mod.id.toString(),
        slug: mod.slug,
        order: mod.order,
        translations: mod.translations, 
      }));

      return right({ modules: payloadModules });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}