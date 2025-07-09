import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ListLessonsUseCase } from './list-lessons.use-case';
import { IModuleRepository } from '../repositories/i-module-repository';
import { ILessonRepository } from '../repositories/i-lesson-repository';
import { IVideoRepository } from '../repositories/i-video-repository';
import { InvalidInputError } from './errors/invalid-input-error';
import { ModuleNotFoundError } from './errors/module-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { ListLessonsRequest } from '../dtos/list-lessons-request.dto';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left, right } from '@/core/either';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { Module } from '@/domain/course-catalog/enterprise/entities/module.entity';
import { Video } from '@/domain/course-catalog/enterprise/entities/video.entity';

// UUID constants for testing
const VALID_MODULE_ID = '11111111-1111-1111-1111-111111111111';
const NON_EXISTENT_MODULE_ID = '22222222-2222-2222-2222-222222222222';

// Helper: factory for a valid Module instance
const createMockModule = (id = VALID_MODULE_ID): Module => {
  return Module.create(
    {
      slug: 'module-slug',
      translations: [
        {
          locale: 'pt' as const,
          title: 'Module Title',
          description: 'Module Description',
        },
      ],
      order: 1,
      videos: [],
    },
    new UniqueEntityID(id),
  );
};

// Type helper for video repository response
type VideoRepoResponse = {
  video: Video;
  translations: Array<{
    locale: 'pt' | 'it' | 'es';
    title: string;
    description: string;
  }>;
};

// Factories for other entities
const createVideoRepoResponse = (video: Video): VideoRepoResponse => ({
  video,
  translations: [
    {
      locale: 'pt' as const,
      title: 'Video Title',
      description: 'Video Description',
    },
  ],
});

const createMockLesson = (
  id: string = 'lesson-1',
  moduleId: string = VALID_MODULE_ID,
  videoId?: string,
): Lesson => {
  const video = videoId
    ? {
        id: videoId,
        slug: `video-${videoId}`,
        imageUrl: 'https://example.com/video.jpg',
        providerVideoId: `panda-${videoId}`,
        durationInSeconds: 300,
        translations: [
          {
            locale: 'pt' as const,
            title: 'Video Title',
            description: 'Video Description',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    : undefined;

  return Lesson.create(
    {
      slug: `lesson-${id}`,
      moduleId,
      order: 1,
      flashcardIds: [],
      commentIds: [],
      translations: [
        {
          locale: 'pt' as const,
          title: 'Lesson Title',
          description: 'Lesson Description',
        },
      ],
      videos: [],
      documents: [],
      assessments: [],
      video,
    },
    new UniqueEntityID(id),
  );
};

const createMockVideo = (id = 'video-1'): Video => {
  const mockVideo = {
    id: new UniqueEntityID(id),
    slug: 'video-slug',
    title: 'Video Title',
    providerVideoId: 'provider-123',
    durationInSeconds: 300,
    isSeen: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return mockVideo as unknown as Video;
};

describe('ListLessonsUseCase', () => {
  let useCase: ListLessonsUseCase;
  let moduleRepo: IModuleRepository;
  let lessonRepo: ILessonRepository;
  let videoRepo: IVideoRepository;

  beforeEach(async () => {
    const moduleRepoMock = { findById: vi.fn() };
    const lessonRepoMock = { findByModuleId: vi.fn() };
    const videoRepoMock = { findById: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListLessonsUseCase,
        { provide: 'ModuleRepository', useValue: moduleRepoMock },
        { provide: 'LessonRepository', useValue: lessonRepoMock },
        { provide: 'VideoRepository', useValue: videoRepoMock },
      ],
    }).compile();

    useCase = module.get(ListLessonsUseCase);
    moduleRepo = module.get('ModuleRepository');
    lessonRepo = module.get('LessonRepository');
    videoRepo = module.get('VideoRepository');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('returns InvalidInputError for missing moduleId', async () => {
      const request: ListLessonsRequest = {
        moduleId: '',
        page: 1,
        limit: 10,
        includeVideo: false,
      };
      const result = await useCase.execute(request);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('returns InvalidInputError for invalid page', async () => {
      const request: ListLessonsRequest = {
        moduleId: VALID_MODULE_ID,
        page: 0,
        limit: 10,
        includeVideo: false,
      };
      const result = await useCase.execute(request);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('returns InvalidInputError for invalid limit', async () => {
      const request: ListLessonsRequest = {
        moduleId: VALID_MODULE_ID,
        page: 1,
        limit: 0,
        includeVideo: false,
      };
      const result = await useCase.execute(request);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });
  });

  describe('Module Validation', () => {
    it('returns ModuleNotFoundError when module not found', async () => {
      const request: ListLessonsRequest = {
        moduleId: NON_EXISTENT_MODULE_ID,
        page: 1,
        limit: 10,
        includeVideo: false,
      };
      vi.mocked(moduleRepo.findById).mockResolvedValue(
        left(new Error('Module not found')),
      );
      const result = await useCase.execute(request);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ModuleNotFoundError);
      expect(moduleRepo.findById).toHaveBeenCalledWith(NON_EXISTENT_MODULE_ID);
    });
  });

  describe('Repository Errors', () => {
    it('returns RepositoryError when lessonRepo fails', async () => {
      const request: ListLessonsRequest = {
        moduleId: VALID_MODULE_ID,
        page: 1,
        limit: 10,
        includeVideo: false,
      };
      const mockModule = createMockModule();
      vi.mocked(moduleRepo.findById).mockResolvedValue(right(mockModule));
      vi.mocked(lessonRepo.findByModuleId).mockResolvedValue(
        left(new Error('DB error')),
      );

      const result = await useCase.execute(request);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect((result.value as RepositoryError).message).toBe('DB error');
    });
  });

  describe('Success Cases', () => {
    it('lessons without video when includeVideo=false', async () => {
      const request: ListLessonsRequest = {
        moduleId: VALID_MODULE_ID,
        page: 1,
        limit: 2,
        includeVideo: false,
      };
      const mockModule = createMockModule();
      const mockLessons = [createMockLesson('l1'), createMockLesson('l2')];

      vi.mocked(moduleRepo.findById).mockResolvedValue(right(mockModule));
      vi.mocked(lessonRepo.findByModuleId).mockResolvedValue(
        right({ lessons: mockLessons, total: 5 }),
      );

      const result = await useCase.execute(request);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const res = result.value;
        expect(res.lessons).toHaveLength(2);
        expect(res.lessons[0].video).toBeUndefined();
        expect(res.pagination.total).toBe(5);
        expect(res.pagination.totalPages).toBe(3);
        expect(res.pagination.hasNext).toBe(true);
        expect(res.pagination.hasPrevious).toBe(false);
      }

      expect(lessonRepo.findByModuleId).toHaveBeenCalledWith(
        VALID_MODULE_ID,
        2,
        0,
      );
      expect(videoRepo.findById).not.toHaveBeenCalled();
    });

    it('lessons with video when includeVideo=true', async () => {
      const request: ListLessonsRequest = {
        moduleId: VALID_MODULE_ID,
        page: 1,
        limit: 2,
        includeVideo: true,
      };
      const mockModule = createMockModule();
      const lessons = [
        createMockLesson('l1', VALID_MODULE_ID, 'v1'),
        createMockLesson('l2', VALID_MODULE_ID, 'v2'),
      ];

      vi.mocked(moduleRepo.findById).mockResolvedValue(right(mockModule));
      vi.mocked(lessonRepo.findByModuleId).mockResolvedValue(
        right({ lessons, total: 2 }),
      );

      const result = await useCase.execute(request);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const res = result.value;
        expect(res.lessons[0].video?.id).toBe('v1');
        expect(res.lessons[1].video?.id).toBe('v2');
        expect(res.lessons[0].video?.title).toBe('Video Title');
        expect(res.lessons[1].video?.title).toBe('Video Title');
      }

      // Video repository should not be called since videos are in lesson entity
      expect(videoRepo.findById).not.toHaveBeenCalled();
    });

    it('handles missing videoId gracefully', async () => {
      const request: ListLessonsRequest = {
        moduleId: VALID_MODULE_ID,
        page: 1,
        limit: 2,
        includeVideo: true,
      };
      const mockModule = createMockModule();
      const lessons = [
        createMockLesson('l1'), // No video
        createMockLesson('l2', VALID_MODULE_ID, 'v2'), // With video
      ];

      vi.mocked(moduleRepo.findById).mockResolvedValue(right(mockModule));
      vi.mocked(lessonRepo.findByModuleId).mockResolvedValue(
        right({ lessons, total: 2 }),
      );

      const result = await useCase.execute(request);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const res = result.value;
        expect(res.lessons[0].video).toBeUndefined();
        expect(res.lessons[1].video?.id).toBe('v2');
      }

      // Video repository should not be called since videos are in lesson entity
      expect(videoRepo.findById).not.toHaveBeenCalled();
    });

    it('handles lessons with video data already in entity', async () => {
      const request: ListLessonsRequest = {
        moduleId: VALID_MODULE_ID,
        page: 1,
        limit: 1,
        includeVideo: true,
      };
      const mockModule = createMockModule();
      const lessons = [createMockLesson('l1', VALID_MODULE_ID, 'v1')];

      vi.mocked(moduleRepo.findById).mockResolvedValue(right(mockModule));
      vi.mocked(lessonRepo.findByModuleId).mockResolvedValue(
        right({ lessons, total: 1 }),
      );

      const result = await useCase.execute(request);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.lessons[0].video?.id).toBe('v1');
        expect(result.value.lessons[0].video?.title).toBe('Video Title');
      }

      // Video repository should not be called since videos are in lesson entity
      expect(videoRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('calculates correct pagination for page 2', async () => {
      const request: ListLessonsRequest = {
        moduleId: VALID_MODULE_ID,
        page: 2,
        limit: 3,
        includeVideo: false,
      };
      const mockModule = createMockModule();
      const lessons = [
        createMockLesson('l4'),
        createMockLesson('l5'),
        createMockLesson('l6'),
      ];

      vi.mocked(moduleRepo.findById).mockResolvedValue(right(mockModule));
      vi.mocked(lessonRepo.findByModuleId).mockResolvedValue(
        right({ lessons, total: 10 }),
      );

      const result = await useCase.execute(request);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const p = result.value.pagination;
        expect(p.page).toBe(2);
        expect(p.limit).toBe(3);
        expect(p.total).toBe(10);
        expect(p.totalPages).toBe(4);
        expect(p.hasNext).toBe(true);
        expect(p.hasPrevious).toBe(true);
      }

      expect(lessonRepo.findByModuleId).toHaveBeenCalledWith(
        VALID_MODULE_ID,
        3,
        3,
      );
    });

    it('handles last page correctly', async () => {
      const request: ListLessonsRequest = {
        moduleId: VALID_MODULE_ID,
        page: 4,
        limit: 3,
        includeVideo: false,
      };
      const mockModule = createMockModule();
      const lessons = [createMockLesson('l10')];

      vi.mocked(moduleRepo.findById).mockResolvedValue(right(mockModule));
      vi.mocked(lessonRepo.findByModuleId).mockResolvedValue(
        right({ lessons, total: 10 }),
      );

      const result = await useCase.execute(request);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const p = result.value.pagination;
        expect(p.page).toBe(4);
        expect(p.totalPages).toBe(4);
        expect(p.hasNext).toBe(false);
        expect(p.hasPrevious).toBe(true);
      }
    });

    it('handles empty results', async () => {
      const request: ListLessonsRequest = {
        moduleId: VALID_MODULE_ID,
        page: 1,
        limit: 10,
        includeVideo: false,
      };
      const mockModule = createMockModule();

      vi.mocked(moduleRepo.findById).mockResolvedValue(right(mockModule));
      vi.mocked(lessonRepo.findByModuleId).mockResolvedValue(
        right({ lessons: [], total: 0 }),
      );

      const result = await useCase.execute(request);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const p = result.value.pagination;
        expect(result.value.lessons).toHaveLength(0);
        expect(p.total).toBe(0);
        expect(p.totalPages).toBe(0);
        expect(p.hasNext).toBe(false);
        expect(p.hasPrevious).toBe(false);
      }
    });
  });

  describe('Data Mapping', () => {
    it('maps lesson entity to DTO correctly', async () => {
      const request: ListLessonsRequest = {
        moduleId: VALID_MODULE_ID,
        page: 1,
        limit: 1,
        includeVideo: false,
      };
      const mockModule = createMockModule();
      const mockLesson = createMockLesson('lesson-1');

      vi.mocked(moduleRepo.findById).mockResolvedValue(right(mockModule));
      vi.mocked(lessonRepo.findByModuleId).mockResolvedValue(
        right({ lessons: [mockLesson], total: 1 }),
      );

      const result = await useCase.execute(request);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const dto = result.value.lessons[0];
        expect(dto.id).toBe('lesson-1');
        expect(dto.moduleId).toBe(VALID_MODULE_ID);
        expect(dto.videoId).toBeUndefined();
        expect(dto.translations).toEqual(mockLesson.translations);
        expect(dto.createdAt).toBe(mockLesson.createdAt);
        expect(dto.updatedAt).toBe(mockLesson.updatedAt);
      }
    });
  });
});
