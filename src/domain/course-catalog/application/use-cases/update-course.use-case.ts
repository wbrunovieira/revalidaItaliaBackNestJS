// ═══════════════════════════════════════════════════════════════════
// src/domain/course-catalog/application/use-cases/update-course.use-case.ts
// ═══════════════════════════════════════════════════════════════════

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { Course } from '@/domain/course-catalog/enterprise/entities/course.entity';
import { SlugVO } from '@/domain/course-catalog/enterprise/value-objects/slug.vo';
import { ICourseRepository } from '../repositories/i-course-repository';
import { UpdateCourseRequest } from '../dtos/update-course-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { CourseNotFoundError } from './errors/course-not-found-error';
import { DuplicateCourseError } from './errors/duplicate-course-error';
import { CourseNotModifiedError } from './errors/course-not-modified-error';
import {
  UpdateCourseSchema,
  updateCourseSchema,
} from './validations/update-course.schema';

type UpdateCourseUseCaseResponse = Either<
  | InvalidInputError
  | CourseNotFoundError
  | DuplicateCourseError
  | CourseNotModifiedError
  | RepositoryError
  | Error,
  {
    course: {
      id: string;
      slug: string;
      imageUrl?: string;
      title: string;
      description: string;
      updatedAt: Date;
    };
  }
>;

@Injectable()
export class UpdateCourseUseCase {
  constructor(
    @Inject('CourseRepository')
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(
    request: UpdateCourseRequest,
  ): Promise<UpdateCourseUseCaseResponse> {
    // Validação de entrada
    const parseResult = updateCourseSchema.safeParse(request);
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
        if ('minimum' in issue) detail.minimum = (issue as any).minimum;
        return detail;
      });
      return left(new InvalidInputError('Validation failed', details));
    }

    const data: UpdateCourseSchema = parseResult.data;

    try {
      // Verificar se o curso existe
      const existingCourseResult = await this.courseRepository.findById(
        data.id,
      );

      if (existingCourseResult.isLeft()) {
        return left(new CourseNotFoundError());
      }

      const existingCourse = existingCourseResult.value;

      // Verificar se há mudanças reais
      const hasChanges = this.detectChanges(existingCourse, data);
      if (!hasChanges) {
        return left(new CourseNotModifiedError());
      }

      // Verificar duplicatas apenas se os campos relevantes mudaram
      if (data.slug !== undefined && data.slug !== existingCourse.slug) {
        const slugExistsResult =
          await this.courseRepository.findBySlugExcludingId(data.slug, data.id);
        if (slugExistsResult.isRight()) {
          return left(new DuplicateCourseError());
        }
      }

      if (data.translations) {
        const ptTranslation = data.translations.find((t) => t.locale === 'pt');
        if (ptTranslation && ptTranslation.title !== existingCourse.title) {
          const titleExistsResult =
            await this.courseRepository.findByTitleExcludingId(
              ptTranslation.title,
              data.id,
            );
          if (titleExistsResult.isRight()) {
            return left(new DuplicateCourseError());
          }
        }
      }

      // Criar nova instância do curso com as atualizações
      const updatedCourse = this.applyUpdates(existingCourse, data);

      // Salvar as alterações
      const updateResult = await this.courseRepository.update(updatedCourse);
      if (updateResult.isLeft()) {
        return left(new RepositoryError(updateResult.value.message));
      }

      return right({
        course: {
          id: updatedCourse.id.toString(),
          slug: updatedCourse.slug,
          imageUrl: updatedCourse.imageUrl,
          title: updatedCourse.title,
          description: updatedCourse.description,
          updatedAt: updatedCourse.updatedAt,
        },
      });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }

  private detectChanges(
    existingCourse: Course,
    updates: UpdateCourseSchema,
  ): boolean {
    // Verificar mudanças no slug
    if (updates.slug !== undefined && updates.slug !== existingCourse.slug) {
      return true;
    }

    // Verificar mudanças na imageUrl (incluindo undefined e string vazia)
    // Precisamos verificar se imageUrl foi fornecido no request, mesmo que seja undefined
    if ('imageUrl' in updates && updates.imageUrl !== existingCourse.imageUrl) {
      return true;
    }

    // Verificar mudanças nas traduções
    if (updates.translations) {
      const existingTranslations = existingCourse.translations;

      // Verificar se o número de traduções mudou
      if (updates.translations.length !== existingTranslations.length) {
        return true;
      }

      // Verificar se alguma tradução mudou
      for (const updateTranslation of updates.translations) {
        const existingTranslation = existingTranslations.find(
          (t) => t.locale === updateTranslation.locale,
        );

        if (
          !existingTranslation ||
          existingTranslation.title !== updateTranslation.title ||
          existingTranslation.description !== updateTranslation.description
        ) {
          return true;
        }
      }
    }

    return false;
  }

  private applyUpdates(
    existingCourse: Course,
    updates: UpdateCourseSchema,
  ): Course {
    // Preparar dados para reconstrução
    const newProps = {
      slug: updates.slug !== undefined ? updates.slug : existingCourse.slug,
      imageUrl:
        'imageUrl' in updates ? updates.imageUrl : existingCourse.imageUrl,
      translations: updates.translations || existingCourse.translations,
      createdAt: existingCourse.createdAt,
      updatedAt: new Date(), // Sempre atualiza o timestamp
    };

    // Normalizar slug se foi fornecido
    if (updates.slug !== undefined) {
      try {
        const slugVo = SlugVO.create(updates.slug);
        newProps.slug = slugVo.get();
      } catch (err: any) {
        // Se chegou até aqui, a validação do schema já passou, então não deveria dar erro
        newProps.slug = updates.slug.toLowerCase().replace(/\s+/g, '-');
      }
    }

    // Reconstruir o curso com os novos dados
    return Course.reconstruct(newProps, existingCourse.id);
  }
}
