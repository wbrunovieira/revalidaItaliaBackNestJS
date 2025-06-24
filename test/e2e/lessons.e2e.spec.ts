// src/test/lessons.e2e.spec.ts
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('LessonController (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let courseId: string;
  let moduleId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Limpa todas as tabelas na ordem correta
    await prisma.lessonTranslation.deleteMany();
    await prisma.video.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.moduleTranslation.deleteMany();
    await prisma.module.deleteMany();
    await prisma.courseTranslation.deleteMany();
    await prisma.course.deleteMany();

    // Cria um curso
    const course = await prisma.course.create({
      data: {
        slug: 'test-course',
        translations: {
          create: [
            { locale: 'pt', title: 'Curso PT', description: 'Desc PT' },
            { locale: 'it', title: 'Corso IT', description: 'Desc IT' },
            { locale: 'es', title: 'Curso ES', description: 'Desc ES' },
          ],
        },
      },
    });
    courseId = course.id;

    // Cria um módulo
    const module = await prisma.module.create({
      data: {
        slug: 'test-module',
        order: 1,
        courseId,
        translations: {
          create: [
            { locale: 'pt', title: 'Módulo PT', description: 'Desc PT' },
            { locale: 'it', title: 'Modulo IT', description: 'Desc IT' },
            { locale: 'es', title: 'Modulo ES', description: 'Desc ES' },
          ],
        },
      },
    });
    moduleId = module.id;
  });

  const endpoint = () => `/courses/${courseId}/modules/${moduleId}/lessons`;

  describe('[POST] create lesson', () => {
    it('should create lesson successfully without video', async () => {
      const payload = {
        translations: [
          { locale: 'pt', title: 'Aula PT', description: 'Desc PT' },
          { locale: 'it', title: 'Lezione IT', description: 'Desc IT' },
          { locale: 'es', title: 'Lección ES', description: 'Desc ES' },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          moduleId,
          translations: payload.translations,
        }),
      );
      expect(res.body).not.toHaveProperty('videoId');
    });

    it('should return 400 when missing translation locale pt', async () => {
      const payload = {
        translations: [
          { locale: 'it', title: 'Lezione IT', description: 'Desc IT' },
          { locale: 'es', title: 'Lección ES', description: 'Desc ES' },
        ],
      };
      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(400);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: expect.arrayContaining(['translations']),
            code: 'too_small',
          }),
        ]),
      );
    });

    it('should return 400 on unsupported locale', async () => {
      const payload = {
        translations: [
          { locale: 'pt', title: 'Aula PT', description: 'Desc PT' },
          { locale: 'en' as any, title: 'Lesson EN', description: 'Desc EN' },
          { locale: 'es', title: 'Lección ES', description: 'Desc ES' },
        ],
      };
      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'invalid_enum_value',
            path: expect.arrayContaining(['translations', 1, 'locale']),
          }),
        ]),
      );
    });

    it('should return 400 on empty translations array', async () => {
      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send({ translations: [] });

      expect(res.status).toBe(400);
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'too_small',
            path: expect.arrayContaining(['translations']),
          }),
        ]),
      );
    });

    it('should return 400 on invalid moduleId format', async () => {
      const badModuleId = 'invalid-uuid';
      const res = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules/${badModuleId}/lessons`)
        .send({
          translations: [
            { locale: 'pt', title: 'Aula PT', description: 'Desc PT' },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('should return 404 when module not found', async () => {
      const nonExistentModuleId = '00000000-0000-0000-0000-000000000000';
      const payload = {
        translations: [
          { locale: 'pt', title: 'Aula PT', description: 'Desc PT' },
          { locale: 'it', title: 'Lezione IT', description: 'Desc IT' },
          { locale: 'es', title: 'Lección ES', description: 'Desc ES' },
        ],
      };
      const res = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules/${nonExistentModuleId}/lessons`)
        .send(payload);

      expect(res.status).toBe(404);
    });
  });

  describe('[GET] list lessons', () => {
    let baseLessonId: string;

    beforeEach(async () => {
      const lesson = await prisma.lesson.create({
        data: {
          moduleId,
          translations: {
            create: [
              { locale: 'pt', title: 'Aula 1 PT', description: 'Desc PT' },
              { locale: 'it', title: 'Lezione 1 IT', description: 'Desc IT' },
              { locale: 'es', title: 'Lección 1 ES', description: 'Desc ES' },
            ],
          },
        },
      });
      baseLessonId = lesson.id;
    });

    it('should list lessons with default pagination', async () => {
      const res = await request(app.getHttpServer()).get(endpoint());
      expect(res.status).toBe(200);
      expect(res.body.lessons).toHaveLength(1);
      expect(res.body.pagination).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        }),
      );
    });

    it('should support pagination params', async () => {
      const res = await request(app.getHttpServer())
        .get(endpoint())
        .query({ page: 1, limit: 1 });
      expect(res.status).toBe(200);
      expect(res.body.lessons).toHaveLength(1);
    });

    it('should return 400 on invalid query params', async () => {
      const res = await request(app.getHttpServer())
        .get(endpoint())
        .query({ page: '0', limit: '-1' });
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent module', async () => {
      const res = await request(app.getHttpServer()).get(
        `/courses/${courseId}/modules/00000000-0000-0000-0000-000000000000/lessons`,
      );
      expect(res.status).toBe(404);
    });
  });

  describe('[GET] get specific lesson', () => {
    it('should return lesson successfully with all fields', async () => {
      // Create lesson for this specific test
      const lesson = await prisma.lesson.create({
        data: {
          moduleId,
          imageUrl: '/images/lesson-test.jpg',
          flashcardIds: ['flashcard-1', 'flashcard-2'],
          quizIds: ['quiz-1'],
          commentIds: ['comment-1', 'comment-2'],
          translations: {
            create: [
              {
                locale: 'pt',
                title: 'Aula Específica PT',
                description: 'Descrição detalhada PT',
              },
              {
                locale: 'it',
                title: 'Lezione Specifica IT',
                description: 'Descrizione dettagliata IT',
              },
              {
                locale: 'es',
                title: 'Lección Específica ES',
                description: 'Descripción detallada ES',
              },
            ],
          },
        },
      });

      const res = await request(app.getHttpServer()).get(
        `${endpoint()}/${lesson.id}`,
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          id: lesson.id,
          moduleId,
          imageUrl: '/images/lesson-test.jpg',
          flashcardIds: ['flashcard-1', 'flashcard-2'],
          quizIds: ['quiz-1'],
          commentIds: ['comment-1', 'comment-2'],
          translations: [
            {
              locale: 'pt',
              title: 'Aula Específica PT',
              description: 'Descrição detalhada PT',
            },
            {
              locale: 'it',
              title: 'Lezione Specifica IT',
              description: 'Descrizione dettagliata IT',
            },
            {
              locale: 'es',
              title: 'Lección Específica ES',
              description: 'Descripción detallada ES',
            },
          ],
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      expect(res.body).not.toHaveProperty('videoId');
    });

    it('should return lesson with video when videoId is present', async () => {
      // Create a second module for this test to avoid unique constraint violation
      const moduleForVideo = await prisma.module.create({
        data: {
          slug: 'test-module-video',
          order: 2,
          courseId,
          translations: {
            create: [
              {
                locale: 'pt',
                title: 'Módulo Video PT',
                description: 'Desc PT',
              },
            ],
          },
        },
      });

      const lessonWithVideo = await prisma.lesson.create({
        data: {
          moduleId: moduleForVideo.id, // Use the new module
          videoId: 'video-123',
          imageUrl: '/images/lesson-video.jpg',
          flashcardIds: [],
          quizIds: [],
          commentIds: [],
          translations: {
            create: [
              {
                locale: 'pt',
                title: 'Aula com Vídeo PT',
                description: 'Com vídeo',
              },
            ],
          },
        },
      });

      const res = await request(app.getHttpServer()).get(
        `/courses/${courseId}/modules/${moduleForVideo.id}/lessons/${lessonWithVideo.id}`,
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          id: lessonWithVideo.id,
          moduleId: moduleForVideo.id,
          videoId: 'video-123',
          imageUrl: '/images/lesson-video.jpg',
          flashcardIds: [],
          quizIds: [],
          commentIds: [],
          translations: [
            {
              locale: 'pt',
              title: 'Aula com Vídeo PT',
              description: 'Com vídeo',
            },
          ],
        }),
      );
    });

    it('should return lesson with minimal data when optional fields are empty', async () => {
      // Create lesson with minimal data
      const minimalLesson = await prisma.lesson.create({
        data: {
          moduleId,
          flashcardIds: [],
          quizIds: [],
          commentIds: [],
          translations: {
            create: [
              { locale: 'pt', title: 'Aula Mínima' }, // sem description
            ],
          },
        },
      });

      const res = await request(app.getHttpServer()).get(
        `${endpoint()}/${minimalLesson.id}`,
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          id: minimalLesson.id,
          moduleId,
          flashcardIds: [],
          quizIds: [],
          commentIds: [],
          translations: [{ locale: 'pt', title: 'Aula Mínima' }],
        }),
      );

      // Verificar campos opcionais ausentes
      expect(res.body.videoId).toBeUndefined();
      expect(res.body.imageUrl).toBeUndefined();
      expect(res.body.translations[0].description).toBeUndefined();
    });

    it('should return 404 when lesson not found', async () => {
      const nonExistentLessonId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app.getHttpServer()).get(
        `${endpoint()}/${nonExistentLessonId}`,
      );

      expect(res.status).toBe(404);
      expect(res.body).toEqual(
        expect.objectContaining({
          statusCode: 404,
          message: 'Lesson not found',
        }),
      );
    });

    it('should return 400 when lessonId is not a valid UUID', async () => {
      const invalidLessonId = 'invalid-uuid';
      const res = await request(app.getHttpServer()).get(
        `${endpoint()}/${invalidLessonId}`,
      );

      expect(res.status).toBe(400);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['id'],
            message: expect.stringContaining('ID must be a valid UUID'),
            code: 'invalid_string',
          }),
        ]),
      );
    });

    it('should return lessons list when lessonId is empty', async () => {
      const res = await request(app.getHttpServer()).get(`${endpoint()}/`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('lessons');
      expect(res.body).toHaveProperty('pagination');
    });

    it('should return 404 when module exists but lesson belongs to different module', async () => {
      const otherModule = await prisma.module.create({
        data: {
          slug: 'other-module',
          order: 2,
          courseId,
          translations: {
            create: [
              { locale: 'pt', title: 'Outro Módulo', description: 'Desc' },
            ],
          },
        },
      });

      const lessonInOtherModule = await prisma.lesson.create({
        data: {
          moduleId: otherModule.id,
          flashcardIds: [],
          quizIds: [],
          commentIds: [],
          translations: {
            create: [
              { locale: 'pt', title: 'Aula Outro Módulo', description: 'Desc' },
            ],
          },
        },
      });

      const res = await request(app.getHttpServer()).get(
        `${endpoint()}/${lessonInOtherModule.id}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.moduleId).toBe(otherModule.id);
    });

    it('should return lesson with correct timestamps format', async () => {
      const lesson = await prisma.lesson.create({
        data: {
          moduleId,
          imageUrl: '/images/lesson-test.jpg',
          flashcardIds: ['flashcard-1', 'flashcard-2'],
          quizIds: ['quiz-1'],
          commentIds: ['comment-1', 'comment-2'],
          translations: {
            create: [
              {
                locale: 'pt',
                title: 'Aula Específica PT',
                description: 'Descrição detalhada PT',
              },
              {
                locale: 'it',
                title: 'Lezione Specifica IT',
                description: 'Descrizione dettagliata IT',
              },
              {
                locale: 'es',
                title: 'Lección Específica ES',
                description: 'Descripción detallada ES',
              },
            ],
          },
        },
      });

      const res = await request(app.getHttpServer()).get(
        `${endpoint()}/${lesson.id}`,
      );

      expect(res.status).toBe(200);

      // Verificar formato ISO das datas
      expect(res.body.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(res.body.updatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      // Verificar que são datas válidas
      expect(new Date(res.body.createdAt)).toBeInstanceOf(Date);
      expect(new Date(res.body.updatedAt)).toBeInstanceOf(Date);
    });

    it('should verify all translation locales are returned', async () => {
      // Create lesson for this test
      const lesson = await prisma.lesson.create({
        data: {
          moduleId,
          imageUrl: '/images/lesson-test.jpg',
          flashcardIds: ['flashcard-1', 'flashcard-2'],
          quizIds: ['quiz-1'],
          commentIds: ['comment-1', 'comment-2'],
          translations: {
            create: [
              {
                locale: 'pt',
                title: 'Aula Específica PT',
                description: 'Descrição detalhada PT',
              },
              {
                locale: 'it',
                title: 'Lezione Specifica IT',
                description: 'Descrizione dettagliata IT',
              },
              {
                locale: 'es',
                title: 'Lección Específica ES',
                description: 'Descripción detallada ES',
              },
            ],
          },
        },
      });

      const res = await request(app.getHttpServer()).get(
        `${endpoint()}/${lesson.id}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.translations).toHaveLength(3);

      const locales = res.body.translations.map((t: any) => t.locale);
      expect(locales).toEqual(expect.arrayContaining(['pt', 'it', 'es']));

      // Verificar estrutura de cada tradução
      res.body.translations.forEach((translation: any) => {
        expect(translation).toHaveProperty('locale');
        expect(translation).toHaveProperty('title');
        expect(['pt', 'it', 'es']).toContain(translation.locale);
        expect(typeof translation.title).toBe('string');
        expect(translation.title.length).toBeGreaterThan(0);
      });
    });
  });
});
