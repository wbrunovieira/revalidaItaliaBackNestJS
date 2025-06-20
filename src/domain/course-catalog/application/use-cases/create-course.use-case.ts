// src/domain/course-catalog/application/use-cases/create-course.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { Course } from '@/domain/course-catalog/enterprise/entities/course.entity';
import { SlugVO } from '@/domain/course-catalog/enterprise/value-objects/slug.vo';
import { ICourseRepository } from '../repositories/i-course-repository';
import { CreateCourseRequest } from '../dtos/create-course-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { DuplicateCourseError } from './errors/duplicate-course-error';
import {
  CreateCourseSchema,
  createCourseSchema,
} from './validations/create-course.schema';

type CreateCourseUseCaseResponse = Either<
  InvalidInputError | DuplicateCourseError | RepositoryError | Error,
  {
    course: {
      id: string;
      slug: string;
      imageUrl?: string;
      title: string;
      description: string;
    };
  }
>;

@Injectable()
export class CreateCourseUseCase {
  constructor(
    @Inject('CourseRepository')
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(
    request: CreateCourseRequest,
  ): Promise<CreateCourseUseCaseResponse> {
    const parseResult = createCourseSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => {
        const detail: any = {
          code: issue.code,
          message: issue.message,
          path: issue.path,
        };
        if (issue.code === 'invalid_type') {
          detail.expected = 'string|number';
          detail.received = (issue as any).received;
        } else if ('expected' in issue) {
          detail.expected = (issue as any).expected;
        }
        if ('received' in issue && issue.code !== 'invalid_type') {
          detail.received = (issue as any).received;
        }
        if ('minimum' in issue) detail.minimum = (issue as any).minimum;
        return detail;
      });
      return left(new InvalidInputError('Validation failed', details));
    }

    const data: CreateCourseSchema = parseResult.data;

    try {
      const ptTranslation = data.translations.find((t) => t.locale === 'pt')!;
      const existing = await this.courseRepository.findByTitle(
        ptTranslation.title,
      );
      if (existing.isRight()) {
        return left(new DuplicateCourseError());
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

    // ✅ CORREÇÃO: Incluir imageUrl na criação do Course
    const course = Course.create({
      slug: slugVo.get(),
      imageUrl: data.imageUrl, // ← Esta linha estava faltando
      translations: data.translations,
    });

    try {
      const createdOrError = await this.courseRepository.create(course);
      if (createdOrError.isLeft()) {
        return left(new RepositoryError(createdOrError.value.message));
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    const responsePayload = {
      course: {
        id: course.id.toString(),
        slug: course.slug,
        imageUrl: course.imageUrl, // ← Agora vai retornar o imageUrl corretamente
        title: course.title,
        description: course.description,
      },
    };

    return right(responsePayload);
  }
}
