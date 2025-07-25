// src/domain/assessment/application/use-cases/update-assessment.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IAssessmentRepository } from '@/domain/assessment/application/repositories/i-assessment-repository';
import { ILessonRepository } from '@/domain/course-catalog/application/repositories/i-lesson-repository';
import { UpdateAssessmentRequest } from '@/domain/assessment/application/dtos/update-assessment-request.dto';
import { UpdateAssessmentResponse } from '@/domain/assessment/application/dtos/update-assessment-response.dto';
import { updateAssessmentSchema } from '@/domain/assessment/application/use-cases/validations/update-assessment.schema';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { LessonNotFoundError } from '@/domain/assessment/application/use-cases/errors/lesson-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import { textToSlug } from '@/core/utils/text-to-slug';
import { DuplicateAssessmentError } from './errors/duplicate-assessment-error';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { AssessmentProps } from '../../enterprise/entities/assessment.entity';

export type UpdateAssessmentUseCaseResponse = Either<
  | InvalidInputError
  | AssessmentNotFoundError
  | LessonNotFoundError
  | RepositoryError
  | DuplicateAssessmentError,
  UpdateAssessmentResponse
>;

@Injectable()
export class UpdateAssessmentUseCase {
  constructor(
    @Inject('AssessmentRepository')
    private readonly assessmentRepository: IAssessmentRepository,
    @Inject('LessonRepository')
    private readonly lessonRepository: ILessonRepository,
  ) {}

  async execute(
    request: UpdateAssessmentRequest,
  ): Promise<UpdateAssessmentUseCaseResponse> {
    try {
      const parseResult = updateAssessmentSchema.safeParse(request);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.issues.map((issue) => {
          return `${issue.path.join('.')}: ${issue.message}`;
        });
        return left(new InvalidInputError('Validation failed', errorMessages));
      }

      const { id, ...data } = parseResult.data;

      const existingAssessmentResult =
        await this.assessmentRepository.findById(id);

      if (existingAssessmentResult.isLeft()) {
        return left(new AssessmentNotFoundError());
      }

      const assessment = existingAssessmentResult.value;

      const updateProps: Partial<AssessmentProps> = {};

      // Title - sempre atualiza se fornecido
      if (data.title !== undefined) {
        const newTitle = data.title.trim();

        // Validar se o título não fica vazio após trim
        if (newTitle.length === 0) {
          return left(
            new InvalidInputError('Validation failed', [
              'title: Title cannot be empty',
            ]),
          );
        }

        const newSlug = textToSlug(newTitle);

        // Validar se o slug resultante é válido (mínimo 3 caracteres)
        if (!newSlug || newSlug.length < 3) {
          return left(
            new InvalidInputError('Validation failed', [
              'title: String must contain at least 3 character(s)',
            ]),
          );
        }

        const existingBySlug =
          await this.assessmentRepository.findByTitleExcludingId(newTitle, id);

        if (existingBySlug.isRight() && existingBySlug.value) {
          return left(new DuplicateAssessmentError());
        }

        updateProps.title = newTitle;
        updateProps.slug = newSlug;
      }

      // Description - trata null como remoção
      if (data.description !== undefined) {
        if (data.description === null) {
          updateProps.description = undefined;
        } else {
          updateProps.description = data.description;
        }
      }

      // Type - sempre atualiza se fornecido
      if (data.type !== undefined) {
        updateProps.type = data.type;
      }

      // QuizPosition - trata null como remoção
      if (data.quizPosition !== undefined) {
        if (data.quizPosition === null) {
          updateProps.quizPosition = undefined;
        } else {
          updateProps.quizPosition = data.quizPosition;
        }
      }

      // PassingScore - sempre atualiza se fornecido
      if (data.passingScore !== undefined) {
        updateProps.passingScore = data.passingScore;
      }

      // TimeLimitInMinutes - trata null como remoção
      if (data.timeLimitInMinutes !== undefined) {
        if (data.timeLimitInMinutes === null) {
          updateProps.timeLimitInMinutes = undefined;
        } else {
          updateProps.timeLimitInMinutes = data.timeLimitInMinutes;
        }
      }

      // RandomizeQuestions - sempre atualiza se fornecido
      if (data.randomizeQuestions !== undefined) {
        updateProps.randomizeQuestions = data.randomizeQuestions;
      }

      // RandomizeOptions - sempre atualiza se fornecido
      if (data.randomizeOptions !== undefined) {
        updateProps.randomizeOptions = data.randomizeOptions;
      }

      // LessonId - trata null como remoção
      if (data.lessonId !== undefined) {
        if (data.lessonId === null) {
          updateProps.lessonId = undefined;
        } else {
          // Validate lesson exists
          const lessonResult = await this.lessonRepository.findById(
            data.lessonId,
          );
          if (lessonResult.isLeft()) {
            return left(new LessonNotFoundError());
          }
          updateProps.lessonId = new UniqueEntityID(data.lessonId);
        }
      }

      // Lógica adicional: Se mudou o tipo, remover campos incompatíveis
      if (data.type !== undefined && data.type !== assessment.type) {
        // Se mudou para não-QUIZ, remover quizPosition
        if (data.type !== 'QUIZ') {
          updateProps.quizPosition = undefined;
        }

        // Se mudou para não-SIMULADO, remover timeLimitInMinutes
        if (data.type !== 'SIMULADO') {
          updateProps.timeLimitInMinutes = undefined;
        }
      }

      // Validar campos após processar todas as mudanças
      const finalType =
        updateProps.type !== undefined ? updateProps.type : assessment.type;

      // Get final quizPosition value after all updates
      const finalQuizPosition = updateProps.hasOwnProperty('quizPosition')
        ? updateProps.quizPosition
        : assessment.quizPosition;

      // QUIZ type requires quizPosition
      if (finalType === 'QUIZ' && !finalQuizPosition) {
        return left(
          new InvalidInputError('Validation failed', [
            'quizPosition: QUIZ type assessments require a quiz position',
          ]),
        );
      }

      // Non-QUIZ types cannot have quizPosition
      if (finalType !== 'QUIZ' && finalQuizPosition) {
        return left(
          new InvalidInputError('Validation failed', [
            'quizPosition: Quiz position can only be set for QUIZ type assessments',
          ]),
        );
      }

      // SIMULADO cannot have quizPosition (redundant but explicit)
      if (finalType === 'SIMULADO' && data.quizPosition) {
        return left(
          new InvalidInputError('Validation failed', [
            'quizPosition: SIMULADO type assessments cannot have quiz position',
          ]),
        );
      }

      // Validar timeLimitInMinutes apenas se está sendo definido (não null/undefined)
      if (
        data.timeLimitInMinutes !== undefined &&
        data.timeLimitInMinutes !== null &&
        finalType !== 'SIMULADO'
      ) {
        return left(
          new InvalidInputError('Validation failed', [
            'timeLimitInMinutes: Time limit can only be set for SIMULADO type assessments',
          ]),
        );
      }

      assessment.update(updateProps);

      await this.assessmentRepository.update(assessment);

      return right({ assessment });
    } catch (err: any) {
      // Check if it's a validation error from our code
      if (err instanceof InvalidInputError) {
        return left(err);
      }
      // Check if it's a specific error we should handle differently
      if (err instanceof Error) {
        return left(new RepositoryError(err.message));
      }
      return left(new RepositoryError('An unexpected error occurred'));
    }
  }
}
