// src/domain/course-catalog/application/use-cases/delete-lesson.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { DeleteLessonUseCase } from './delete-lesson.use-case';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { InvalidInputError } from './errors/invalid-input-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { LessonHasDependenciesError } from './errors/lesson-has-dependencies-error';
import { RepositoryError } from './errors/repository-error';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';

// Helper to build a valid delete request
function aValidDeleteRequest() {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  };
}

// Build a valid Lesson entity
function createValidLesson(
  id: string = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  moduleId: string = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
) {
  return Lesson.create(
    {
      slug: 'lesson-slug',
      moduleId,
      order: 1,
      imageUrl: 'https://example.com/lesson.jpg',
      flashcardIds: [],
      commentIds: [],
      translations: [
        { locale: 'pt', title: 'Lição PT', description: 'Descrição PT' },
        { locale: 'it', title: 'Lezione IT', description: 'Descrizione IT' },
        { locale: 'es', title: 'Lección ES', description: 'Descripción ES' },
      ],
    },
    new UniqueEntityID(id),
  );
}

describe('DeleteLessonUseCase', () => {
  let lessonRepo: InMemoryLessonRepository;
  let sut: DeleteLessonUseCase;

  beforeEach(() => {
    lessonRepo = new InMemoryLessonRepository();
    sut = new DeleteLessonUseCase(lessonRepo as any);
  });

  // ✅ Success Scenarios
  describe('✅ Success Scenarios', () => {
    it('deletes a lesson successfully when it exists and has no dependencies', async () => {
      const lesson = createValidLesson();
      await lessonRepo.create(lesson);

      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Lesson deleted successfully');
        expect(result.value.deletedAt).toBeInstanceOf(Date);

        // Verify lesson was actually deleted
        const findResult = await lessonRepo.findById(lesson.id.toString());
        expect(findResult.isLeft()).toBe(true);
      }
    });

    it('returns success with valid timestamp', async () => {
      const lesson = createValidLesson();
      await lessonRepo.create(lesson);

      const beforeDeletion = new Date();
      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);
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

  // ❌ Input Validation Failures
  describe('❌ Input Validation Failures', () => {
    it('rejects when id is missing', async () => {
      const req = {} as any;
      const result = await sut.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when id is empty string', async () => {
      const req = { id: '' } as any;
      const result = await sut.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when id is not a valid UUID', async () => {
      const req = { id: 'invalid-uuid' } as any;
      const result = await sut.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when id is not a string', async () => {
      const req = { id: 123 } as any;
      const result = await sut.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when id is null', async () => {
      const req = { id: null } as any;
      const result = await sut.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('rejects when request is empty', async () => {
      const result = await sut.execute({} as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });
  });

  // 🔍 Business Logic Failures
  describe('🔍 Business Logic Failures', () => {
    it('fails when lesson does not exist', async () => {
      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(LessonNotFoundError);
    });

    it('fails when lesson has video dependencies', async () => {
      const lesson = createValidLesson();
      await lessonRepo.create(lesson);

      lessonRepo.addDependenciesToLesson(lesson.id.toString(), {
        video: { id: '1', title: 'Video 1', translations: [{ locale: 'pt' }] },
      });

      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(LessonHasDependenciesError);
      if (
        result.isLeft() &&
        result.value instanceof LessonHasDependenciesError
      ) {
        expect(result.value.message).toContain(
          'Cannot delete lesson because it has dependencies',
        );
      }
    });

    it('fails when lesson has document dependencies', async () => {
      const lesson = createValidLesson();
      await lessonRepo.create(lesson);

      lessonRepo.addDependenciesToLesson(lesson.id.toString(), {
        documents: [
          { id: '1', filename: 'doc1.pdf', translations: [{ locale: 'pt' }] },
        ],
      });

      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(LessonHasDependenciesError);
    });

    it('fails when lesson has flashcard dependencies', async () => {
      const lesson = createValidLesson();
      await lessonRepo.create(lesson);

      lessonRepo.addDependenciesToLesson(lesson.id.toString(), {
        flashcards: [{ id: '1', title: 'Flashcard Set 1' }],
      });

      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(LessonHasDependenciesError);
    });

    it('fails when lesson has quiz dependencies', async () => {
      const lesson = createValidLesson();
      await lessonRepo.create(lesson);

      lessonRepo.addDependenciesToLesson(lesson.id.toString(), {
        assessments: [{ id: '1', title: 'Quiz 1' }],
      });

      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(LessonHasDependenciesError);
    });

    it('fails when lesson has comment dependencies', async () => {
      const lesson = createValidLesson();
      await lessonRepo.create(lesson);

      lessonRepo.addDependenciesToLesson(lesson.id.toString(), {
        comments: [{ id: '1', author: 'John Doe' }],
      });

      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(LessonHasDependenciesError);
    });

    it('fails when lesson has multiple dependency types', async () => {
      const lesson = createValidLesson();
      await lessonRepo.create(lesson);

      lessonRepo.addDependenciesToLesson(lesson.id.toString(), {
        video: { id: '1', title: 'Video 1' },
        documents: [{ id: '2', filename: 'doc.pdf' }],
        flashcards: [{ id: '3', title: 'Cards' }],
        assessments: [{ id: '4', title: 'Quiz' }],
        comments: [{ id: '5', author: 'User' }],
      });

      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(LessonHasDependenciesError);
    });
  });

  // 💾 Repository Error Scenarios
  describe('💾 Repository Error Scenarios', () => {
    it('handles lesson repo findById errors', async () => {
      vi.spyOn(lessonRepo, 'findById').mockResolvedValueOnce(
        left(new Error('DB connection failed')),
      );
      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(LessonNotFoundError);
    });

    it('handles lesson repo delete errors', async () => {
      const lesson = createValidLesson();
      await lessonRepo.create(lesson);

      vi.spyOn(lessonRepo, 'delete').mockResolvedValueOnce(
        left(new Error('Delete operation failed')),
      );

      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.isLeft() && result.value instanceof RepositoryError) {
        expect(result.value.message).toBe('Delete operation failed');
      }
    });

    it('handles dependency check errors', async () => {
      const lesson = createValidLesson();
      await lessonRepo.create(lesson);

      vi.spyOn(lessonRepo, 'checkLessonDependencies').mockResolvedValueOnce(
        left(new Error('Dependency check failed')),
      );

      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.isLeft() && result.value instanceof RepositoryError) {
        expect(result.value.message).toBe('Dependency check failed');
      }
    });

    it('handles exceptions during deletion', async () => {
      const lesson = createValidLesson();
      await lessonRepo.create(lesson);

      vi.spyOn(lessonRepo, 'delete').mockImplementationOnce(() => {
        throw new Error('Unexpected deletion error');
      });

      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.isLeft() && result.value instanceof RepositoryError) {
        expect(result.value.message).toBe('Unexpected deletion error');
      }
    });

    it('handles exceptions during lesson lookup', async () => {
      vi.spyOn(lessonRepo, 'findById').mockImplementationOnce(() => {
        throw new Error('Unexpected lookup error');
      });

      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.isLeft() && result.value instanceof RepositoryError) {
        expect(result.value.message).toBe('Unexpected lookup error');
      }
    });

    it('handles exceptions during dependency check', async () => {
      const lesson = createValidLesson();
      await lessonRepo.create(lesson);

      vi.spyOn(lessonRepo, 'checkLessonDependencies').mockImplementationOnce(
        () => {
          throw new Error('Unexpected dependency check error');
        },
      );

      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.isLeft() && result.value instanceof RepositoryError) {
        expect(result.value.message).toBe('Unexpected dependency check error');
      }
    });
  });

  // 🎯 Edge Cases
  describe('🎯 Edge Cases', () => {
    it('handles lesson with empty dependency arrays', async () => {
      const lesson = createValidLesson();
      await lessonRepo.create(lesson);

      lessonRepo.addDependenciesToLesson(lesson.id.toString(), {
        documents: [],
        flashcards: [],
        assessments: [],
        comments: [],
      });

      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('Lesson deleted successfully');
      }
    });

    it('handles malformed UUID that passes validation but fails in repository', async () => {
      const req = { id: '12345678-1234-1234-1234-123456789012' };
      const result = await sut.execute(req as any);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(LessonNotFoundError);
    });

    it('verifies dependency information structure', async () => {
      const lesson = createValidLesson();
      await lessonRepo.create(lesson);

      lessonRepo.addDependenciesToLesson(lesson.id.toString(), {
        video: {
          id: 'v1',
          title: 'Video 1',
          translations: [{ locale: 'pt' }, { locale: 'it' }, { locale: 'es' }],
        },
        documents: [
          {
            id: 'd1',
            filename: 'guide.pdf',
            translations: [{ locale: 'pt' }, { locale: 'it' }],
          },
        ],
        flashcards: [{ id: 'f1', title: 'Cards 1' }],
        comments: [
          { id: 'c1', author: 'User 1' },
          { id: 'c2', author: 'User 2' },
        ],
      });

      const dependenciesResult = await lessonRepo.checkLessonDependencies(
        lesson.id.toString(),
      );
      expect(dependenciesResult.isRight()).toBe(true);
      if (dependenciesResult.isRight()) {
        const info = dependenciesResult.value;
        expect(info.canDelete).toBe(false);
        expect(info.totalDependencies).toBe(5);
        expect(info.summary.videos).toBe(1);
        expect(info.summary.documents).toBe(1);
        expect(info.summary.flashcards).toBe(1);
        expect(info.summary.assessments).toBe(0);
        expect(info.summary.comments).toBe(2);
      }
    });

    it('handles deletion of one lesson among multiple in same module', async () => {
      const moduleId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
      const lesson1 = createValidLesson(
        '11111111-1111-1111-1111-111111111111',
        moduleId,
      );
      const lesson2 = createValidLesson(
        '22222222-2222-2222-2222-222222222222',
        moduleId,
      );
      const lesson3 = createValidLesson(
        '33333333-3333-3333-3333-333333333333',
        moduleId,
      );

      await lessonRepo.create(lesson1);
      await lessonRepo.create(lesson2);
      await lessonRepo.create(lesson3);

      const req = { id: lesson2.id.toString() };
      const result = await sut.execute(req as any);
      expect(result.isRight()).toBe(true);

      // Verify other lessons still exist
      const findResult1 = await lessonRepo.findById(lesson1.id.toString());
      const findResult3 = await lessonRepo.findById(lesson3.id.toString());
      expect(findResult1.isRight()).toBe(true);
      expect(findResult3.isRight()).toBe(true);

      // Verify deleted lesson is gone
      const findResult2 = await lessonRepo.findById(lesson2.id.toString());
      expect(findResult2.isLeft()).toBe(true);
    });
  });

  // 🔄 Sequence and Dependencies
  describe('🔄 Sequence and Dependencies', () => {
    it('calls repos in correct order', async () => {
      const lesson = createValidLesson();
      await lessonRepo.create(lesson);

      const findSpy = vi.spyOn(lessonRepo, 'findById');
      const depSpy = vi.spyOn(lessonRepo, 'checkLessonDependencies');
      const deleteSpy = vi.spyOn(lessonRepo, 'delete');

      const req = aValidDeleteRequest();
      await sut.execute(req as any);

      expect(findSpy).toHaveBeenCalledWith(req.id);
      expect(depSpy).toHaveBeenCalledWith(req.id);
      expect(deleteSpy).toHaveBeenCalledWith(req.id);
    });

    it('stops on validation failure', async () => {
      const findSpy = vi.spyOn(lessonRepo, 'findById');
      const depSpy = vi.spyOn(lessonRepo, 'checkLessonDependencies');
      const deleteSpy = vi.spyOn(lessonRepo, 'delete');

      const req = { id: 'invalid-uuid' };
      await sut.execute(req as any);

      expect(findSpy).not.toHaveBeenCalled();
      expect(depSpy).not.toHaveBeenCalled();
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('stops on lesson not found', async () => {
      const depSpy = vi.spyOn(lessonRepo, 'checkLessonDependencies');
      const deleteSpy = vi.spyOn(lessonRepo, 'delete');

      const req = aValidDeleteRequest();
      await sut.execute(req as any);

      expect(depSpy).not.toHaveBeenCalled();
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('stops on dependency check failure', async () => {
      const lesson = createValidLesson();
      await lessonRepo.create(lesson);

      lessonRepo.addDependenciesToLesson(lesson.id.toString(), {
        video: { id: '1', title: 'Video 1' },
      });

      const deleteSpy = vi.spyOn(lessonRepo, 'delete');

      const req = aValidDeleteRequest();
      const result = await sut.execute(req as any);

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(LessonHasDependenciesError);
      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });
});
