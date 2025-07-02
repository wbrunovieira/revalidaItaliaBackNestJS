// src/domain/course-catalog/application/use-cases/delete-lesson.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeleteLessonUseCase } from '@/domain/course-catalog/application/use-cases/delete-lesson.use-case';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { DeleteLessonRequest } from '@/domain/course-catalog/application/dtos/delete-lesson-request.dto';
import { LessonNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/lesson-not-found-error';
import { LessonHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/lesson-has-dependencies-error';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left, right } from '@/core/either';
import { LessonDependencyInfo } from '@/domain/course-catalog/application/dtos/lesson-dependencies.dto';

let repo: InMemoryLessonRepository;
let sut: DeleteLessonUseCase;

describe('DeleteLessonUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryLessonRepository();
    sut = new DeleteLessonUseCase(repo);
  });

  function createValidLesson(id?: string, moduleId?: string): Lesson {
    const lessonId = id || new UniqueEntityID().toString();
    const modId = moduleId || new UniqueEntityID().toString();

    return Lesson.create(
      {
        moduleId: modId,
        translations: [
          {
            locale: 'pt',
            title: 'Lição de Teste',
            description: 'Descrição da lição de teste',
          },
          {
            locale: 'it',
            title: 'Lezione di Test',
            description: 'Descrizione della lezione di test',
          },
          {
            locale: 'es',
            title: 'Lección de Prueba',
            description: 'Descripción de la lección de prueba',
          },
        ],
        flashcardIds: [],
        quizIds: [],
        commentIds: [],
        imageUrl: 'https://example.com/lesson.jpg',
      },
      new UniqueEntityID(lessonId),
    );
  }

  function validDeleteRequest(id?: string): DeleteLessonRequest {
    return {
      id: id || new UniqueEntityID().toString(),
    };
  }

  describe('Successful deletion', () => {
    it('deletes a lesson successfully when it exists and has no dependencies', async () => {
      const lesson = createValidLesson();
      await repo.create(lesson);

      const request = validDeleteRequest(lesson.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Lesson deleted successfully');
        expect(result.value.deletedAt).toBeInstanceOf(Date);

        // Verify lesson was actually deleted
        const findResult = await repo.findById(lesson.id.toString());
        expect(findResult.isLeft()).toBe(true);
      }
    });

    it('returns success message with current timestamp', async () => {
      const lesson = createValidLesson();
      await repo.create(lesson);

      const beforeDeletion = new Date();
      const request = validDeleteRequest(lesson.id.toString());
      const result = await sut.execute(request);
      const afterDeletion = new Date();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.deletedAt.getTime()).toBeGreaterThanOrEqual(
          beforeDeletion.getTime(),
        );
        expect(result.value.deletedAt.getTime()).toBeLessThanOrEqual(
          afterDeletion.getTime(),
        );
      }
    });
  });

  describe('Validation errors', () => {
    it('rejects empty lesson ID', async () => {
      const request: any = { id: '' };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Lesson ID is required',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('rejects missing lesson ID', async () => {
      const request: any = {};
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Lesson ID is required',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('rejects invalid UUID format', async () => {
      const request: any = { id: 'invalid-uuid' };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Lesson ID must be a valid UUID',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('rejects non-string lesson ID', async () => {
      const request: any = { id: 123 };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'invalid_type',
              expected: 'string',
              received: 'number',
              path: ['id'],
            }),
          ]),
        );
      }
    });

    it('rejects null lesson ID', async () => {
      const request: any = { id: null };
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as InvalidInputError;
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'invalid_type',
              expected: 'string',
              received: 'null',
              path: ['id'],
            }),
          ]),
        );
      }
    });
  });

  describe('Lesson not found errors', () => {
    it('returns LessonNotFoundError when lesson does not exist', async () => {
      const nonExistentId = new UniqueEntityID().toString();
      const request = validDeleteRequest(nonExistentId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as LessonNotFoundError;
        expect(error).toBeInstanceOf(LessonNotFoundError);
        expect(error.message).toBe('Lesson not found');
      }
    });

    it('handles repository error when finding lesson', async () => {
      const lessonId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      const request = validDeleteRequest(lessonId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Database connection failed');
      }
    });

    it('handles Left result from repository.findById', async () => {
      const lessonId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockResolvedValueOnce(
        left(new Error('Lesson lookup failed')),
      );

      const request = validDeleteRequest(lessonId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as LessonNotFoundError;
        expect(error).toBeInstanceOf(LessonNotFoundError);
        expect(error.message).toBe('Lesson not found');
      }
    });
  });

  describe('Lesson dependencies errors', () => {
    it('returns LessonHasDependenciesError when lesson has videos', async () => {
      const lesson = createValidLesson();
      await repo.create(lesson);

      // Adicionar vídeos como dependências
      repo.addDependenciesToLesson(lesson.id.toString(), {
        videos: [
          {
            id: '1',
            title: 'Introduction Video',
            translations: [{ locale: 'pt' }, { locale: 'it' }],
          },
          {
            id: '2',
            title: 'Tutorial Video',
            translations: [{ locale: 'pt' }],
          },
        ],
      });

      const request = validDeleteRequest(lesson.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as LessonHasDependenciesError;
        expect(error).toBeInstanceOf(LessonHasDependenciesError);
        expect(error.message).toContain(
          'Cannot delete lesson because it has dependencies',
        );
        expect(error.message).toContain('Introduction Video');
        expect(error.message).toContain('Tutorial Video');
      }
    });

    it('returns LessonHasDependenciesError when lesson has documents', async () => {
      const lesson = createValidLesson();
      await repo.create(lesson);

      repo.addDependenciesToLesson(lesson.id.toString(), {
        documents: [
          {
            id: '1',
            filename: 'lesson-guide.pdf',
            translations: [{ locale: 'pt' }],
          },
          { id: '2', filename: 'exercises.docx', translations: [] },
        ],
      });

      const request = validDeleteRequest(lesson.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as LessonHasDependenciesError;
        expect(error).toBeInstanceOf(LessonHasDependenciesError);
        expect(error.message).toContain('lesson-guide.pdf');
        expect(error.message).toContain('exercises.docx');
      }
    });

    it('returns LessonHasDependenciesError when lesson has flashcards', async () => {
      const lesson = createValidLesson();
      await repo.create(lesson);

      repo.addDependenciesToLesson(lesson.id.toString(), {
        flashcards: [
          { id: '1', title: 'Flashcard Set 1' },
          { id: '2', title: 'Flashcard Set 2' },
        ],
      });

      const request = validDeleteRequest(lesson.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as LessonHasDependenciesError;
        expect(error).toBeInstanceOf(LessonHasDependenciesError);
        expect(error.message).toContain('Flashcard Set 1');
        expect(error.message).toContain('Flashcard Set 2');
      }
    });

    it('returns LessonHasDependenciesError when lesson has quizzes', async () => {
      const lesson = createValidLesson();
      await repo.create(lesson);

      repo.addDependenciesToLesson(lesson.id.toString(), {
        quizzes: [
          { id: '1', title: 'Quiz 1: Basic Concepts' },
          { id: '2', title: 'Quiz 2: Advanced Topics' },
        ],
      });

      const request = validDeleteRequest(lesson.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as LessonHasDependenciesError;
        expect(error).toBeInstanceOf(LessonHasDependenciesError);
        expect(error.message).toContain('Quiz 1: Basic Concepts');
        expect(error.message).toContain('Quiz 2: Advanced Topics');
      }
    });

    it('returns LessonHasDependenciesError when lesson has comments', async () => {
      const lesson = createValidLesson();
      await repo.create(lesson);

      repo.addDependenciesToLesson(lesson.id.toString(), {
        comments: [
          { id: '1', author: 'John Doe' },
          { id: '2', author: 'Jane Smith' },
        ],
      });

      const request = validDeleteRequest(lesson.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as LessonHasDependenciesError;
        expect(error).toBeInstanceOf(LessonHasDependenciesError);
        expect(error.message).toContain('John Doe');
        expect(error.message).toContain('Jane Smith');
      }
    });

    it('returns LessonHasDependenciesError when lesson has multiple types of dependencies', async () => {
      const lesson = createValidLesson();
      await repo.create(lesson);

      repo.addDependenciesToLesson(lesson.id.toString(), {
        videos: [{ id: '1', title: 'Main Video' }],
        documents: [{ id: '2', filename: 'notes.pdf' }],
        flashcards: [{ id: '3', title: 'Vocabulary Cards' }],
        quizzes: [{ id: '4', title: 'Final Quiz' }],
        comments: [{ id: '5', author: 'Student A' }],
      });

      const request = validDeleteRequest(lesson.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as LessonHasDependenciesError;
        expect(error).toBeInstanceOf(LessonHasDependenciesError);
        expect(error.message).toContain('Main Video');
        expect(error.message).toContain('notes.pdf');
        expect(error.message).toContain('Vocabulary Cards');
        expect(error.message).toContain('Final Quiz');
        expect(error.message).toContain('Student A');
      }
    });

    it('includes dependency info in error for frontend usage', async () => {
      const lesson = createValidLesson();
      await repo.create(lesson);

      repo.addDependenciesToLesson(lesson.id.toString(), {
        videos: [
          {
            id: '1',
            title: 'Video 1',
            translations: [{ locale: 'pt' }, { locale: 'it' }],
          },
          { id: '2', title: 'Video 2', translations: [{ locale: 'pt' }] },
        ],
        documents: [{ id: '3', filename: 'doc.pdf', translations: [] }],
      });

      const request = validDeleteRequest(lesson.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as LessonHasDependenciesError;
        expect(error).toBeInstanceOf(LessonHasDependenciesError);

        // Verificar se a informação extra está disponível
        const errorWithInfo = error as any;
        expect(errorWithInfo.dependencyInfo).toBeDefined();
        expect(errorWithInfo.dependencyInfo.canDelete).toBe(false);
        expect(errorWithInfo.dependencyInfo.totalDependencies).toBe(3);
        expect(errorWithInfo.dependencyInfo.summary.videos).toBe(2);
        expect(errorWithInfo.dependencyInfo.summary.documents).toBe(1);
        expect(errorWithInfo.dependencyInfo.summary.flashcards).toBe(0);
        expect(errorWithInfo.dependencyInfo.summary.quizzes).toBe(0);
        expect(errorWithInfo.dependencyInfo.summary.comments).toBe(0);
      }
    });

    it('handles repository error when checking dependencies', async () => {
      const lesson = createValidLesson();
      await repo.create(lesson);

      vi.spyOn(repo, 'checkLessonDependencies').mockResolvedValueOnce(
        left(new Error('Dependencies check failed')),
      );

      const request = validDeleteRequest(lesson.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Dependencies check failed');
      }
    });
  });

  describe('Repository errors', () => {
    it('handles repository error during deletion', async () => {
      const lesson = createValidLesson();
      await repo.create(lesson);

      vi.spyOn(repo, 'delete').mockResolvedValueOnce(
        left(new Error('Deletion failed')),
      );

      const request = validDeleteRequest(lesson.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Deletion failed');
      }
    });

    it('handles exception thrown during deletion', async () => {
      const lesson = createValidLesson();
      await repo.create(lesson);

      vi.spyOn(repo, 'delete').mockImplementationOnce(() => {
        throw new Error('Unexpected deletion error');
      });

      const request = validDeleteRequest(lesson.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected deletion error');
      }
    });

    it('handles generic exception during lesson lookup', async () => {
      const lessonId = new UniqueEntityID().toString();
      vi.spyOn(repo, 'findById').mockImplementationOnce(() => {
        throw new Error('Unexpected lookup error');
      });

      const request = validDeleteRequest(lessonId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected lookup error');
      }
    });
  });

  describe('Edge cases', () => {
    it('handles lesson with no dependencies', async () => {
      const lesson = createValidLesson();
      await repo.create(lesson);

      const request = validDeleteRequest(lesson.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Lesson deleted successfully');
      }
    });

    it('handles lesson with empty dependency arrays', async () => {
      const lesson = createValidLesson();
      await repo.create(lesson);

      repo.addDependenciesToLesson(lesson.id.toString(), {
        videos: [],
        documents: [],
        flashcards: [],
        quizzes: [],
        comments: [],
      });

      const request = validDeleteRequest(lesson.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Lesson deleted successfully');
      }
    });

    it('handles malformed UUID that passes regex but fails in repository', async () => {
      const malformedId = '12345678-1234-1234-1234-123456789012';

      const request = validDeleteRequest(malformedId);
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as LessonNotFoundError;
        expect(error).toBeInstanceOf(LessonNotFoundError);
        expect(error.message).toBe('Lesson not found');
      }
    });

    it('handles exception during dependencies check', async () => {
      const lesson = createValidLesson();
      await repo.create(lesson);

      vi.spyOn(repo, 'checkLessonDependencies').mockImplementationOnce(() => {
        throw new Error('Unexpected dependencies check error');
      });

      const request = validDeleteRequest(lesson.id.toString());
      const result = await sut.execute(request);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.value as RepositoryError;
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.message).toBe('Unexpected dependencies check error');
      }
    });

    it('verifies dependency information structure', async () => {
      const lesson = createValidLesson();
      await repo.create(lesson);

      repo.addDependenciesToLesson(lesson.id.toString(), {
        videos: [
          {
            id: 'v1',
            title: 'Video 1',
            translations: [
              { locale: 'pt' },
              { locale: 'it' },
              { locale: 'es' },
            ],
          },
          { id: 'v2', title: 'Video 2', translations: [{ locale: 'pt' }] },
        ],
        documents: [
          {
            id: 'd1',
            filename: 'guide.pdf',
            translations: [{ locale: 'pt' }, { locale: 'it' }],
          },
        ],
        flashcards: [{ id: 'f1', title: 'Cards 1' }],
        quizzes: [],
        comments: [
          { id: 'c1', author: 'User 1' },
          { id: 'c2', author: 'User 2' },
        ],
      });

      // Testar o método checkLessonDependencies diretamente
      const dependenciesResult = await repo.checkLessonDependencies(
        lesson.id.toString(),
      );

      expect(dependenciesResult.isRight()).toBe(true);
      if (dependenciesResult.isRight()) {
        const info = dependenciesResult.value;
        expect(info.canDelete).toBe(false);
        expect(info.totalDependencies).toBe(6);
        expect(info.summary.videos).toBe(2);
        expect(info.summary.documents).toBe(1);
        expect(info.summary.flashcards).toBe(1);
        expect(info.summary.quizzes).toBe(0);
        expect(info.summary.comments).toBe(2);
        expect(info.dependencies).toHaveLength(6);

        const videoDeps = info.dependencies.filter((d) => d.type === 'video');
        expect(videoDeps).toHaveLength(2);
        expect(videoDeps[0].relatedEntities?.translations).toBe(3);
        expect(videoDeps[1].relatedEntities?.translations).toBe(1);

        const docDep = info.dependencies.find((d) => d.type === 'document');
        expect(docDep?.name).toBe('guide.pdf');
        expect(docDep?.relatedEntities?.translations).toBe(2);
      }
    });

    it('handles multiple lessons from same module', async () => {
      const moduleId = new UniqueEntityID().toString();
      const lesson1 = createValidLesson(undefined, moduleId);
      const lesson2 = createValidLesson(undefined, moduleId);
      const lesson3 = createValidLesson(undefined, moduleId);

      await repo.create(lesson1);
      await repo.create(lesson2);
      await repo.create(lesson3);

      // Deletar apenas a lição 2
      const request = validDeleteRequest(lesson2.id.toString());
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);

      // Verificar que as outras lições ainda existem
      const paginatedResult = await repo.findByModuleId(moduleId, 10, 0);
      expect(paginatedResult.isRight()).toBe(true);
      if (paginatedResult.isRight()) {
        expect(paginatedResult.value.total).toBe(2);
        expect(paginatedResult.value.lessons).toHaveLength(2);
        const remainingIds = paginatedResult.value.lessons.map((l) =>
          l.id.toString(),
        );
        expect(remainingIds).toContain(lesson1.id.toString());
        expect(remainingIds).toContain(lesson3.id.toString());
        expect(remainingIds).not.toContain(lesson2.id.toString());
      }
    });
  });
});
