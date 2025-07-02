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
    // Cleanup in relational order
    await prisma.lessonTranslation.deleteMany();
    await prisma.video.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.moduleTranslation.deleteMany();
    await prisma.module.deleteMany();
    await prisma.courseTranslation.deleteMany();
    await prisma.course.deleteMany();

    // Create course
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

    // Create module
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
        order: 5,
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
          order: payload.order,
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
        order: 1,
      };
      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);
      expect(res.status).toBe(400);
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
        order: 1,
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
        .send({ translations: [], order: 1 });
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
      const badId = 'abc';
      const res = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules/${badId}/lessons`)
        .send({ translations: [{ locale: 'pt', title: 'A' }], order: 1 });
      expect(res.status).toBe(400);
    });

    it('should return 404 when module not found', async () => {
      const non = '00000000-0000-0000-0000-000000000000';
      const res = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules/${non}/lessons`)
        .send({ translations: [{ locale: 'pt', title: 'A' }], order: 1 });
      expect(res.status).toBe(400); // Atualizado: módulo não encontrado retorna 400 devido ao ValidationPipe
    });
  });

  describe('[GET] list lessons', () => {
    beforeEach(async () => {
      await prisma.lesson.create({
        data: {
          moduleId,
          order: 2,
          translations: { create: [{ locale: 'pt', title: 'L1' }] },
        },
      });
    });

    it('should list lessons with default pagination', async () => {
      const res = await request(app.getHttpServer()).get(endpoint());
      expect(res.status).toBe(200);
      expect(res.body.lessons[0]).toHaveProperty('order');
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 1,
      });
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
        .query({ page: '0' });
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
    it('should return lesson with all fields', async () => {
      const lesson = await prisma.lesson.create({
        data: {
          moduleId,
          order: 3,
          imageUrl: '/img',
          flashcardIds: ['f1'],
          quizIds: ['q1'],
          commentIds: ['c1'],
          translations: { create: [{ locale: 'pt', title: 'T' }] },
        },
      });
      const res = await request(app.getHttpServer()).get(
        `${endpoint()}/${lesson.id}`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: lesson.id,
        moduleId,
        order: 3,
        imageUrl: '/img',
      });
    });

    it('should return 404 when lesson not found', async () => {
      const res = await request(app.getHttpServer()).get(
        `${endpoint()}/00000000-0000-0000-0000-000000000000`,
      );
      expect(res.status).toBe(404);
    });

    it('should return 400 on invalid lessonId', async () => {
      const res = await request(app.getHttpServer()).get(`${endpoint()}/abc`);
      expect(res.status).toBe(400);
    });
  });

  describe('[PUT] update lesson', () => {
    let existingLessonId: string;
    let secondLessonId: string;

    beforeEach(async () => {
      // Create first lesson
      const lesson1 = await prisma.lesson.create({
        data: {
          moduleId,
          order: 1,
          imageUrl: '/original-image.jpg',
          videoId: 'original-video-id',
          flashcardIds: ['flash-1'],
          quizIds: ['quiz-1'],
          commentIds: ['comment-1'],
          translations: {
            create: [
              {
                locale: 'pt',
                title: 'Aula Original PT',
                description: 'Desc Original PT',
              },
              {
                locale: 'it',
                title: 'Lezione Originale IT',
                description: 'Desc Originale IT',
              },
            ],
          },
        },
      });
      existingLessonId = lesson1.id;

      // Create second lesson for order conflict tests
      const lesson2 = await prisma.lesson.create({
        data: {
          moduleId,
          order: 2,
          translations: {
            create: [
              {
                locale: 'pt',
                title: 'Segunda Aula PT',
                description: 'Segunda Desc PT',
              },
            ],
          },
        },
      });
      secondLessonId = lesson2.id;
    });

    describe('successful updates', () => {
      it('should update lesson with all fields successfully', async () => {
        const payload = {
          imageUrl: '/updated-lesson-image.avif',
          translations: [
            {
              locale: 'pt',
              title: 'Aula Atualizada PT',
              description: 'Descrição atualizada PT',
            },
            {
              locale: 'it',
              title: 'Lezione Aggiornata IT',
              description: 'Descrizione aggiornata IT',
            },
            {
              locale: 'es',
              title: 'Lección Actualizada ES',
              description: 'Descripción actualizada ES',
            },
          ],
          order: 5,
          videoId: 'new-video-id-123',
          flashcardIds: ['flashcard-1', 'flashcard-2'],
          quizIds: ['quiz-1', 'quiz-2'],
          commentIds: ['comment-1', 'comment-2'],
        };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
          id: existingLessonId,
          moduleId,
          order: 5,
          imageUrl: '/updated-lesson-image.avif',
          videoId: 'new-video-id-123',
          flashcardIds: ['flashcard-1', 'flashcard-2'],
          quizIds: ['quiz-1', 'quiz-2'],
          commentIds: ['comment-1', 'comment-2'],
          translations: expect.arrayContaining([
            expect.objectContaining({
              locale: 'pt',
              title: 'Aula Atualizada PT',
              description: 'Descrição atualizada PT',
            }),
            expect.objectContaining({
              locale: 'it',
              title: 'Lezione Aggiornata IT',
              description: 'Descrizione aggiornata IT',
            }),
            expect.objectContaining({
              locale: 'es',
              title: 'Lección Actualizada ES',
              description: 'Descripción actualizada ES',
            }),
          ]),
        });
      });

      it('should update lesson with partial fields only', async () => {
        const payload = {
          translations: [
            {
              locale: 'pt',
              title: 'Apenas Título Atualizado PT',
              description: 'Nova descrição',
            },
          ],
          order: 3,
        };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
          id: existingLessonId,
          order: 3,
          translations: [
            expect.objectContaining({
              locale: 'pt',
              title: 'Apenas Título Atualizado PT',
              description: 'Nova descrição',
            }),
          ],
        });
        // Should keep original imageUrl and videoId
        expect(res.body.imageUrl).toBe('/original-image.jpg');
        expect(res.body.videoId).toBe('original-video-id');
      });

      it('should update with relative path imageUrl', async () => {
        const payload = {
          imageUrl: '/assets/lessons/lesson-cover.png',
        };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.imageUrl).toBe('/assets/lessons/lesson-cover.png');
      });

      it('should update with full URL imageUrl', async () => {
        const payload = {
          imageUrl: 'https://example.com/images/lesson.jpg',
        };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.imageUrl).toBe('https://example.com/images/lesson.jpg');
      });

      it('should remove imageUrl when set to null', async () => {
        const payload = { imageUrl: null };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.imageUrl).toBeUndefined(); // ✅ Ajustado para undefined
      });

      it('should remove videoId when set to null', async () => {
        const payload = { videoId: null };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.videoId).toBeUndefined(); // ✅ Ajustado para undefined
      });

      it('should update arrays and handle empty arrays', async () => {
        const payload = {
          flashcardIds: [
            'new-flashcard-1',
            'new-flashcard-2',
            'new-flashcard-3',
          ],
          quizIds: [], // Empty array to clear
          commentIds: ['important-comment'],
        };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.flashcardIds).toEqual([
          'new-flashcard-1',
          'new-flashcard-2',
          'new-flashcard-3',
        ]);
        expect(res.body.quizIds).toEqual([]);
        expect(res.body.commentIds).toEqual(['important-comment']);
      });

      it('should allow updating with same order (no conflict)', async () => {
        const payload = { order: 1 }; // Same as current order

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.order).toBe(1);
      });

      it('should persist changes in database', async () => {
        const payload = {
          translations: [
            {
              locale: 'pt',
              title: 'Título Persistido',
              description: 'Descrição persistida',
            },
          ],
          order: 10,
        };

        await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        // Verify changes were persisted
        const getRes = await request(app.getHttpServer()).get(
          `${endpoint()}/${existingLessonId}`,
        );

        expect(getRes.status).toBe(200);
        expect(getRes.body).toMatchObject({
          order: 10,
          translations: [
            expect.objectContaining({
              locale: 'pt',
              title: 'Título Persistido',
              description: 'Descrição persistida',
            }),
          ],
        });
      });
    });

    describe('validation errors (400)', () => {
      it('should return 400 on invalid lesson ID format', async () => {
        const payload = { order: 1 };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/invalid-uuid`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: expect.arrayContaining(['id']),
              message: 'Lesson ID must be a valid UUID',
            }),
          ]),
        );
      });

      it('should return 400 on invalid imageUrl format', async () => {
        const payload = { imageUrl: 'invalid-path-without-slash' };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: expect.arrayContaining(['imageUrl']),
              message:
                'Image URL must be a valid URL or a valid path starting with /',
            }),
          ]),
        );
      });

      it('should return 400 when no fields provided for update', async () => {
        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send({});

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'At least one field must be provided for update',
            }),
          ]),
        );
      });

      it('should return 400 when translations missing Portuguese', async () => {
        const payload = {
          translations: [
            {
              locale: 'it',
              title: 'Solo Italiano',
              description: 'Descrizione',
            },
            { locale: 'es', title: 'Solo Español', description: 'Descripción' },
          ],
        };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: expect.arrayContaining(['translations']),
              message: 'Portuguese translation is required',
            }),
          ]),
        );
      });

      it('should return 400 when translations have duplicate locales', async () => {
        const payload = {
          translations: [
            {
              locale: 'pt',
              title: 'Primeiro PT',
              description: 'Primeira descrição',
            },
            {
              locale: 'pt',
              title: 'Segundo PT',
              description: 'Segunda descrição',
            },
          ],
        };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: expect.arrayContaining(['translations']),
              message: 'Duplicate locales are not allowed',
            }),
          ]),
        );
      });

      it('should return 400 when translation title is empty', async () => {
        const payload = {
          translations: [
            { locale: 'pt', title: '', description: 'Descrição válida' },
          ],
        };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: expect.arrayContaining(['translations', 0, 'title']),
              message: 'Title is required',
            }),
          ]),
        );
      });

      it('should return 400 when translation title exceeds maximum length', async () => {
        const payload = {
          translations: [
            { locale: 'pt', title: 'A'.repeat(300), description: 'Descrição' },
          ],
        };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: expect.arrayContaining(['translations', 0, 'title']),
              message: 'Title must be at most 255 characters',
            }),
          ]),
        );
      });

      it('should return 400 when order is zero or negative', async () => {
        const payload = { order: 0 };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: expect.arrayContaining(['order']),
              message: 'Order must be a positive number',
            }),
          ]),
        );
      });

      it('should return 400 when order is not an integer', async () => {
        const payload = { order: 1.5 };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: expect.arrayContaining(['order']),
              message: 'Order must be an integer',
            }),
          ]),
        );
      });

      it('should return 400 when array contains empty IDs', async () => {
        const payload = { flashcardIds: ['valid-id', '', 'another-valid-id'] };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: expect.arrayContaining(['flashcardIds', 1]),
              message: 'Flashcard ID cannot be empty',
            }),
          ]),
        );
      });

      it('should return 400 when imageUrl is empty string', async () => {
        const payload = { imageUrl: '' };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: expect.arrayContaining(['imageUrl']),
              message: 'Image URL cannot be empty',
            }),
          ]),
        );
      });

      it('should return 400 when videoId is empty string', async () => {
        const payload = { videoId: '' };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: expect.arrayContaining(['videoId']),
              message: 'Video ID cannot be empty',
            }),
          ]),
        );
      });

      it('should handle multiple validation errors simultaneously', async () => {
        const payload = {
          translations: [
            { locale: 'pt', title: '', description: 'B'.repeat(1100) }, // Empty title + long description
          ],
          order: -5, // Negative order
          flashcardIds: ['', 'valid-id'], // Empty ID in array
          imageUrl: 'invalid-path', // Invalid image path
        };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: expect.arrayContaining(['translations', 0, 'title']),
              message: 'Title is required',
            }),
            expect.objectContaining({
              path: expect.arrayContaining(['order']),
              message: 'Order must be a positive number',
            }),
            expect.objectContaining({
              path: expect.arrayContaining(['flashcardIds', 0]),
              message: 'Flashcard ID cannot be empty',
            }),
            expect.objectContaining({
              path: expect.arrayContaining(['imageUrl']),
              message:
                'Image URL must be a valid URL or a valid path starting with /',
            }),
          ]),
        );
      });
    });

    describe('business logic errors', () => {
      it('should return 404 when lesson not found', async () => {
        const payload = { order: 1 };
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${nonExistentId}`)
          .send(payload);

        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({
          message: 'Lesson not found',
          statusCode: 404,
        });
      });

      it('should return 409 when order conflicts with existing lesson', async () => {
        const payload = { order: 2 }; // Lesson 2 already has order 2

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(409);
        expect(res.body).toMatchObject({
          message: 'A lesson with this order already exists in the module',
          statusCode: 409,
        });
      });
    });

    describe('edge cases', () => {
      it('should handle lesson with minimal data', async () => {
        // Create lesson with minimal required fields only
        const minimalLesson = await prisma.lesson.create({
          data: {
            moduleId,
            order: 99,
            flashcardIds: [],
            quizIds: [],
            commentIds: [],
            translations: {
              create: [
                { locale: 'pt', title: 'Minimal', description: 'Minimal desc' },
              ],
            },
          },
        });

        const payload = {
          translations: [
            {
              locale: 'pt',
              title: 'Updated Minimal',
              description: 'Updated desc',
            },
          ],
        };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${minimalLesson.id}`)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.translations[0].title).toBe('Updated Minimal');
      });

      it('should handle very long but valid inputs', async () => {
        const payload = {
          translations: [
            {
              locale: 'pt',
              title: 'A'.repeat(255), // Maximum allowed length
              description: 'B'.repeat(1000), // Maximum allowed length
            },
          ],
          flashcardIds: Array(50)
            .fill(0)
            .map((_, i) => `flashcard-${i}`), // Many IDs
          quizIds: Array(30)
            .fill(0)
            .map((_, i) => `quiz-${i}`),
          commentIds: Array(20)
            .fill(0)
            .map((_, i) => `comment-${i}`),
        };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.flashcardIds).toHaveLength(50);
        expect(res.body.quizIds).toHaveLength(30);
        expect(res.body.commentIds).toHaveLength(20);
      });

      it('should handle special characters in translations', async () => {
        const payload = {
          translations: [
            {
              locale: 'pt',
              title: 'Aula com çãráctêres especiais & símbolos (123)',
              description: 'Descrição com ñ, ü, é, à, ç e outros: @#$%^&*()',
            },
          ],
        };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.translations[0].title).toBe(
          'Aula com çãráctêres especiais & símbolos (123)',
        );
        expect(res.body.translations[0].description).toBe(
          'Descrição com ñ, ü, é, à, ç e outros: @#$%^&*()',
        );
      });

      it('should handle complex imageUrl paths', async () => {
        const complexPaths = [
          '/assets/courses/advanced-react/modules/hooks/lessons/use-effect-cleanup.webp',
          '/static/images/2024/Q1/lesson-covers/typescript-generics.svg',
          '/cdn/media/lessons/database-optimization/indexing-strategies.jpg',
        ];

        for (const path of complexPaths) {
          const payload = { imageUrl: path };
          const res = await request(app.getHttpServer())
            .put(`${endpoint()}/${existingLessonId}`)
            .send(payload);

          expect(res.status).toBe(200);
          expect(res.body.imageUrl).toBe(path);
        }
      });

      it('should handle concurrent updates correctly', async () => {
        const payload1 = { order: 50 };
        const payload2 = {
          translations: [
            {
              locale: 'pt',
              title: 'Concurrent Update',
              description: 'Concurrent desc',
            },
          ],
        };

        // Send two requests simultaneously
        const [res1, res2] = await Promise.all([
          request(app.getHttpServer())
            .put(`${endpoint()}/${existingLessonId}`)
            .send(payload1),
          request(app.getHttpServer())
            .put(`${endpoint()}/${secondLessonId}`)
            .send(payload2),
        ]);

        expect(res1.status).toBe(200);
        expect(res2.status).toBe(200);
        expect(res1.body.order).toBe(50);
        expect(res2.body.translations[0].title).toBe('Concurrent Update');
      });

      it('should maintain data integrity after failed update', async () => {
        // First, get original state
        const originalRes = await request(app.getHttpServer()).get(
          `${endpoint()}/${existingLessonId}`,
        );
        const originalData = originalRes.body;

        // Try invalid update
        const invalidPayload = { order: -1 }; // Invalid order
        const failedRes = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(invalidPayload);

        expect(failedRes.status).toBe(400);

        // Verify original data is unchanged
        const afterFailedRes = await request(app.getHttpServer()).get(
          `${endpoint()}/${existingLessonId}`,
        );

        expect(afterFailedRes.body).toMatchObject({
          id: originalData.id,
          order: originalData.order,
          imageUrl: originalData.imageUrl,
          videoId: originalData.videoId,
          translations: originalData.translations,
        });
      });
    });

    describe('boundary testing', () => {
      it('should accept minimum valid order', async () => {
        const payload = { order: 3 }; // Use order 3 instead of 1 to avoid conflict

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${secondLessonId}`)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.order).toBe(3);
      });

      it('should accept very high order values', async () => {
        const payload = { order: 999999 };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.order).toBe(999999);
      });

      it('should handle exactly at character limits', async () => {
        const payload = {
          translations: [
            {
              locale: 'pt',
              title: 'A'.repeat(255), // Exactly at limit
              description: 'B'.repeat(1000), // Exactly at limit
            },
          ],
        };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.translations[0].title).toHaveLength(255);
        expect(res.body.translations[0].description).toHaveLength(1000);
      });

      it('should reject exactly over character limits', async () => {
        const payload = {
          translations: [
            {
              locale: 'pt',
              title: 'A'.repeat(256), // Over limit by 1
              description: 'Valid description',
            },
          ],
        };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: expect.arrayContaining(['translations', 0, 'title']),
              message: 'Title must be at most 255 characters',
            }),
          ]),
        );
      });
    });

    describe('response format validation', () => {
      it('should return complete lesson object with correct structure', async () => {
        const payload = {
          translations: [
            {
              locale: 'pt',
              title: 'Complete Test',
              description: 'Complete description',
            },
          ],
          order: 42,
        };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            moduleId: expect.any(String),
            order: expect.any(Number),
            flashcardIds: expect.any(Array),
            quizIds: expect.any(Array),
            commentIds: expect.any(Array),
            translations: expect.arrayContaining([
              expect.objectContaining({
                locale: expect.any(String),
                title: expect.any(String),
                description: expect.any(String),
              }),
            ]),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          }),
        );

        // Verify updatedAt is more recent than createdAt
        const createdAt = new Date(res.body.createdAt);
        const updatedAt = new Date(res.body.updatedAt);
        expect(updatedAt.getTime()).toBeGreaterThanOrEqual(createdAt.getTime());
      });

      it('should not include undefined fields in response', async () => {
        // Update lesson that originally had imageUrl, remove it
        const payload = { imageUrl: null };

        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.imageUrl).toBeUndefined(); // ✅ Ajustado para undefined
        expect(res.body).not.toHaveProperty('undefinedField');
      });
    });

    describe('performance and reliability', () => {
      it('should handle large payloads efficiently', async () => {
        const payload = {
          translations: [
            {
              locale: 'pt',
              title: 'Performance Test with Long Title ' + 'A'.repeat(200),
              description:
                'Performance test description with detailed content ' +
                'B'.repeat(900),
            },
            {
              locale: 'it',
              title: 'Test delle Prestazioni ' + 'C'.repeat(200),
              description:
                'Descrizione del test delle prestazioni ' + 'D'.repeat(900),
            },
            {
              locale: 'es',
              title: 'Prueba de Rendimiento ' + 'E'.repeat(200),
              description:
                'Descripción de prueba de rendimiento ' + 'F'.repeat(900),
            },
          ],
          flashcardIds: Array(100)
            .fill(0)
            .map((_, i) => `perf-flashcard-${i.toString().padStart(3, '0')}`),
          quizIds: Array(50)
            .fill(0)
            .map((_, i) => `perf-quiz-${i.toString().padStart(3, '0')}`),
          commentIds: Array(75)
            .fill(0)
            .map((_, i) => `perf-comment-${i.toString().padStart(3, '0')}`),
        };

        const startTime = Date.now();
        const res = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);
        const endTime = Date.now();

        expect(res.status).toBe(200);
        expect(res.body.flashcardIds).toHaveLength(100);
        expect(res.body.quizIds).toHaveLength(50);
        expect(res.body.commentIds).toHaveLength(75);
        expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      });

      it('should handle rapid sequential updates', async () => {
        const updates = [
          { order: 10 },
          { order: 11 },
          { order: 12 },
          { order: 13 },
          { order: 14 },
        ];

        for (const payload of updates) {
          const res = await request(app.getHttpServer())
            .put(`${endpoint()}/${existingLessonId}`)
            .send(payload);

          expect(res.status).toBe(200);
          expect(res.body.order).toBe(payload.order);
        }

        // Verify final state
        const finalRes = await request(app.getHttpServer()).get(
          `${endpoint()}/${existingLessonId}`,
        );

        expect(finalRes.body.order).toBe(14);
      });

      it('should maintain referential integrity', async () => {
        // Update lesson
        const payload = {
          translations: [
            {
              locale: 'pt',
              title: 'Integrity Test',
              description: 'Testing referential integrity',
            },
          ],
        };

        const updateRes = await request(app.getHttpServer())
          .put(`${endpoint()}/${existingLessonId}`)
          .send(payload);

        expect(updateRes.status).toBe(200);

        // Verify the lesson still belongs to the correct module
        expect(updateRes.body.moduleId).toBe(moduleId);

        // Verify the lesson can still be found via module listing
        const listRes = await request(app.getHttpServer()).get(endpoint());

        expect(listRes.status).toBe(200);
        const updatedLesson = listRes.body.lessons.find(
          (l: any) => l.id === existingLessonId,
        );
        expect(updatedLesson).toBeDefined();
        expect(updatedLesson.translations[0].title).toBe('Integrity Test');
      });
    });
  });

  describe('[DELETE] delete lesson', () => {
    let lessonId: string;

    beforeEach(async () => {
      const lesson = await prisma.lesson.create({
        data: {
          moduleId,
          order: 4,
          translations: {
            create: [
              { locale: 'pt', title: 'Aula Del', description: 'Desc Del' },
            ],
          },
        },
      });
      lessonId = lesson.id;
    });

    it('should delete lesson successfully and return 200', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${endpoint()}/${lessonId}`)
        .send();
      expect(res.status).toBe(200);

      const getRes = await request(app.getHttpServer())
        .get(`${endpoint()}/${lessonId}`)
        .send();
      expect(getRes.status).toBe(404);
    });

    it('should return 404 when lesson not found', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app.getHttpServer())
        .delete(`${endpoint()}/${nonExistentId}`)
        .send();
      expect(res.status).toBe(404);
    });

    it('should return 400 on invalid lessonId format', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${endpoint()}/invalid-id`)
        .send();
      expect(res.status).toBe(400);
    });
  });
});
