// src/test/repositories/in-memory-lesson-repository.ts
import { Either, left, right } from '@/core/either';
import {
  ILessonRepository,
  PaginatedLessonsResult,
} from '@/domain/course-catalog/application/repositories/i-lesson-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import {
  LessonDependencyInfo,
  LessonDependency,
} from '@/domain/course-catalog/application/dtos/lesson-dependencies.dto';
import { UniqueEntityID } from '@/core/unique-entity-id';

interface StoredLesson {
  lesson: Lesson;
  // Simulação de dependências para testes
  video?: any;
  documents?: any[];
  flashcards?: any[];
  assessments?: any[];
  comments?: any[];
}

export class InMemoryLessonRepository implements ILessonRepository {
  private byId = new Map<string, StoredLesson>();
  private bySlug = new Map<string, StoredLesson>();
  private byModule = new Map<string, Lesson[]>();

  async create(lesson: Lesson): Promise<Either<Error, undefined>> {
    const storedLesson = { lesson };
    this.byId.set(lesson.id.toString(), storedLesson);
    this.bySlug.set(lesson.slug, storedLesson);

    // Store multiple lessons per module
    const existingLessons = this.byModule.get(lesson.moduleId) || [];
    existingLessons.push(lesson);
    this.byModule.set(lesson.moduleId, existingLessons);

    return right(undefined);
  }

  async findById(id: string): Promise<Either<Error, Lesson>> {
    const stored = this.byId.get(id);
    if (!stored) return left(new Error('Lesson not found'));
    return right(stored.lesson);
  }

  async findBySlug(slug: string): Promise<Either<Error, Lesson>> {
    const stored = this.bySlug.get(slug);
    if (!stored) return left(new Error('Lesson not found'));
    return right(stored.lesson);
  }

  async findByModuleId(
    moduleId: string,
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedLessonsResult>> {
    const allLessons = this.byModule.get(moduleId) || [];
    const total = allLessons.length;

    // Apply pagination
    const lessons = allLessons.slice(offset, offset + limit);

    return right({ lessons, total });
  }

  async checkLessonDependencies(
    lessonId: string,
  ): Promise<Either<Error, LessonDependencyInfo>> {
    try {
      const stored = this.byId.get(lessonId);

      if (!stored) {
        return left(new Error('Lesson not found'));
      }

      const video = stored.video;
      const documents = stored.documents || [];
      const flashcards = stored.flashcards || [];
      const assessments = stored.assessments || [];
      const comments = stored.comments || [];

      const dependencies: LessonDependency[] = [];

      // Adicionar vídeo como dependência (relação one-to-one)
      if (video) {
        dependencies.push({
          type: 'video',
          id: video.id || new UniqueEntityID().toString(),
          name: video.title || `Video ${video.id}`,
          relatedEntities: {
            translations: video.translations?.length || 0,
          },
        });
      }

      // Adicionar documentos como dependências
      documents.forEach((doc) => {
        dependencies.push({
          type: 'document',
          id: doc.id || new UniqueEntityID().toString(),
          name: doc.filename || `Document ${doc.id}`,
          relatedEntities: {
            translations: doc.translations?.length || 0,
          },
        });
      });

      // Adicionar flashcards como dependências
      flashcards.forEach((flashcard) => {
        dependencies.push({
          type: 'flashcard',
          id: flashcard.id || new UniqueEntityID().toString(),
          name: flashcard.title || `Flashcard ${flashcard.id}`,
        });
      });

      // Adicionar assessments como dependências
      assessments.forEach((assessment) => {
        dependencies.push({
          type: 'assessment',
          id: assessment.id || new UniqueEntityID().toString(),
          name: assessment.title || `Assessment ${assessment.id}`,
        });
      });

      // Adicionar comentários como dependências
      comments.forEach((comment) => {
        dependencies.push({
          type: 'comment',
          id: comment.id || new UniqueEntityID().toString(),
          name: comment.author || `Comment ${comment.id}`,
        });
      });

      const canDelete = dependencies.length === 0;

      return right({
        canDelete,
        totalDependencies: dependencies.length,
        summary: {
          videos: video ? 1 : 0,
          documents: documents.length,
          flashcards: flashcards.length,
          assessments: assessments.length,
          comments: comments.length,
        },
        dependencies,
      });
    } catch (err: any) {
      return left(new Error(err.message));
    }
  }

  async delete(lessonId: string): Promise<Either<Error, void>> {
    try {
      const stored = this.byId.get(lessonId);
      if (!stored) {
        return left(new Error('Lesson not found'));
      }

      const lesson = stored.lesson;

      // Remove from byId map
      this.byId.delete(lessonId);

      // Remove from bySlug map
      this.bySlug.delete(lesson.slug);

      // Remove from byModule map
      const moduleLessons = this.byModule.get(lesson.moduleId) || [];
      const filteredLessons = moduleLessons.filter(
        (l) => l.id.toString() !== lessonId,
      );

      if (filteredLessons.length > 0) {
        this.byModule.set(lesson.moduleId, filteredLessons);
      } else {
        this.byModule.delete(lesson.moduleId);
      }

      return right(undefined);
    } catch (err: any) {
      return left(new Error(err.message));
    }
  }

  // Método auxiliar para testes - adicionar dependências simuladas
  public addDependenciesToLesson(
    lessonId: string,
    dependencies: {
      video?: any;
      documents?: any[];
      flashcards?: any[];
      assessments?: any[];
      comments?: any[];
    },
  ): void {
    const stored = this.byId.get(lessonId);
    if (stored) {
      if (dependencies.video) {
        stored.video = dependencies.video;
      }
      if (dependencies.documents) {
        stored.documents = dependencies.documents;
      }
      if (dependencies.flashcards) {
        stored.flashcards = dependencies.flashcards;
      }
      if (dependencies.assessments) {
        stored.assessments = dependencies.assessments;
      }
      if (dependencies.comments) {
        stored.comments = dependencies.comments;
      }
    }
  }

  async update(lesson: Lesson): Promise<Either<Error, undefined>> {
    try {
      const stored = this.byId.get(lesson.id.toString());
      if (!stored) {
        return left(new Error('Lesson not found'));
      }

      // Update the lesson in byId map
      stored.lesson = lesson;

      // Update in bySlug map
      this.bySlug.set(lesson.slug, stored);

      // Update in byModule map
      const moduleLessons = this.byModule.get(lesson.moduleId) || [];
      const lessonIndex = moduleLessons.findIndex(
        (l) => l.id.toString() === lesson.id.toString(),
      );

      if (lessonIndex >= 0) {
        moduleLessons[lessonIndex] = lesson;
        this.byModule.set(lesson.moduleId, moduleLessons);
      }

      return right(undefined);
    } catch (err: any) {
      return left(new Error(err.message));
    }
  }

  async findByModuleIdAndOrder(
    moduleId: string,
    order: number,
  ): Promise<Either<Error, Lesson | null>> {
    try {
      const moduleLessons = this.byModule.get(moduleId) || [];
      const lesson = moduleLessons.find((l) => l.order === order);
      return right(lesson || null);
    } catch (err: any) {
      return left(new Error(err.message));
    }
  }
}
