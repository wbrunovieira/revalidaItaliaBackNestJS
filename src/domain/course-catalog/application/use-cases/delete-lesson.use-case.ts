// src/domain/course-catalog/application/use-cases/delete-lesson.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { ILessonRepository } from '../repositories/i-lesson-repository';
import { DeleteLessonRequest } from '../dtos/delete-lesson-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { LessonHasDependenciesError } from './errors/lesson-has-dependencies-error';
import { LessonDependencyInfo } from '../dtos/lesson-dependencies.dto';
import {
  DeleteLessonSchema,
  deleteLessonSchema,
} from './validations/delete-lesson.schema';

type DeleteLessonUseCaseResponse = Either<
  | InvalidInputError
  | LessonNotFoundError
  | LessonHasDependenciesError
  | RepositoryError
  | Error,
  {
    message: string;
    deletedAt: Date;
  }
>;

@Injectable()
export class DeleteLessonUseCase {
  constructor(
    @Inject('LessonRepository')
    private readonly lessonRepository: ILessonRepository,
  ) {}

  async execute(
    request: DeleteLessonRequest,
  ): Promise<DeleteLessonUseCaseResponse> {
    // Validação de entrada
    const parseResult = deleteLessonSchema.safeParse(request);
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

    const data: DeleteLessonSchema = parseResult.data;

    try {
      // Verificar se a lição existe
      const existingLessonResult = await this.lessonRepository.findById(
        data.id,
      );

      if (existingLessonResult.isLeft()) {
        return left(new LessonNotFoundError());
      }

      // Verificar dependências com informações detalhadas
      const dependenciesResult =
        await this.lessonRepository.checkLessonDependencies(data.id);

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
        const error = new LessonHasDependenciesError(
          dependencyNames,
          dependencyInfo,
        );
        (error as any).dependencyInfo = dependencyInfo; // Adicionar info extra

        return left(error);
      }

      // Deletar a lição
      const deleteResult = await this.lessonRepository.delete(data.id);

      if (deleteResult.isLeft()) {
        return left(new RepositoryError(deleteResult.value.message));
      }

      return right({
        message: 'Lesson deleted successfully',
        deletedAt: new Date(),
      });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}
