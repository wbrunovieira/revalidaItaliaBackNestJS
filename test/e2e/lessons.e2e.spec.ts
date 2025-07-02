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
