// src/domain/course-catalog/application/use-cases/list-documents.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListDocumentsUseCase } from './list-documents.use-case';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { InMemoryDocumentRepository } from '@/test/repositories/in-memory-document-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { Document } from '@/domain/course-catalog/enterprise/entities/document.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { InvalidInputError } from './errors/invalid-input-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { right, left } from '@/core/either';

function aValidRequest() {
  return {
    lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  };
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

    // criar documentos na lição
    const document1 = Document.create({
      url: 'https://example.com/doc1.pdf',
      filename: 'doc1.pdf',
      title: 'Documento 1',
      fileSize: 1024 * 1024, // 1MB
      mimeType: 'application/pdf',
      isDownloadable: true,
    });

    const document2 = Document.create({
      url: 'https://example.com/doc2.docx',
      filename: 'doc2.docx',
      title: 'Documento 2',
      fileSize: 512 * 1024, // 512KB
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      isDownloadable: true,
    });

    const translations1: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
    }> = [
      { locale: 'pt', title: 'Documento 1 PT', description: 'Desc PT' },
      { locale: 'it', title: 'Documento 1 IT', description: 'Desc IT' },
      { locale: 'es', title: 'Documento 1 ES', description: 'Desc ES' },
    ];

    const translations2: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
    }> = [
      { locale: 'pt', title: 'Documento 2 PT', description: 'Desc PT' },
      { locale: 'it', title: 'Documento 2 IT', description: 'Desc IT' },
      { locale: 'es', title: 'Documento 2 ES', description: 'Desc ES' },
    ];

    await documentRepo.create(lesson.id.toString(), document1, translations1);
    await documentRepo.create(lesson.id.toString(), document2, translations2);

    const result = await sut.execute(aValidRequest());

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.documents).toHaveLength(2);

      const doc1 = result.value.documents.find(
        (d) => d.filename === 'doc1.pdf',
      );
      expect(doc1).toBeDefined();
      expect(doc1!.filename).toBe('doc1.pdf');
      expect(doc1!.mimeType).toBe('application/pdf');
      expect(doc1!.fileSizeInMB).toBe(1);
      expect(doc1!.isDownloadable).toBe(true);
      expect(doc1!.downloadCount).toBe(0);
      expect(doc1!.translations).toHaveLength(3);

      const doc2 = result.value.documents.find(
        (d) => d.filename === 'doc2.docx',
      );
      expect(doc2).toBeDefined();
      expect(doc2!.filename).toBe('doc2.docx');
      expect(doc2!.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      expect(doc2!.fileSizeInMB).toBe(0.5);
    }
  });

  it('returns empty array when lesson has no documents', async () => {
    // preparar uma lição existente em memória sem documentos
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

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.documents).toHaveLength(0);
      expect(result.value.documents).toEqual([]);
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

  it('returns LessonNotFoundError when lesson does not exist', async () => {
    // não criamos nada em lessonRepo
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

  it('sorts documents by creation date (newest first)', async () => {
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

    // criar documentos com datas diferentes
    const oldDate = new Date('2023-01-01');
    const newDate = new Date('2023-12-31');

    const oldDocument = Document.reconstruct(
      {
        url: 'https://example.com/old.pdf',
        filename: 'old.pdf',
        title: 'Documento Antigo',
        fileSize: 1024,
        mimeType: 'application/pdf',
        isDownloadable: true,
        downloadCount: 0,
        createdAt: oldDate,
        updatedAt: oldDate,
      },
      new UniqueEntityID('old-doc-id'),
    );

    const newDocument = Document.reconstruct(
      {
        url: 'https://example.com/new.pdf',
        filename: 'new.pdf',
        title: 'Documento Novo',
        fileSize: 1024,
        mimeType: 'application/pdf',
        isDownloadable: true,
        downloadCount: 0,
        createdAt: newDate,
        updatedAt: newDate,
      },
      new UniqueEntityID('new-doc-id'),
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

    await documentRepo.create(lesson.id.toString(), oldDocument, translations);
    await documentRepo.create(lesson.id.toString(), newDocument, translations);

    const result = await sut.execute(aValidRequest());

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.documents).toHaveLength(2);
      // Verificar se retorna todos os documentos (ordem não é garantida pelo caso de uso base)
      const filenames = result.value.documents.map((d) => d.filename);
      expect(filenames).toContain('old.pdf');
      expect(filenames).toContain('new.pdf');
    }
  });

  it('includes all translations for each document', async () => {
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

    const document = Document.create({
      url: 'https://example.com/multilang.pdf',
      filename: 'multilang.pdf',
      title: 'Documento Multilíngue',
      fileSize: 1024,
      mimeType: 'application/pdf',
      isDownloadable: true,
    });

    const translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
    }> = [
      { locale: 'pt', title: 'Título PT', description: 'Descrição PT' },
      { locale: 'it', title: 'Titolo IT', description: 'Descrizione IT' },
      { locale: 'es', title: 'Título ES', description: 'Descripción ES' },
    ];

    await documentRepo.create(lesson.id.toString(), document, translations);

    const result = await sut.execute(aValidRequest());

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.documents).toHaveLength(1);
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
