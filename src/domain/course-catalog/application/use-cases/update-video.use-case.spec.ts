import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateVideoUseCase } from './update-video.use-case';
import { InMemoryVideoRepository } from '@/test/repositories/in-memory-video-repository';
import { InMemoryLessonRepository } from '@/test/repositories/in-memory-lesson-repository';
import { InvalidInputError } from './errors/invalid-input-error';
import { VideoNotFoundError } from './errors/video-not-found-error';
import { DuplicateVideoError } from './errors/duplicate-video-error';
import { LessonNotFoundError } from './errors/lesson-not-found.error';
import { Video } from '../../enterprise/entities/video.entity';
import { Lesson } from '../../enterprise/entities/lesson.entity';
import { VideoTranslationVO } from '../../enterprise/value-objects/video-translation.vo';

describe('UpdateVideoUseCase', () => {
  let sut: UpdateVideoUseCase;
  let videoRepository: InMemoryVideoRepository;
  let lessonRepository: InMemoryLessonRepository;

  beforeEach(() => {
    videoRepository = new InMemoryVideoRepository();
    lessonRepository = new InMemoryLessonRepository();
    sut = new UpdateVideoUseCase(videoRepository, lessonRepository);
  });

  it('should update video slug successfully', async () => {
    const video = Video.create({
      slug: 'original-slug',
      imageUrl: 'https://example.com/image.jpg',
      providerVideoId: 'provider123',
      durationInSeconds: 300,
      lessonId: 'lesson-123',
      translations: [
        new VideoTranslationVO('pt', 'Título', 'Descrição'),
        new VideoTranslationVO('it', 'Titolo', 'Descrizione'),
        new VideoTranslationVO('es', 'Título', 'Descripción'),
      ],
    });
    const translations = [
      { locale: 'pt' as const, title: 'Título', description: 'Descrição' },
      { locale: 'it' as const, title: 'Titolo', description: 'Descrizione' },
      { locale: 'es' as const, title: 'Título', description: 'Descripción' },
    ];
    await videoRepository.create('lesson-123', video, translations);

    const result = await sut.execute({
      videoId: video.id.toString(),
      slug: 'new-slug',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.message).toBe('Video updated successfully');
    }
    const updatedVideo = await videoRepository.findById(video.id.toString());
    expect(updatedVideo.isRight()).toBe(true);
    if (updatedVideo.isRight()) {
      expect(updatedVideo.value.video.slug).toBe('new-slug');
    }
  });

  it('should update video details partially', async () => {
    const video = Video.create({
      slug: 'test-video',
      imageUrl: 'https://example.com/old.jpg',
      providerVideoId: 'old-provider-id',
      durationInSeconds: 100,
      lessonId: 'lesson-123',
      translations: [
        new VideoTranslationVO('pt', 'Título', 'Descrição'),
        new VideoTranslationVO('it', 'Titolo', 'Descrizione'),
        new VideoTranslationVO('es', 'Título', 'Descripción'),
      ],
    });
    const translations = [
      { locale: 'pt' as const, title: 'Título', description: 'Descrição' },
      { locale: 'it' as const, title: 'Titolo', description: 'Descrizione' },
      { locale: 'es' as const, title: 'Título', description: 'Descripción' },
    ];
    await videoRepository.create('lesson-123', video, translations);

    const result = await sut.execute({
      videoId: video.id.toString(),
      imageUrl: 'https://example.com/new.jpg',
      durationInSeconds: 200,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.message).toBe('Video updated successfully');
    }
    const updatedVideo = await videoRepository.findById(video.id.toString());
    expect(updatedVideo.isRight()).toBe(true);
    if (updatedVideo.isRight()) {
      expect(updatedVideo.value.video.imageUrl).toBe(
        'https://example.com/new.jpg',
      );
      expect(updatedVideo.value.video.durationInSeconds).toBe(200);
      expect(updatedVideo.value.video.providerVideoId).toBe('old-provider-id');
      expect(updatedVideo.value.video.slug).toBe('test-video');
    }
  });

  it('should update video translations', async () => {
    const video = Video.create({
      slug: 'test-video',
      imageUrl: undefined,
      providerVideoId: 'provider123',
      durationInSeconds: 300,
      lessonId: 'lesson-123',
      translations: [
        new VideoTranslationVO('pt', 'Título Antigo', 'Descrição Antiga'),
        new VideoTranslationVO('it', 'Titolo Vecchio', 'Descrizione Vecchia'),
        new VideoTranslationVO('es', 'Título Viejo', 'Descripción Vieja'),
      ],
    });
    const translations = [
      {
        locale: 'pt' as const,
        title: 'Título Antigo',
        description: 'Descrição Antiga',
      },
      {
        locale: 'it' as const,
        title: 'Titolo Vecchio',
        description: 'Descrizione Vecchia',
      },
      {
        locale: 'es' as const,
        title: 'Título Viejo',
        description: 'Descripción Vieja',
      },
    ];
    await videoRepository.create('lesson-123', video, translations);

    const result = await sut.execute({
      videoId: video.id.toString(),
      translations: [
        { locale: 'pt', title: 'Novo Título', description: 'Nova Descrição' },
        {
          locale: 'it',
          title: 'Nuovo Titolo',
          description: 'Nuova Descrizione',
        },
        {
          locale: 'es',
          title: 'Nuevo Título',
          description: 'Nueva Descripción',
        },
      ],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.message).toBe('Video updated successfully');
    }
    const updatedVideo = await videoRepository.findById(video.id.toString());
    expect(updatedVideo.isRight()).toBe(true);
    if (updatedVideo.isRight()) {
      const translations = updatedVideo.value.translations;
      expect(translations?.find((t) => t.locale === 'pt')?.title).toBe(
        'Novo Título',
      );
      expect(translations?.find((t) => t.locale === 'it')?.title).toBe(
        'Nuovo Titolo',
      );
      expect(translations?.find((t) => t.locale === 'es')?.title).toBe(
        'Nuevo Título',
      );
    }
  });

  it('should update video lesson association', async () => {
    const lesson = Lesson.create({
      slug: 'test-lesson',
      moduleId: 'module-123',
      order: 1,
      imageUrl: 'https://example.com/lesson.jpg',
      flashcardIds: [],
      commentIds: [],
      translations: [
        { locale: 'pt', title: 'Aula', description: 'Descrição' },
        { locale: 'it', title: 'Lezione', description: 'Descrizione' },
        { locale: 'es', title: 'Lección', description: 'Descripción' },
      ],
    });
    await lessonRepository.create(lesson);

    const video = Video.create({
      slug: 'test-video',
      imageUrl: undefined,
      providerVideoId: 'provider123',
      durationInSeconds: 300,
      lessonId: undefined,
      translations: [
        new VideoTranslationVO('pt', 'Título', 'Descrição'),
        new VideoTranslationVO('it', 'Titolo', 'Descrizione'),
        new VideoTranslationVO('es', 'Título', 'Descripción'),
      ],
    });
    const translations = [
      { locale: 'pt' as const, title: 'Título', description: 'Descrição' },
      { locale: 'it' as const, title: 'Titolo', description: 'Descrizione' },
      { locale: 'es' as const, title: 'Título', description: 'Descripción' },
    ];
    await videoRepository.create('old-lesson-123', video, translations);

    const result = await sut.execute({
      videoId: video.id.toString(),
      lessonId: lesson.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.message).toBe('Video updated successfully');
    }
    const updatedVideo = await videoRepository.findById(video.id.toString());
    expect(updatedVideo.isRight()).toBe(true);
    if (updatedVideo.isRight()) {
      expect(updatedVideo.value.video.lessonId).toBe(lesson.id.toString());
    }
  });

  it('should remove video lesson association when null is provided', async () => {
    const video = Video.create({
      slug: 'test-video',
      imageUrl: undefined,
      providerVideoId: 'provider123',
      durationInSeconds: 300,
      lessonId: 'lesson-123',
      translations: [
        new VideoTranslationVO('pt', 'Título', 'Descrição'),
        new VideoTranslationVO('it', 'Titolo', 'Descrizione'),
        new VideoTranslationVO('es', 'Título', 'Descripción'),
      ],
    });
    const translations = [
      { locale: 'pt' as const, title: 'Título', description: 'Descrição' },
      { locale: 'it' as const, title: 'Titolo', description: 'Descrizione' },
      { locale: 'es' as const, title: 'Título', description: 'Descripción' },
    ];
    await videoRepository.create('lesson-123', video, translations);

    const result = await sut.execute({
      videoId: video.id.toString(),
      lessonId: null,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.message).toBe('Video updated successfully');
    }
    const updatedVideo = await videoRepository.findById(video.id.toString());
    expect(updatedVideo.isRight()).toBe(true);
    if (updatedVideo.isRight()) {
      expect(updatedVideo.value.video.lessonId).toBeUndefined();
    }
  });

  it('should update multiple fields at once', async () => {
    const lesson = Lesson.create({
      slug: 'test-lesson',
      moduleId: 'module-123',
      order: 1,
      imageUrl: undefined,
      flashcardIds: [],
      commentIds: [],
      translations: [
        { locale: 'pt', title: 'Aula', description: 'Descrição' },
        { locale: 'it', title: 'Lezione', description: 'Descrizione' },
        { locale: 'es', title: 'Lección', description: 'Descripción' },
      ],
    });
    await lessonRepository.create(lesson);

    const video = Video.create({
      slug: 'old-slug',
      imageUrl: 'https://example.com/old.jpg',
      providerVideoId: 'old-provider',
      durationInSeconds: 100,
      lessonId: undefined,
      translations: [
        new VideoTranslationVO('pt', 'Título Antigo', 'Descrição Antiga'),
        new VideoTranslationVO('it', 'Titolo Vecchio', 'Descrizione Vecchia'),
        new VideoTranslationVO('es', 'Título Viejo', 'Descripción Vieja'),
      ],
    });
    const oldTranslations = [
      {
        locale: 'pt' as const,
        title: 'Título Antigo',
        description: 'Descrição Antiga',
      },
      {
        locale: 'it' as const,
        title: 'Titolo Vecchio',
        description: 'Descrizione Vecchia',
      },
      {
        locale: 'es' as const,
        title: 'Título Viejo',
        description: 'Descripción Vieja',
      },
    ];
    await videoRepository.create('old-lesson-123', video, oldTranslations);

    const result = await sut.execute({
      videoId: video.id.toString(),
      slug: 'new-slug',
      imageUrl: 'https://example.com/new.jpg',
      providerVideoId: 'new-provider',
      durationInSeconds: 500,
      lessonId: lesson.id.toString(),
      translations: [
        { locale: 'pt', title: 'Novo Título', description: 'Nova Descrição' },
        {
          locale: 'it',
          title: 'Nuovo Titolo',
          description: 'Nuova Descrizione',
        },
        {
          locale: 'es',
          title: 'Nuevo Título',
          description: 'Nueva Descripción',
        },
      ],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.message).toBe('Video updated successfully');
    }
    const updatedVideo = await videoRepository.findById(video.id.toString());
    expect(updatedVideo.isRight()).toBe(true);
    if (updatedVideo.isRight()) {
      expect(updatedVideo.value.video.slug).toBe('new-slug');
      expect(updatedVideo.value.video.imageUrl).toBe(
        'https://example.com/new.jpg',
      );
      expect(updatedVideo.value.video.providerVideoId).toBe('new-provider');
      expect(updatedVideo.value.video.durationInSeconds).toBe(500);
      expect(updatedVideo.value.video.lessonId).toBe(lesson.id.toString());
      expect(
        updatedVideo.value.video.translations.find((t) => t.locale === 'pt')
          ?.title,
      ).toBe('Novo Título');
    }
  });

  it('should return error when video ID is not UUID', async () => {
    const result = await sut.execute({
      videoId: 'invalid-id',
      slug: 'new-slug',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should return error when no update fields are provided', async () => {
    const result = await sut.execute({
      videoId: '123e4567-e89b-12d3-a456-426614174000',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should return error when video does not exist', async () => {
    const result = await sut.execute({
      videoId: '123e4567-e89b-12d3-a456-426614174000',
      slug: 'new-slug',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(VideoNotFoundError);
    }
  });

  it('should return error when new slug is already taken by another video', async () => {
    const video1 = Video.create({
      slug: 'existing-slug',
      imageUrl: undefined,
      providerVideoId: 'provider1',
      durationInSeconds: 100,
      lessonId: 'lesson-123',
      translations: [
        new VideoTranslationVO('pt', 'Título 1', 'Descrição 1'),
        new VideoTranslationVO('it', 'Titolo 1', 'Descrizione 1'),
        new VideoTranslationVO('es', 'Título 1', 'Descripción 1'),
      ],
    });
    const translations1 = [
      { locale: 'pt' as const, title: 'Título 1', description: 'Descrição 1' },
      {
        locale: 'it' as const,
        title: 'Titolo 1',
        description: 'Descrizione 1',
      },
      {
        locale: 'es' as const,
        title: 'Título 1',
        description: 'Descripción 1',
      },
    ];
    await videoRepository.create('lesson-123', video1, translations1);

    const video2 = Video.create({
      slug: 'current-slug',
      imageUrl: undefined,
      providerVideoId: 'provider2',
      durationInSeconds: 200,
      lessonId: 'lesson-123',
      translations: [
        new VideoTranslationVO('pt', 'Título 2', 'Descrição 2'),
        new VideoTranslationVO('it', 'Titolo 2', 'Descrizione 2'),
        new VideoTranslationVO('es', 'Título 2', 'Descripción 2'),
      ],
    });
    const translations2 = [
      { locale: 'pt' as const, title: 'Título 2', description: 'Descrição 2' },
      {
        locale: 'it' as const,
        title: 'Titolo 2',
        description: 'Descrizione 2',
      },
      {
        locale: 'es' as const,
        title: 'Título 2',
        description: 'Descripción 2',
      },
    ];
    await videoRepository.create('lesson-123', video2, translations2);

    const result = await sut.execute({
      videoId: video2.id.toString(),
      slug: 'existing-slug',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DuplicateVideoError);
    }
  });

  it('should return error when lesson does not exist', async () => {
    const video = Video.create({
      slug: 'test-video',
      imageUrl: undefined,
      providerVideoId: 'provider123',
      durationInSeconds: 300,
      lessonId: 'lesson-123',
      translations: [
        new VideoTranslationVO('pt', 'Título', 'Descrição'),
        new VideoTranslationVO('it', 'Titolo', 'Descrizione'),
        new VideoTranslationVO('es', 'Título', 'Descripción'),
      ],
    });
    const translations = [
      { locale: 'pt' as const, title: 'Título', description: 'Descrição' },
      { locale: 'it' as const, title: 'Titolo', description: 'Descrizione' },
      { locale: 'es' as const, title: 'Título', description: 'Descripción' },
    ];
    await videoRepository.create('lesson-123', video, translations);

    const result = await sut.execute({
      videoId: video.id.toString(),
      lessonId: '123e4567-e89b-12d3-a456-426614174000',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(LessonNotFoundError);
    }
  });

  it('should return error when slug format is invalid', async () => {
    const result = await sut.execute({
      videoId: '123e4567-e89b-12d3-a456-426614174000',
      slug: 'Invalid Slug!',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should return error when imageUrl is invalid', async () => {
    const result = await sut.execute({
      videoId: '123e4567-e89b-12d3-a456-426614174000',
      imageUrl: 'not-a-url',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should return error when duration is not positive', async () => {
    const result = await sut.execute({
      videoId: '123e4567-e89b-12d3-a456-426614174000',
      durationInSeconds: 0,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should return error when translations are incomplete', async () => {
    const result = await sut.execute({
      videoId: '123e4567-e89b-12d3-a456-426614174000',
      translations: [
        { locale: 'pt', title: 'Título', description: 'Descrição' },
        { locale: 'it', title: 'Titolo', description: 'Descrizione' },
      ],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should return error when translations have invalid locale', async () => {
    const result = await sut.execute({
      videoId: '123e4567-e89b-12d3-a456-426614174000',
      translations: [
        { locale: 'pt', title: 'Título', description: 'Descrição' },
        { locale: 'it', title: 'Titolo', description: 'Descrizione' },
        { locale: 'fr' as any, title: 'Titre', description: 'Description' },
      ],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should return error when translations have duplicate locales', async () => {
    const result = await sut.execute({
      videoId: '123e4567-e89b-12d3-a456-426614174000',
      translations: [
        { locale: 'pt', title: 'Título 1', description: 'Descrição 1' },
        { locale: 'pt', title: 'Título 2', description: 'Descrição 2' },
        { locale: 'es', title: 'Título', description: 'Descripción' },
      ],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should return error when translation title is empty', async () => {
    const result = await sut.execute({
      videoId: '123e4567-e89b-12d3-a456-426614174000',
      translations: [
        { locale: 'pt', title: '', description: 'Descrição' },
        { locale: 'it', title: 'Titolo', description: 'Descrizione' },
        { locale: 'es', title: 'Título', description: 'Descripción' },
      ],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should return error when translation description is empty', async () => {
    const result = await sut.execute({
      videoId: '123e4567-e89b-12d3-a456-426614174000',
      translations: [
        { locale: 'pt', title: 'Título', description: '' },
        { locale: 'it', title: 'Titolo', description: 'Descrizione' },
        { locale: 'es', title: 'Título', description: 'Descripción' },
      ],
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should allow updating the same video with its current slug', async () => {
    const video = Video.create({
      slug: 'current-slug',
      imageUrl: undefined,
      providerVideoId: 'provider123',
      durationInSeconds: 300,
      lessonId: 'lesson-123',
      translations: [
        new VideoTranslationVO('pt', 'Título', 'Descrição'),
        new VideoTranslationVO('it', 'Titolo', 'Descrizione'),
        new VideoTranslationVO('es', 'Título', 'Descripción'),
      ],
    });
    const translations = [
      { locale: 'pt' as const, title: 'Título', description: 'Descrição' },
      { locale: 'it' as const, title: 'Titolo', description: 'Descrizione' },
      { locale: 'es' as const, title: 'Título', description: 'Descripción' },
    ];
    await videoRepository.create('lesson-123', video, translations);

    const result = await sut.execute({
      videoId: video.id.toString(),
      slug: 'current-slug',
      durationInSeconds: 400,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.message).toBe('Video updated successfully');
    }
    const updatedVideo = await videoRepository.findById(video.id.toString());
    expect(updatedVideo.isRight()).toBe(true);
    if (updatedVideo.isRight()) {
      expect(updatedVideo.value.video.slug).toBe('current-slug');
      expect(updatedVideo.value.video.durationInSeconds).toBe(400);
    }
  });

  it('should update imageUrl to null when explicitly provided', async () => {
    const video = Video.create({
      slug: 'test-video',
      imageUrl: 'https://example.com/image.jpg',
      providerVideoId: 'provider123',
      durationInSeconds: 300,
      lessonId: 'lesson-123',
      translations: [
        new VideoTranslationVO('pt', 'Título', 'Descrição'),
        new VideoTranslationVO('it', 'Titolo', 'Descrizione'),
        new VideoTranslationVO('es', 'Título', 'Descripción'),
      ],
    });
    const translations = [
      { locale: 'pt' as const, title: 'Título', description: 'Descrição' },
      { locale: 'it' as const, title: 'Titolo', description: 'Descrizione' },
      { locale: 'es' as const, title: 'Título', description: 'Descripción' },
    ];
    await videoRepository.create('lesson-123', video, translations);

    const result = await sut.execute({
      videoId: video.id.toString(),
      imageUrl: null,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.message).toBe('Video updated successfully');
    }
    const updatedVideo = await videoRepository.findById(video.id.toString());
    expect(updatedVideo.isRight()).toBe(true);
    if (updatedVideo.isRight()) {
      expect(updatedVideo.value.video.imageUrl).toBeUndefined();
    }
  });

  it('should update updatedAt timestamp after update', async () => {
    const video = Video.create({
      slug: 'test-video',
      imageUrl: undefined,
      providerVideoId: 'provider123',
      durationInSeconds: 300,
      lessonId: 'lesson-123',
      translations: [
        new VideoTranslationVO('pt', 'Título', 'Descrição'),
        new VideoTranslationVO('it', 'Titolo', 'Descrizione'),
        new VideoTranslationVO('es', 'Título', 'Descripción'),
      ],
    });
    const translations = [
      { locale: 'pt' as const, title: 'Título', description: 'Descrição' },
      { locale: 'it' as const, title: 'Titolo', description: 'Descrizione' },
      { locale: 'es' as const, title: 'Título', description: 'Descripción' },
    ];
    await videoRepository.create('lesson-123', video, translations);
    const originalUpdatedAt = video.updatedAt;

    // Wait a bit to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    const result = await sut.execute({
      videoId: video.id.toString(),
      slug: 'updated-slug',
    });

    expect(result.isRight()).toBe(true);
    const updatedVideo = await videoRepository.findById(video.id.toString());
    expect(updatedVideo.isRight()).toBe(true);
    if (updatedVideo.isRight()) {
      expect(updatedVideo.value.video.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    }
  });
});
