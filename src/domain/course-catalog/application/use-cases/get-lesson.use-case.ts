// src/domain/course-catalog/application/use-cases/get-lesson.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { ILessonRepository } from '../repositories/i-lesson-repository';

import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { GetLessonRequest } from '../dtos/get-lesson-request.dto';
import {
  GetLessonSchema,
  getLessonSchema,
} from './validations/get-lesson.schema';

type GetLessonUseCaseResponse = Either<
  InvalidInputError | LessonNotFoundError | RepositoryError | Error,
  {
    id: string;
    moduleId: string;
    videoId?: string;
    imageUrl?: string;
    flashcardIds: string[];
    quizIds: string[];
    commentIds: string[];
    translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description?: string;
    }>;
    video?: {
      id: string;
      slug: string;
      imageUrl?: string;
      providerVideoId: string; // ID do Panda Video
      durationInSeconds: number;
      isSeen: boolean;
      translations: Array<{
        locale: 'pt' | 'it' | 'es';
        title: string;
        description?: string;
      }>;
      createdAt: Date;
      updatedAt: Date;
    };
    createdAt: Date;
    updatedAt: Date;
  }
>;

@Injectable()
export class GetLessonUseCase {
  constructor(
    @Inject('LessonRepository')
    private readonly lessonRepository: ILessonRepository,
  ) {}

  async execute(request: GetLessonRequest): Promise<GetLessonUseCaseResponse> {
    const parseResult = getLessonSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }

    const data: GetLessonSchema = parseResult.data;
    const lessonId = data.id;

    try {
      const found = await this.lessonRepository.findById(lessonId);
      if (found.isLeft()) {
        return left(new LessonNotFoundError());
      }
      const lessonEntity = found.value as Lesson;

      // Usar o método toResponseObject() da entidade para manter consistência
      return right(lessonEntity.toResponseObject());
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}
