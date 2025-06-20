// src/domain/course-catalog/application/use-cases/list-courses.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { ICourseRepository } from '../repositories/i-course-repository';

export type ListCoursesUseCaseResponse = Either<
  Error,
  {
    courses: Array<{
      id: string;
      slug: string;
      imageUrl?: string;
      title: string;
      description: string;
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
        return left(result.value);
      }
      const entities = result.value;
      const dto = entities.map((course) => ({
        id: course.id.toString(),
        slug: course.slug,
        imageUrl: course.imageUrl,
        title: course.title,
        description: course.description,
      }));
      return right({ courses: dto });
    } catch (err: any) {
      return left(err);
    }
  }
}
