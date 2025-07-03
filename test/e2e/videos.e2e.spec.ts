// test/e2e/videos.e2e.spec.ts
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('VideoController (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const realVideoId = 'any-video-id';
  let courseId: string;
  let moduleId: string;
  let lessonId: string;
  let createdVideoId: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('VideoHostProvider')
      .useValue({
        getMetadata: async () => ({ durationInSeconds: 123 }),
        getEmbedUrl: () => 'https://fake/embed/url',
      })
      .compile();

    app = modRef.createNestApplication();
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
    // limpa tudo na ordem certa
    await prisma.videoSeen.deleteMany();
    await prisma.videoTranslation.deleteMany();
    await prisma.video.deleteMany();

    await prisma.lessonDocument.deleteMany();
    await prisma.lesson.deleteMany();

    await prisma.moduleTranslation.deleteMany();
    await prisma.module.deleteMany();

    await prisma.courseTranslation.deleteMany();
    await prisma.course.deleteMany();

    // cria curso
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

    // cria módulo
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

    // agora criamos a lesson vinculada ao módulo
    const lesson = await prisma.lesson.create({
      data: { moduleId },
    });
    lessonId = lesson.id;
  });

  // monta a rota usando lessonId
  const endpoint = () => `/courses/${courseId}/lessons/${lessonId}/videos`;

  // Helper para criar um vídeo de teste
  const createTestVideo = async (slug = 'test-video') => {
    const payload = {
      slug,
      providerVideoId: realVideoId,
      translations: [
        { locale: 'pt', title: 'Vídeo PT', description: 'Desc PT' },
        { locale: 'it', title: 'Video IT', description: 'Desc IT' },
        { locale: 'es', title: 'Video ES', description: 'Desc ES' },
      ],
    };

    const res = await request(app.getHttpServer())
      .post(endpoint())
      .send(payload);

    return res.body.id;
  };

  describe('[POST] create video', () => {
    it('→ Success', async () => {
      const payload = {
        slug: 'video-intro',
        providerVideoId: realVideoId,
        translations: [
          { locale: 'pt', title: 'Vídeo Intro', description: 'Desc PT' },
          { locale: 'it', title: 'Video Intro', description: 'Desc IT' },
          { locale: 'es', title: 'Video Intro', description: 'Desc ES' },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          slug: payload.slug,
          providerVideoId: payload.providerVideoId,
          durationInSeconds: 123,
          isSeen: false,
        }),
      );
      createdVideoId = res.body.id;
    });

    it('→ Duplicate Slug', async () => {
      const payload = {
        slug: 'dup-video',
        providerVideoId: realVideoId,
        translations: [
          { locale: 'pt', title: 'Dup PT', description: 'Desc PT' },
          { locale: 'it', title: 'Dup IT', description: 'Desc IT' },
          { locale: 'es', title: 'Dup ES', description: 'Desc ES' },
        ],
      };

      let res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);
      expect(res.status).toBe(201);

      res = await request(app.getHttpServer()).post(endpoint()).send(payload);
      expect(res.status).toBe(409);
    });

    it('→ Missing Portuguese Translation', async () => {
      const payload = {
        slug: 'no-pt-video',
        providerVideoId: realVideoId,
        translations: [
          { locale: 'it', title: 'Only IT', description: 'Desc IT' },
          { locale: 'es', title: 'Only ES', description: 'Desc ES' },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('→ Unsupported Locale', async () => {
      const payload = {
        slug: 'bad-locale',
        providerVideoId: realVideoId,
        translations: [
          { locale: 'pt', title: 'OK', description: 'Desc PT' },
          { locale: 'en' as any, title: 'EN', description: 'Desc EN' },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(400);
    });
  });

  describe('[GET] get video', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send({
          slug: 'e2e-video',
          providerVideoId: realVideoId,
          translations: [
            { locale: 'pt', title: 'Vídeo PT', description: 'Desc PT' },
            { locale: 'it', title: 'Video IT', description: 'Desc IT' },
            { locale: 'es', title: 'Video ES', description: 'Desc ES' },
          ],
        });
      createdVideoId = res.body.id;
    });

    it('→ Success returns all translations', async () => {
      const res = await request(app.getHttpServer())
        .get(`${endpoint()}/${createdVideoId}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          id: createdVideoId,
          slug: 'e2e-video',
          providerVideoId: realVideoId,
          durationInSeconds: 123,
          translations: [
            { locale: 'pt', title: 'Vídeo PT', description: 'Desc PT' },
            { locale: 'it', title: 'Video IT', description: 'Desc IT' },
            { locale: 'es', title: 'Video ES', description: 'Desc ES' },
          ],
        }),
      );
    });

    it('→ Not Found for nonexistent id', async () => {
      const res = await request(app.getHttpServer())
        .get(`${endpoint()}/00000000-0000-0000-0000-000000000000`)
        .send();
      expect(res.status).toBe(404);
    });

    it('→ Bad Request for invalid UUID', async () => {
      const res = await request(app.getHttpServer())
        .get(`${endpoint()}/not-a-uuid`)
        .send();
      expect(res.status).toBe(400);
    });
  });

  describe('[GET] list videos', () => {
    it('→ Success returns list of videos', async () => {
      const payload1 = {
        slug: 'list-video-1',
        providerVideoId: realVideoId,
        translations: [
          { locale: 'pt', title: 'L1 PT', description: 'Desc1' },
          { locale: 'it', title: 'L1 IT', description: 'Desc1 IT' },
          { locale: 'es', title: 'L1 ES', description: 'Desc1 ES' },
        ],
      };
      const payload2 = {
        slug: 'list-video-2',
        providerVideoId: realVideoId,
        translations: [
          { locale: 'pt', title: 'L2 PT', description: 'Desc2' },
          { locale: 'it', title: 'L2 IT', description: 'Desc2 IT' },
          { locale: 'es', title: 'L2 ES', description: 'Desc2 ES' },
        ],
      };
      await request(app.getHttpServer()).post(endpoint()).send(payload1);
      await request(app.getHttpServer()).post(endpoint()).send(payload2);

      const res = await request(app.getHttpServer()).get(endpoint()).send();
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('translations');
    });

    it('→ Success returns empty array when no videos', async () => {
      const res = await request(app.getHttpServer()).get(endpoint()).send();
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('[DELETE] delete video', () => {
    it('→ Success deletes video and returns success message', async () => {
      // Criar um vídeo para deletar
      const videoId = await createTestVideo('video-to-delete');

      // Verificar que o vídeo existe
      const getRes = await request(app.getHttpServer())
        .get(`${endpoint()}/${videoId}`)
        .send();
      expect(getRes.status).toBe(200);

      // Deletar o vídeo
      const deleteRes = await request(app.getHttpServer())
        .delete(`${endpoint()}/${videoId}`)
        .send();

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body).toEqual(
        expect.objectContaining({
          message: 'Video deleted successfully',
          deletedAt: expect.any(String),
        }),
      );

      // Verificar que o vídeo foi realmente deletado
      const getAfterDeleteRes = await request(app.getHttpServer())
        .get(`${endpoint()}/${videoId}`)
        .send();
      expect(getAfterDeleteRes.status).toBe(404);
    });

    it('→ Success deletes video with all related data (translations)', async () => {
      // Criar um vídeo
      const videoId = await createTestVideo('video-with-translations');

      // Verificar que as traduções existem
      const videoInDb = await prisma.video.findUnique({
        where: { id: videoId },
        include: { translations: true },
      });
      expect(videoInDb?.translations).toHaveLength(3);

      // Deletar o vídeo
      const deleteRes = await request(app.getHttpServer())
        .delete(`${endpoint()}/${videoId}`)
        .send();

      expect(deleteRes.status).toBe(200);

      // Verificar que as traduções também foram deletadas
      const translationsInDb = await prisma.videoTranslation.findMany({
        where: { videoId },
      });
      expect(translationsInDb).toHaveLength(0);
    });

    it('→ Not Found for nonexistent video', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const res = await request(app.getHttpServer())
        .delete(`${endpoint()}/${nonExistentId}`)
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Video not found in this lesson',
        }),
      );
    });

    it('→ Bad Request for invalid UUID', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${endpoint()}/not-a-uuid`)
        .send();

      expect(res.status).toBe(400);
    });

    it('→ Not Found when lesson does not exist', async () => {
      const videoId = await createTestVideo('video-for-invalid-lesson');
      const invalidLessonId = '00000000-0000-0000-0000-000000000000';

      const res = await request(app.getHttpServer())
        .delete(
          `/courses/${courseId}/lessons/${invalidLessonId}/videos/${videoId}`,
        )
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Lesson not found',
        }),
      );
    });

    it('→ Not Found when video belongs to different lesson', async () => {
      // Criar outra lesson
      const otherLesson = await prisma.lesson.create({
        data: { moduleId },
      });

      // Criar vídeo na lesson original
      const videoId = await createTestVideo('video-wrong-lesson');

      // Tentar deletar usando a outra lesson
      const res = await request(app.getHttpServer())
        .delete(
          `/courses/${courseId}/lessons/${otherLesson.id}/videos/${videoId}`,
        )
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Video not found in this lesson',
        }),
      );
    });

    it('→ Not Found when course does not match lesson', async () => {
      // Criar outro curso
      const otherCourse = await prisma.course.create({
        data: {
          slug: 'other-course',
          translations: {
            create: [
              { locale: 'pt', title: 'Outro Curso', description: 'Desc' },
            ],
          },
        },
      });

      const videoId = await createTestVideo('video-wrong-course');

      // Tentar deletar usando courseId incorreto
      const res = await request(app.getHttpServer())
        .delete(
          `/courses/${otherCourse.id}/lessons/${lessonId}/videos/${videoId}`,
        )
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Lesson not found',
        }),
      );
    });

    it('→ Conflict when video has dependencies (user viewed)', async () => {
      // Criar um vídeo
      const videoId = await createTestVideo('video-with-views');

      // Criar um usuário
      const user = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password',
          cpf: '12345678901',
          role: 'student',
        },
      });

      // Criar registro de visualização
      await prisma.videoSeen.create({
        data: {
          userId: user.id,
          videoId,
        },
      });

      // Tentar deletar o vídeo
      const res = await request(app.getHttpServer())
        .delete(`${endpoint()}/${videoId}`)
        .send();

      expect(res.status).toBe(409);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: expect.stringContaining(
            'Cannot delete video because it has dependencies',
          ),
          dependencyInfo: expect.objectContaining({
            canDelete: false,
            totalDependencies: expect.any(Number),
            summary: expect.objectContaining({
              videosSeen: 1,
            }),
          }),
        }),
      );
    });

    it('→ Success deletes multiple videos in sequence', async () => {
      // Criar múltiplos vídeos
      const video1Id = await createTestVideo('multi-video-1');
      const video2Id = await createTestVideo('multi-video-2');
      const video3Id = await createTestVideo('multi-video-3');

      // Deletar todos em sequência
      const delete1 = await request(app.getHttpServer())
        .delete(`${endpoint()}/${video1Id}`)
        .send();
      expect(delete1.status).toBe(200);

      const delete2 = await request(app.getHttpServer())
        .delete(`${endpoint()}/${video2Id}`)
        .send();
      expect(delete2.status).toBe(200);

      const delete3 = await request(app.getHttpServer())
        .delete(`${endpoint()}/${video3Id}`)
        .send();
      expect(delete3.status).toBe(200);

      // Verificar que a lista está vazia
      const listRes = await request(app.getHttpServer()).get(endpoint()).send();
      expect(listRes.status).toBe(200);
      expect(listRes.body).toEqual([]);
    });
  });
});
