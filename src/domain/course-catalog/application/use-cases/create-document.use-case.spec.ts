import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateDocumentUseCase } from './create-document.use-case';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { InMemoryDocumentRepository } from '@/test/repositories/in-memory-document-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { DocumentTranslationProps } from '@/domain/course-catalog/enterprise/entities/document.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { InvalidInputError } from './errors/invalid-input-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { DuplicateDocumentError } from './errors/duplicate-document-error';
import { RepositoryError } from './errors/repository-error';
import { InvalidFileError } from './errors/invalid-file-error';
import { right, left } from '@/core/either';

function aValidRequest() {
  const translations: DocumentTranslationProps[] = [
    {
      locale: 'pt',
      title: 'Material do Curso',
      description: 'Desc PT',
      url: '/mat-pt.pdf',
    },
    {
      locale: 'it',
      title: 'Materiale del Corso',
      description: 'Desc IT',
      url: '/mat-it.pdf',
    },
    {
      locale: 'es',
      title: 'Material del Curso',
      description: 'Desc ES',
      url: '/mat-es.pdf',
    },
  ];
  return {
    lessonId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    filename: 'material-curso.pdf',
    fileSize: 1024 * 1024, // 1MB
    mimeType: 'application/pdf',
    isDownloadable: true,
    translations,
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

    const result = await sut.execute(aValidRequest() as any);
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.document.filename).toBe('material-curso.pdf');
      expect(result.value.document.mimeType).toBe('application/pdf');
      expect(result.value.document.fileSize).toBe(1024 * 1024);
      expect(result.value.document.fileSizeInMB).toBe(1);
      expect(result.value.document.isDownloadable).toBe(true);
      expect(result.value.translations).toHaveLength(3);
      expect(result.value.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ locale: 'pt', url: '/mat-pt.pdf' }),
        ]),
      );
    }
  });

  it('returns InvalidInputError for missing translation url', async () => {
    const req = aValidRequest();
    req.translations[0].url = '';
    const result = await sut.execute(req as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    expect((result.value as InvalidInputError).details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['translations', 0, 'url'] }),
      ]),
    );
  });

  it('returns InvalidInputError for invalid file size', async () => {
    const req = { ...aValidRequest(), fileSize: 60 * 1024 * 1024 };
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

  it('returns InvalidInputError for duplicate locale in translations', async () => {
    const req = aValidRequest();
    req.translations = [
      { locale: 'it', title: 'X', description: 'X', url: '/x-it.pdf' },
      { locale: 'it', title: 'Y', description: 'Y', url: '/y-it.pdf' },
      { locale: 'es', title: 'Z', description: 'Z', url: '/z-es.pdf' },
    ];
    const result = await sut.execute(req as any);
    expect(result.isLeft()).toBe(true);
    const details = (result.value as InvalidInputError).details;
    const hasDup = details.some((d) => /duplicate locale/i.test(d.message));
    expect(hasDup).toBe(true);
  });

  it('errors if lesson not found', async () => {
    const result = await sut.execute(aValidRequest() as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(LessonNotFoundError);
  });

  it('errors on duplicate filename', async () => {
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

    // Word document
    const wordReq = {
      ...aValidRequest(),
      filename: 'doc.docx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const wordRes = await sut.execute(wordReq as any);
    expect(wordRes.isRight()).toBe(true);

    // Excel document
    const excelReq = {
      ...aValidRequest(),
      filename: 'sheet.xlsx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    const excelRes = await sut.execute(excelReq as any);
    expect(excelRes.isRight()).toBe(true);
  });

  it('calculates file size in MB correctly', async () => {
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

    const req = { ...aValidRequest(), fileSize: 2.5 * 1024 * 1024 };
    const result = await sut.execute(req as any);
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.document.fileSizeInMB).toBe(2.5);
    }
  });
});
