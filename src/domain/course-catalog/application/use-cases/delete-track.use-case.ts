// src/domain/course-catalog/application/use-cases/delete-track.use-case.ts

import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { ITrackRepository } from '../repositories/i-track-repository';
import { DeleteTrackRequest } from '../dtos/delete-track-request.dto';
import { DeleteTrackResponse } from '../dtos/delete-track-response.dto';
import { deleteTrackSchema } from './validations/delete-track.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { TrackNotFoundError } from './errors/track-not-found-error';
import { TrackHasDependenciesError } from './errors/track-has-dependencies-error';

@Injectable()
export class DeleteTrackUseCase {
  constructor(private readonly trackRepository: ITrackRepository) {}

  async execute(
    request: DeleteTrackRequest,
  ): Promise<
    Either<
      | InvalidInputError
      | TrackNotFoundError
      | TrackHasDependenciesError
      | RepositoryError,
      DeleteTrackResponse
    >
  > {
    try {
      // Validar input
      const validation = deleteTrackSchema.safeParse(request);
      if (!validation.success) {
        return left(
          new InvalidInputError('Invalid input data', validation.error.errors),
        );
      }

      // Buscar o track
      const trackResult = await this.trackRepository.findById(request.id);
      if (trackResult.isLeft()) {
        return left(new TrackNotFoundError());
      }

      // Verificar dependências
      const dependenciesResult =
        await this.trackRepository.checkTrackDependencies(request.id);
      if (dependenciesResult.isLeft()) {
        return left(new RepositoryError(dependenciesResult.value.message));
      }

      const dependencyInfo = dependenciesResult.value;
      if (!dependencyInfo.canDelete) {
        const courseNames = dependencyInfo.dependencies.map((d) => d.name);
        return left(new TrackHasDependenciesError(courseNames, dependencyInfo));
      }

      // Deletar o track
      const deleteResult = await this.trackRepository.delete(request.id);
      if (deleteResult.isLeft()) {
        return left(new RepositoryError(deleteResult.value.message));
      }

      return right({
        message: 'Track deleted successfully',
        deletedAt: new Date(),
      });
    } catch (error: any) {
      return left(
        new RepositoryError(
          error.message || 'Unexpected error during track deletion',
        ),
      );
    }
  }
}
