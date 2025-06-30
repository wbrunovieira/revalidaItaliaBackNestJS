import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { ICourseRepository } from '../repositories/i-course-repository';
import { DeleteCourseRequest } from '../dtos/delete-course-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { CourseNotFoundError } from './errors/course-not-found-error';
import { CourseHasDependenciesError } from './errors/course-has-dependencies-error';
import { CourseDependencyInfo } from '../dtos/course-dependencies.dto';
import {
  DeleteCourseSchema,
  deleteCourseSchema,
} from './validations/delete-course.schema';

type DeleteCourseUseCaseResponse = Either<
  | InvalidInputError
  | CourseNotFoundError
  | CourseHasDependenciesError
  | RepositoryError
  | Error,
  {
    message: string;
    deletedAt: Date;
  }
>;

@Injectable()
export class DeleteCourseUseCase {
  constructor(
    @Inject('CourseRepository')
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(
    request: DeleteCourseRequest,
  ): Promise<DeleteCourseUseCaseResponse> {
    // Validação de entrada
    const parseResult = deleteCourseSchema.safeParse(request);
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

    const data: DeleteCourseSchema = parseResult.data;

    try {
      // Verificar se o curso existe
      const existingCourseResult = await this.courseRepository.findById(
        data.id,
      );

      if (existingCourseResult.isLeft()) {
        return left(new CourseNotFoundError());
      }

      // Verificar dependências com informações detalhadas
      const dependenciesResult =
        await this.courseRepository.checkCourseDependencies(data.id);

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
        const error = new CourseHasDependenciesError(
          dependencyNames,
          dependencyInfo,
        );
        (error as any).dependencyInfo = dependencyInfo; // Adicionar info extra

        return left(error);
      }

      // Deletar o curso
      const deleteResult = await this.courseRepository.delete(data.id);

      if (deleteResult.isLeft()) {
        return left(new RepositoryError(deleteResult.value.message));
      }

      return right({
        message: 'Course deleted successfully',
        deletedAt: new Date(),
      });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}
