// src/domain/course-catalog/application/use-cases/list-courses.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { RepositoryError } from './errors/repository-error';
import { ICourseRepository } from '../repositories/i-course-repository';

export type ListCoursesUseCaseResponse = Either<
  RepositoryError,
  {
    courses: Array<{
      id: string;
      slug: string;
      imageUrl?: string;
      translations: {
        locale: 'pt' | 'it' | 'es';
        title: string;
        description: string;
      }[];
    }>;
  }
>;

@Injectable()
export class ListCoursesUseCase {
  constructor(
    @Inject('CourseRepository')
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(): Promise<ListCoursesUseCaseResponse> {
    try {
      const result = await this.courseRepository.findAll();
      if (result.isLeft()) {
        return left(new RepositoryError(result.value.message));
      }

      const courses = result.value.map((course) => ({
        id: course.id.toString(),
        slug: course.slug,
        imageUrl: course.imageUrl ? course.imageUrl.toString() : undefined,
        translations: course.translations.map((tr) => ({
          locale: tr.locale,
          title: tr.title,
          description: tr.description,
        })),
      }));

      return right({ courses });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}
