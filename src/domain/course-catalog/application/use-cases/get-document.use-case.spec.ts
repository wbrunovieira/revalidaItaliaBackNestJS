// src/domain/course-catalog/application/use-cases/get-document.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetDocumentUseCase } from './get-document.use-case';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { InMemoryDocumentRepository } from '@/test/repositories/in-memory-document-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { Document } from '@/domain/course-catalog/enterprise/entities/document.entity';
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

  it('gets document successfully when document exists and belongs to lesson', async () => {
    // preparar uma lição existente em memória
    const lesson = Lesson.create(
      {
        moduleId: 'mod-1',
        translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }],
        flashcardIds: [],
        quizIds: [],
        commentIds: [],
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    );
    await lessonRepo.create(lesson);

    // criar documento na lição
    const document = Document.create(
      {
        url: 'https://example.com/doc.pdf',
        filename: 'doc.pdf',
        title: 'Documento Teste',
        fileSize: 1024 * 1024, // 1MB
        mimeType: 'application/pdf',
        isDownloadable: true,
      },
      new UniqueEntityID('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    );

    const translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
    }> = [
      { locale: 'pt', title: 'Documento PT', description: 'Desc PT' },
      { locale: 'it', title: 'Documento IT', description: 'Desc IT' },
      { locale: 'es', title: 'Documento ES', description: 'Desc ES' },
    ];

    await documentRepo.create(lesson.id.toString(), document, translations);

    const result = await sut.execute(aValidRequest());

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.document.id).toBe(
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      );
      expect(result.value.document.filename).toBe('doc.pdf');
      expect(result.value.document.title).toBe('Documento Teste');
      expect(result.value.document.url).toBe('https://example.com/doc.pdf');
      expect(result.value.document.fileSize).toBe(1024 * 1024);
      expect(result.value.document.fileSizeInMB).toBe(1);
      expect(result.value.document.mimeType).toBe('application/pdf');
      expect(result.value.document.isDownloadable).toBe(true);
      expect(result.value.document.downloadCount).toBe(0);
      expect(result.value.document.translations).toHaveLength(3);
      expect(result.value.document.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ locale: 'pt', title: 'Documento PT' }),
          expect.objectContaining({ locale: 'it', title: 'Documento IT' }),
          expect.objectContaining({ locale: 'es', title: 'Documento ES' }),
        ]),
      );
    }
  });

  it('returns InvalidInputError for invalid lesson ID', async () => {
    const req = { ...aValidRequest(), lessonId: 'invalid-uuid' };
    const result = await sut.execute(req);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    expect((result.value as InvalidInputError).details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['lessonId'] })]),
    );
  });

  it('returns InvalidInputError for invalid document ID', async () => {
    const req = { ...aValidRequest(), documentId: 'invalid-uuid' };
    const result = await sut.execute(req);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    expect((result.value as InvalidInputError).details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['documentId'] }),
      ]),
    );
  });

  it('returns LessonNotFoundError when lesson does not exist', async () => {
    // não criamos nada em lessonRepo
    const result = await sut.execute(aValidRequest());

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(LessonNotFoundError);
  });

  it('returns DocumentNotFoundError when document does not exist', async () => {
    // preparar uma lição existente mas sem documentos
    const lesson = Lesson.create(
      {
        moduleId: 'mod-1',
        translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }],
        flashcardIds: [],
        quizIds: [],
        commentIds: [],
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    );
    await lessonRepo.create(lesson);

    const result = await sut.execute(aValidRequest());

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(DocumentNotFoundError);
  });

  it('returns DocumentNotFoundError when document exists but does not belong to lesson', async () => {
    // preparar duas lições
    const lesson1 = Lesson.create(
      {
        moduleId: 'mod-1',
        translations: [
          { locale: 'pt', title: 'Aula PT 1', description: 'Desc' },
        ],
        flashcardIds: [],
        quizIds: [],
        commentIds: [],
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
        quizIds: [],
        commentIds: [],
      },
      new UniqueEntityID('cccccccc-cccc-cccc-cccc-cccccccccccc'),
    );

    await lessonRepo.create(lesson1);
    await lessonRepo.create(lesson2);

    // criar documento na lesson2
    const document = Document.create(
      {
        url: 'https://example.com/doc.pdf',
        filename: 'doc.pdf',
        title: 'Documento Teste',
        fileSize: 1024,
        mimeType: 'application/pdf',
        isDownloadable: true,
      },
      new UniqueEntityID('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    );

    const translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
    }> = [
      { locale: 'pt', title: 'Documento PT', description: 'Desc PT' },
      { locale: 'it', title: 'Documento IT', description: 'Desc IT' },
      { locale: 'es', title: 'Documento ES', description: 'Desc ES' },
    ];

    await documentRepo.create(lesson2.id.toString(), document, translations);

    // tentar buscar documento da lesson2 usando lesson1
    const result = await sut.execute(aValidRequest()); // usa lesson1 por padrão

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(DocumentNotFoundError);
  });

  it('propagates repository errors as RepositoryError', async () => {
    const lesson = Lesson.create(
      {
        moduleId: 'mod-1',
        translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }],
        flashcardIds: [],
        quizIds: [],
        commentIds: [],
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    );
    await lessonRepo.create(lesson);

    vi.spyOn(documentRepo, 'findById').mockResolvedValueOnce(
      left(new Error('Database connection failed')),
    );

    const result = await sut.execute(aValidRequest());

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(RepositoryError);
  });

  it('includes all document metadata and translations', async () => {
    const lesson = Lesson.create(
      {
        moduleId: 'mod-1',
        translations: [{ locale: 'pt', title: 'Aula PT', description: 'Desc' }],
        flashcardIds: [],
        quizIds: [],
        commentIds: [],
      },
      new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    );
    await lessonRepo.create(lesson);

    const document = Document.create(
      {
        url: 'https://example.com/complete.docx',
        filename: 'complete.docx',
        title: 'Documento Completo',
        fileSize: 2.5 * 1024 * 1024, // 2.5MB
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        isDownloadable: true,
      },
      new UniqueEntityID('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    );

    // Simular alguns downloads
    document.incrementDownloadCount();
    document.incrementDownloadCount();

    const translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
    }> = [
      {
        locale: 'pt',
        title: 'Título Completo PT',
        description: 'Descrição detalhada PT',
      },
      {
        locale: 'it',
        title: 'Titolo Completo IT',
        description: 'Descrizione dettagliata IT',
      },
      {
        locale: 'es',
        title: 'Título Completo ES',
        description: 'Descripción detallada ES',
      },
    ];

    await documentRepo.create(lesson.id.toString(), document, translations);

    const result = await sut.execute(aValidRequest());

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const doc = result.value.document;

      expect(doc.filename).toBe('complete.docx');
      expect(doc.fileSize).toBe(2.5 * 1024 * 1024);
      expect(doc.fileSizeInMB).toBe(2.5);
      expect(doc.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      expect(doc.downloadCount).toBe(2);
      expect(doc.isDownloadable).toBe(true);

      expect(doc.translations).toHaveLength(3);
      expect(doc.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            locale: 'pt',
            title: 'Título Completo PT',
            description: 'Descrição detalhada PT',
          }),
          expect.objectContaining({
            locale: 'it',
            title: 'Titolo Completo IT',
            description: 'Descrizione dettagliata IT',
          }),
          expect.objectContaining({
            locale: 'es',
            title: 'Título Completo ES',
            description: 'Descripción detallada ES',
          }),
        ]),
      );
    }
  });
});
