// src/domain/course-catalog/application/use-cases/create-document.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateDocumentUseCase } from './create-document.use-case';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { InMemoryDocumentRepository } from '@/test/repositories/in-memory-document-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { InvalidInputError } from './errors/invalid-input-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { DuplicateDocumentError } from './errors/duplicate-document-error';
import { RepositoryError } from './errors/repository-error';
import { InvalidFileError } from './errors/invalid-file-error';
import { right, left } from '@/core/either';

function aValidRequest() {
  return {
    lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    url: 'https://example.com/documents/material-curso.pdf',
    filename: 'material-curso.pdf',
    fileSize: 1024 * 1024, // 1MB
    mimeType: 'application/pdf',
    isDownloadable: true,
    translations: [
      { locale: 'pt', title: 'Material do Curso', description: 'Desc PT' },
      { locale: 'it', title: 'Materiale del Corso', description: 'Desc IT' },
      { locale: 'es', title: 'Material del Curso', description: 'Desc ES' },
    ],
  };
}

describe('CreateDocumentUseCase', () => {
  let lessonRepo: InMemoryLessonRepository;
  let documentRepo: InMemoryDocumentRepository;
  let sut: CreateDocumentUseCase;

  beforeEach(() => {
    lessonRepo = new InMemoryLessonRepository();
    documentRepo = new InMemoryDocumentRepository();

    sut = new CreateDocumentUseCase(lessonRepo as any, documentRepo as any);
  });

  it('creates a document successfully', async () => {
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

    const result = await sut.execute(aValidRequest() as any);
    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      expect(result.value.document.filename).toBe('material-curso.pdf');
      expect(result.value.document.mimeType).toBe('application/pdf');
      expect(result.value.document.fileSize).toBe(1024 * 1024);
      expect(result.value.document.fileSizeInMB).toBe(1);
      expect(result.value.document.isDownloadable).toBe(true);
      expect(result.value.translations).toHaveLength(3);
    }
  });

  it('returns InvalidInputError for missing url', async () => {
    const req = { ...aValidRequest(), url: '' };
    const result = await sut.execute(req as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    expect((result.value as InvalidInputError).details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['url'] })]),
    );
  });

  it('returns InvalidInputError for invalid file size', async () => {
    const req = { ...aValidRequest(), fileSize: 60 * 1024 * 1024 }; // 60MB
    const result = await sut.execute(req as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    expect((result.value as InvalidInputError).details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['fileSize'] })]),
    );
  });

  it('returns InvalidInputError for invalid mime type', async () => {
    const req = { ...aValidRequest(), mimeType: 'application/unknown' };
    const result = await sut.execute(req as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    expect((result.value as InvalidInputError).details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['mimeType'] })]),
    );
  });

  it('returns InvalidInputError for filename extension mismatch', async () => {
    const req = {
      ...aValidRequest(),
      filename: 'document.txt',
      mimeType: 'application/pdf',
    };
    const result = await sut.execute(req as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    expect((result.value as InvalidInputError).details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['filename'] })]),
    );
  });

  it('returns InvalidInputError for missing Portuguese translation', async () => {
    const req = aValidRequest();
    req.translations = req.translations.filter((t) => t.locale !== 'pt');
    const result = await sut.execute(req as any);
    expect(result.isLeft()).toBe(true);
    expect((result.value as InvalidInputError).details[0].message).toMatch(
      /exactly three translations required/i,
    );
  });

  it('returns InvalidInputError when PT translation is replaced with duplicate', async () => {
    const req = aValidRequest();
    // Substitui PT por um segundo IT (mantém 3 traduções mas sem PT)
    req.translations = [
      {
        locale: 'it',
        title: 'Materiale del Corso 1',
        description: 'Desc IT 1',
      },
      {
        locale: 'it',
        title: 'Materiale del Corso 2',
        description: 'Desc IT 2',
      },
      { locale: 'es', title: 'Material del Curso', description: 'Desc ES' },
    ];
    const result = await sut.execute(req as any);
    expect(result.isLeft()).toBe(true);

    // Procura por uma das mensagens possíveis
    const errorDetails = (result.value as InvalidInputError).details;
    const hasExpectedError = errorDetails.some(
      (detail) =>
        detail.message.match(/missing pt translation/i) ||
        detail.message.match(/duplicate locale/i),
    );
    expect(hasExpectedError).toBe(true);
  });

  it('errors if lesson not found', async () => {
    // não criamos nada em lessonRepo
    const result = await sut.execute(aValidRequest() as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(LessonNotFoundError);
  });

  it('errors on duplicate filename', async () => {
    // criar a lição
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

    // forçar filename duplicado
    vi.spyOn(documentRepo, 'findByFilename').mockResolvedValueOnce(
      right(lesson as any),
    );

    const result = await sut.execute(aValidRequest() as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(DuplicateDocumentError);
  });

  it('propagates repo.create errors as RepositoryError', async () => {
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

    vi.spyOn(documentRepo, 'create').mockResolvedValueOnce(
      left(new Error('save fail')),
    );

    const result = await sut.execute(aValidRequest() as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(RepositoryError);
  });

  it('validates file types correctly for different extensions', async () => {
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

    // Test Word document
    const wordRequest = {
      ...aValidRequest(),
      filename: 'document.docx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    const wordResult = await sut.execute(wordRequest as any);
    expect(wordResult.isRight()).toBe(true);

    // Test Excel document
    const excelRequest = {
      ...aValidRequest(),
      filename: 'spreadsheet.xlsx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    const excelResult = await sut.execute(excelRequest as any);
    expect(excelResult.isRight()).toBe(true);
  });

  it('calculates file size in MB correctly', async () => {
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

    const req = { ...aValidRequest(), fileSize: 2.5 * 1024 * 1024 }; // 2.5MB
    const result = await sut.execute(req as any);

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.document.fileSizeInMB).toBe(2.5);
    }
  });
});
