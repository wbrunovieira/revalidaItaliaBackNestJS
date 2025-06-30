// src/domain/course-catalog/application/use-cases/update-track.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { ITrackRepository } from '../repositories/i-track-repository';
import { UpdateTrackRequest } from '../dtos/update-track-request.dto';
import { UpdateTrackResponse } from '../dtos/update-track-response.dto';
import { updateTrackSchema } from './validations/update-track.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { TrackNotFoundError } from './errors/track-not-found-error';
import { DuplicateTrackError } from './errors/duplicate-track-error';
import { SlugVO } from '@/domain/course-catalog/enterprise/value-objects/slug.vo';
import { TrackTranslationVO } from '@/domain/course-catalog/enterprise/value-objects/track-translation.vo';
import { Track } from '@/domain/course-catalog/enterprise/entities/track.entity'; // Adicionar este import

@Injectable()
export class UpdateTrackUseCase {
  constructor(
    @Inject('TrackRepository')
    private readonly trackRepository: ITrackRepository,
  ) {}

  async execute(
    request: UpdateTrackRequest,
  ): Promise<
    Either<
      | InvalidInputError
      | TrackNotFoundError
      | DuplicateTrackError
      | RepositoryError,
      UpdateTrackResponse
    >
  > {
    try {
      // Validar input
      const validation = updateTrackSchema.safeParse(request);
      if (!validation.success) {
        return left(
          new InvalidInputError('Invalid input data', validation.error.errors),
        );
      }

      // Buscar o track existente
      const trackResult = await this.trackRepository.findById(request.id);
      if (trackResult.isLeft()) {
        return left(new TrackNotFoundError());
      }

      const existingTrack = trackResult.value;

      // Verificar se slug já existe (se foi alterado)
      if (request.slug && request.slug !== existingTrack.slug) {
        const slugExists = await this.trackRepository.findBySlug(request.slug);
        if (slugExists.isRight()) {
          return left(new DuplicateTrackError());
        }
      }

      // Validar slug se fornecido
      let slugVo: SlugVO;
      if (request.slug) {
        try {
          slugVo = SlugVO.create(request.slug);
        } catch (err: any) {
          return left(
            new InvalidInputError('Invalid slug', [
              { message: err.message, path: ['slug'] },
            ]),
          );
        }
      }

      // Preparar dados para atualização
      const updatedProps = {
        slug: request.slug ? slugVo!.get() : existingTrack.slug,
        imageUrl:
          request.imageUrl !== undefined
            ? request.imageUrl
            : existingTrack.imageUrl,
        courseIds:
          request.courseIds !== undefined
            ? request.courseIds
            : existingTrack.courseIds,
        translations: request.translations
          ? request.translations.map(
              (t) =>
                new TrackTranslationVO(
                  t.locale as 'pt' | 'it' | 'es', // Type assertion para resolver o erro
                  t.title,
                  t.description,
                ),
            )
          : existingTrack.translations,
        createdAt: existingTrack.createdAt,
        updatedAt: new Date(),
      };

      // Reconstituir o track com os novos dados - CORRIGIDO
      const updatedTrack = Track.reconstruct(updatedProps, existingTrack.id);

      // Atualizar no repositório
      const updateResult = await this.trackRepository.update(updatedTrack);
      if (updateResult.isLeft()) {
        return left(new RepositoryError(updateResult.value.message));
      }

      return right({
        track: {
          id: updatedTrack.id.toString(),
          slug: updatedTrack.slug,
          imageUrl: updatedTrack.imageUrl,
          courseIds: updatedTrack.courseIds,
          title: updatedTrack.title,
          description: updatedTrack.description,
          updatedAt: updatedTrack.updatedAt,
        },
      });
    } catch (error: any) {
      return left(
        new RepositoryError(
          error.message || 'Unexpected error during track update',
        ),
      );
    }
  }
}
