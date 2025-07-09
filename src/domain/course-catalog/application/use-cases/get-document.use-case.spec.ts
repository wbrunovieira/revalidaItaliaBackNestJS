// src/domain/course-catalog/application/use-cases/get-document.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetDocumentUseCase } from './get-document.use-case';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { InMemoryDocumentRepository } from '@/test/repositories/in-memory-document-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { Document } from '@/domain/course-catalog/enterprise/entities/document.entity';
import { DocumentTranslationProps } from '@/domain/course-catalog/enterprise/entities/document.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { InvalidInputError } from './errors/invalid-input-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { DocumentNotFoundError } from './errors/document-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { right, left } from '@/core/either';

function aValidRequest() {
  return {
    lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    documentId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  };
}

describe('GetDocumentUseCase', () => {
  let lessonRepo: InMemoryLessonRepository;
  let documentRepo: InMemoryDocumentRepository;
  let sut: GetDocumentUseCase;

  beforeEach(() => {
    lessonRepo = new InMemoryLessonRepository();
    documentRepo = new InMemoryDocumentRepository();
    sut = new GetDocumentUseCase(lessonRepo as any, documentRepo as any);
  });

  it('gets document successfully when it exists and belongs to the lesson', async () => {
    // arrange: lesson
    const lesson = Lesson.create(
      {
        slug: 'lesson-test',
        moduleId: 'mod-1',
        translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }],
        flashcardIds: [],
        assessments: [],
        commentIds: [],
        order: 0,
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    );
    await lessonRepo.create(lesson);

    // arrange: translations for each locale
    const translations: DocumentTranslationProps[] = [
      {
        locale: 'pt',
        title: 'Doc PT',
        description: 'Desc PT',
        url: '/doc-pt.pdf',
      },
      {
        locale: 'it',
        title: 'Doc IT',
        description: 'Desc IT',
        url: '/doc-it.pdf',
      },
      {
        locale: 'es',
        title: 'Doc ES',
        description: 'Desc ES',
        url: '/doc-es.pdf',
      },
    ];

    // create document entity (no root url/title, just metadata + translations)
    const document = Document.create(
      {
        filename: 'doc.pdf',
        fileSize: 1024 * 1024, // 1MB
        mimeType: 'application/pdf',
        isDownloadable: true,
        translations,
      },
      new UniqueEntityID('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    );
    // simulate some downloads
    document.incrementDownloadCount();
    document.incrementDownloadCount();

    // persist in repo
    await documentRepo.create(lesson.id.toString(), document, translations);

    // act
    const result = await sut.execute(aValidRequest());

    // assert
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const doc = result.value.document;
      expect(doc.id).toBe('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
      expect(doc.filename).toBe('doc.pdf');
      expect(doc.fileSize).toBe(1024 * 1024);
      expect(doc.fileSizeInMB).toBe(1);
      expect(doc.mimeType).toBe('application/pdf');
      expect(doc.isDownloadable).toBe(true);
      expect(doc.downloadCount).toBe(2);
      // translations
      expect(doc.translations).toHaveLength(3);
      expect(doc.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            locale: 'pt',
            title: 'Doc PT',
            url: '/doc-pt.pdf',
          }),
          expect.objectContaining({
            locale: 'it',
            title: 'Doc IT',
            url: '/doc-it.pdf',
          }),
          expect.objectContaining({
            locale: 'es',
            title: 'Doc ES',
            url: '/doc-es.pdf',
          }),
        ]),
      );
    }
  });

  it('returns InvalidInputError for invalid UUIDs', async () => {
    let result = await sut.execute({
      lessonId: 'bad',
      documentId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    });
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    expect((result.value as InvalidInputError).details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['lessonId'] })]),
    );

    result = await sut.execute({
      lessonId: aValidRequest().lessonId,
      documentId: 'bad',
    });
    expect(result.isLeft()).toBe(true);
    expect((result.value as InvalidInputError).details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['documentId'] }),
      ]),
    );
  });

  it('returns LessonNotFoundError when lesson is missing', async () => {
    const result = await sut.execute(aValidRequest());
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(LessonNotFoundError);
  });

  it('returns DocumentNotFoundError when document is missing', async () => {
    // lesson exists, but no docs
    const lesson = Lesson.create(
      {
        slug: 'lesson-test',
        moduleId: 'mod-1',
        translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }],
        flashcardIds: [],
        assessments: [],
        commentIds: [],
        order: 0,
      },
      new UniqueEntityID(aValidRequest().lessonId),
    );
    await lessonRepo.create(lesson);

    const result = await sut.execute(aValidRequest());
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(DocumentNotFoundError);
  });

  it('returns DocumentNotFoundError when document belongs to another lesson', async () => {
    // two lessons
    const lesson1 = Lesson.create(
      {
        slug: 'lesson-test',
        moduleId: 'mod-1',
        translations: [
          { locale: 'pt', title: 'Aula PT 1', description: 'Desc' },
        ],
        flashcardIds: [],
        assessments: [],
        commentIds: [],
        order: 0,
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    );
    const lesson2 = Lesson.create(
      {
        moduleId: 'mod-2',
        translations: [
          { locale: 'pt', title: 'Aula PT 2', description: 'Desc' },
        ],
        flashcardIds: [],
        assessments: [],
        commentIds: [],
        order: 0,
        slug: '',
      },
      new UniqueEntityID('cccccccc-cccc-cccc-cccc-cccccccccccc'),
    );
    await lessonRepo.create(lesson1);
    await lessonRepo.create(lesson2);

    // create doc under lesson2
    const translations: DocumentTranslationProps[] = [
      { locale: 'pt', title: 'X PT', description: 'X', url: '/x-pt.pdf' },
      { locale: 'it', title: 'X IT', description: 'X', url: '/x-it.pdf' },
      { locale: 'es', title: 'X ES', description: 'X', url: '/x-es.pdf' },
    ];
    const document = Document.create(
      {
        filename: 'other.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        isDownloadable: true,
        translations,
      },
      new UniqueEntityID(aValidRequest().documentId),
    );
    await documentRepo.create(lesson2.id.toString(), document, translations);

    // attempt fetch under lesson1
    const result = await sut.execute(aValidRequest());
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(DocumentNotFoundError);
  });

  it('propagates repository errors as RepositoryError', async () => {
    // lesson exists
    const lesson = Lesson.create(
      {
        slug: 'lesson-test',
        moduleId: 'mod-1',
        translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }],
        flashcardIds: [],
        assessments: [],
        commentIds: [],
        order: 0,
      },
      new UniqueEntityID(aValidRequest().lessonId),
    );
    await lessonRepo.create(lesson);

    vi.spyOn(documentRepo, 'findById').mockResolvedValueOnce(
      left(new Error('DB fail')),
    );
    const result = await sut.execute(aValidRequest());
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(RepositoryError);
  });
});
