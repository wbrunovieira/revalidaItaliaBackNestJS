// src/domain/course-catalog/application/use-cases/delete-video.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IVideoRepository } from '../repositories/i-video-repository';
import { DeleteVideoRequest } from '../dtos/delete-video-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { VideoNotFoundError } from './errors/video-not-found-error';
import { VideoHasDependenciesError } from './errors/video-has-dependencies-error';
import { VideoDependencyInfo } from '../dtos/video-dependencies.dto';
import {
  DeleteVideoSchema,
  deleteVideoSchema,
} from './validations/delete-video.schema';

type DeleteVideoUseCaseResponse = Either<
  | InvalidInputError
  | VideoNotFoundError
  | VideoHasDependenciesError
  | RepositoryError
  | Error,
  {
    message: string;
    deletedAt: Date;
  }
>;

@Injectable()
export class DeleteVideoUseCase {
  constructor(
    @Inject('VideoRepository')
    private readonly videoRepository: IVideoRepository,
  ) {}

  async execute(
    request: DeleteVideoRequest,
  ): Promise<DeleteVideoUseCaseResponse> {
    // Validação de entrada
    const parseResult = deleteVideoSchema.safeParse(request);
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

    const data: DeleteVideoSchema = parseResult.data;

    try {
      // Verificar se o vídeo existe
      const existingVideoResult = await this.videoRepository.findById(data.id);

      if (existingVideoResult.isLeft()) {
        return left(new VideoNotFoundError());
      }

      // Verificar dependências com informações detalhadas
      const dependenciesResult =
        await this.videoRepository.checkVideoDependencies(data.id);

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
        const error = new VideoHasDependenciesError(
          dependencyNames,
          dependencyInfo,
        );
        (error as any).dependencyInfo = dependencyInfo; // Adicionar info extra

        return left(error);
      }

      // Deletar o vídeo
      const deleteResult = await this.videoRepository.delete(data.id);

      if (deleteResult.isLeft()) {
        return left(new RepositoryError(deleteResult.value.message));
      }

      return right({
        message: 'Video deleted successfully',
        deletedAt: new Date(),
      });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}
