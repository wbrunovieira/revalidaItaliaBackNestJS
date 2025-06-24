// src/domain/course-catalog/application/use-cases/create-module.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { SlugVO } from '@/domain/course-catalog/enterprise/value-objects/slug.vo';
import { Module } from '@/domain/course-catalog/enterprise/entities/module.entity';
import { ICourseRepository } from '../repositories/i-course-repository';

import { CreateModuleRequest } from '../dtos/create-module-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { CourseNotFoundError } from './errors/course-not-found-error';
import { DuplicateModuleOrderError } from './errors/duplicate-module-order-error';
import {
  createModuleSchema,
  CreateModuleSchema,
} from './validations/create-module.schema';
import { IModuleRepository } from '../repositories/i-module-repository';

type CreateModuleUseCaseResponse = Either<
  | InvalidInputError
  | CourseNotFoundError
  | DuplicateModuleOrderError
  | RepositoryError
  | Error,
  {
    module: {
      id: string;
      slug: string;
      imageUrl?: string;
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
export class CreateModuleUseCase {
  constructor(
    @Inject('CourseRepository')
    private readonly courseRepository: ICourseRepository,
    @Inject('ModuleRepository')
    private readonly moduleRepository: IModuleRepository,
  ) {}

  async execute(
    request: CreateModuleRequest,
  ): Promise<CreateModuleUseCaseResponse> {
    // ✅ DEBUG 1: Ver o que chega no request
    console.log('🔍 DEBUG 1 - Raw request:', JSON.stringify(request, null, 2));

    const parseResult = createModuleSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }
    const data: CreateModuleSchema = parseResult.data;

    // ✅ DEBUG 2: Ver o que passou na validação Zod
    console.log(
      '🔍 DEBUG 2 - After Zod validation:',
      JSON.stringify(data, null, 2),
    );
    console.log('🔍 DEBUG 2.1 - imageUrl specifically:', data.imageUrl);
    console.log('🔍 DEBUG 2.2 - imageUrl type:', typeof data.imageUrl);

    try {
      const foundCourse = await this.courseRepository.findById(data.courseId);
      if (foundCourse.isLeft()) {
        return left(new CourseNotFoundError());
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    try {
      const existingModule = await this.moduleRepository.findByCourseIdAndOrder(
        data.courseId,
        data.order,
      );
      if (existingModule.isRight()) {
        return left(new DuplicateModuleOrderError());
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    let slugVo: SlugVO;
    try {
      slugVo = SlugVO.create(data.slug);
    } catch (err: any) {
      const details = [{ message: err.message, path: ['slug'] }];
      return left(new InvalidInputError('Invalid slug', details));
    }

    // ✅ DEBUG 3: Ver os dados que vão para a entidade
    const entityProps = {
      slug: slugVo.get(),
      imageUrl: data.imageUrl,
      translations: data.translations,
      order: data.order,
      videos: [],
    };
    console.log(
      '🔍 DEBUG 3 - Entity props:',
      JSON.stringify(entityProps, null, 2),
    );

    const moduleEntity = Module.create(entityProps);

    // ✅ DEBUG 4: Ver o que a entidade retorna
    console.log('🔍 DEBUG 4 - Created entity imageUrl:', moduleEntity.imageUrl);
    console.log(
      '🔍 DEBUG 4.1 - Entity props after creation:',
      JSON.stringify(
        {
          id: moduleEntity.id.toString(),
          slug: moduleEntity.slug,
          imageUrl: moduleEntity.imageUrl,
          order: moduleEntity.order,
        },
        null,
        2,
      ),
    );

    try {
      const createdOrError = await this.moduleRepository.create(
        data.courseId,
        moduleEntity,
      );
      if (createdOrError.isLeft()) {
        return left(new RepositoryError(createdOrError.value.message));
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    const responsePayload = {
      module: {
        id: moduleEntity.id.toString(),
        slug: moduleEntity.slug,
        imageUrl: moduleEntity.imageUrl,
        order: moduleEntity.order,
        translations: moduleEntity.translations.map((tr) => ({
          locale: tr.locale,
          title: tr.title,
          description: tr.description,
        })),
      },
    };

    // ✅ DEBUG 5: Ver a resposta final
    console.log(
      '🔍 DEBUG 5 - Response payload:',
      JSON.stringify(responsePayload, null, 2),
    );

    return right(responsePayload);
  }
}
