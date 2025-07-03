import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListDocumentsUseCase } from './list-documents.use-case';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { InMemoryDocumentRepository } from '@/test/repositories/in-memory-document-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import {
  Document,
  DocumentTranslationProps,
} from '@/domain/course-catalog/enterprise/entities/document.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { InvalidInputError } from './errors/invalid-input-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { right, left } from '@/core/either';

function aValidRequest() {
  return { lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' };
}

describe('ListDocumentsUseCase', () => {
  let lessonRepo: InMemoryLessonRepository;
  let documentRepo: InMemoryDocumentRepository;
  let sut: ListDocumentsUseCase;

  beforeEach(() => {
    lessonRepo = new InMemoryLessonRepository();
    documentRepo = new InMemoryDocumentRepository();
    sut = new ListDocumentsUseCase(lessonRepo as any, documentRepo as any);
  });

  it('lists documents successfully when lesson has documents', async () => {
    // Arrange lesson
    const lesson = Lesson.create(
      {
        moduleId: 'mod-1',
        translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }],
        flashcardIds: [],
        quizIds: [],
        commentIds: [],
        order: 0,
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    );
    await lessonRepo.create(lesson);

    const translations1: DocumentTranslationProps[] = [
      {
        locale: 'pt',
        title: 'Documento 1 PT',
        description: 'Desc PT',
        url: '/doc1-pt.pdf',
      },
      {
        locale: 'it',
        title: 'Documento 1 IT',
        description: 'Desc IT',
        url: '/doc1-it.pdf',
      },
      {
        locale: 'es',
        title: 'Documento 1 ES',
        description: 'Desc ES',
        url: '/doc1-es.pdf',
      },
    ];
    const translations2: DocumentTranslationProps[] = [
      {
        locale: 'pt',
        title: 'Documento 2 PT',
        description: 'Desc PT',
        url: '/doc2-pt.docx',
      },
      {
        locale: 'it',
        title: 'Documento 2 IT',
        description: 'Desc IT',
        url: '/doc2-it.docx',
      },
      {
        locale: 'es',
        title: 'Documento 2 ES',
        description: 'Desc ES',
        url: '/doc2-es.docx',
      },
    ];

    // Create document entities
    const document1 = Document.create({
      filename: 'doc1.pdf',
      fileSize: 1024 * 1024,
      mimeType: 'application/pdf',
      isDownloadable: true,
      translations: translations1,
    });
    const document2 = Document.create({
      filename: 'doc2.docx',
      fileSize: 512 * 1024,
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      isDownloadable: true,
      translations: translations2,
    });

    await documentRepo.create(lesson.id.toString(), document1, translations1);
    await documentRepo.create(lesson.id.toString(), document2, translations2);

    // Act
    const result = await sut.execute(aValidRequest());

    // Assert
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const docs = result.value.documents;
      expect(docs).toHaveLength(2);

      const doc1 = docs.find((d) => d.filename === 'doc1.pdf');
      expect(doc1).toBeDefined();
      expect(doc1!.filename).toBe('doc1.pdf');
      expect(doc1!.mimeType).toBe('application/pdf');
      expect(doc1!.fileSizeInMB).toBe(1);
      expect(doc1!.isDownloadable).toBe(true);
      expect(doc1!.downloadCount).toBe(0);
      expect(doc1!.translations).toHaveLength(3);
      expect(doc1!.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ locale: 'pt', title: 'Documento 1 PT' }),
          expect.objectContaining({ locale: 'it', title: 'Documento 1 IT' }),
          expect.objectContaining({ locale: 'es', title: 'Documento 1 ES' }),
        ]),
      );

      const doc2 = docs.find((d) => d.filename === 'doc2.docx');
      expect(doc2).toBeDefined();
      expect(doc2!.fileSizeInMB).toBe(0.5);
    }
  });

  it('returns empty array when lesson has no documents', async () => {
    const lesson = Lesson.create(
      {
        moduleId: 'mod-1',
        translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }],
        flashcardIds: [],
        quizIds: [],
        commentIds: [],
        order: 0,
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    );
    await lessonRepo.create(lesson);

    const result = await sut.execute(aValidRequest());
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.documents).toEqual([]);
    }
  });

  it('returns InvalidInputError for invalid lesson ID', async () => {
    const result = await sut.execute({ lessonId: 'invalid-uuid' });
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
  });

  it('returns LessonNotFoundError when lesson does not exist', async () => {
    const result = await sut.execute(aValidRequest());
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(LessonNotFoundError);
  });

  it('propagates repository errors as RepositoryError', async () => {
    const lesson = Lesson.create(
      {
        moduleId: 'mod-1',
        translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }],
        flashcardIds: [],
        quizIds: [],
        commentIds: [],
        order: 0,
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    );
    await lessonRepo.create(lesson);

    vi.spyOn(documentRepo, 'findByLesson').mockResolvedValueOnce(
      left(new Error('Database connection failed')),
    );

    const result = await sut.execute(aValidRequest());
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(RepositoryError);
  });

  it('includes all translations for each document', async () => {
    const lesson = Lesson.create(
      {
        moduleId: 'mod-1',
        translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }],
        flashcardIds: [],
        quizIds: [],
        commentIds: [],
        order: 0,
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    );
    await lessonRepo.create(lesson);

    const translations: DocumentTranslationProps[] = [
      {
        locale: 'pt',
        title: 'Título PT',
        description: 'Descrição PT',
        url: '/multi-pt.pdf',
      },
      {
        locale: 'it',
        title: 'Titolo IT',
        description: 'Descrizione IT',
        url: '/multi-it.pdf',
      },
      {
        locale: 'es',
        title: 'Título ES',
        description: 'Descripción ES',
        url: '/multi-es.pdf',
      },
    ];

    const document = Document.create({
      filename: 'multi.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      isDownloadable: true,
      translations,
    });

    await documentRepo.create(lesson.id.toString(), document, translations);

    const result = await sut.execute(aValidRequest());
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const doc = result.value.documents[0];
      expect(doc.translations).toHaveLength(3);
      expect(doc.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ locale: 'pt', title: 'Título PT' }),
          expect.objectContaining({ locale: 'it', title: 'Titolo IT' }),
          expect.objectContaining({ locale: 'es', title: 'Título ES' }),
        ]),
      );
    }
  });
});
