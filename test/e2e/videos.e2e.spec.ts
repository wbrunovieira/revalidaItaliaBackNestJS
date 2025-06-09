// test/e2e/videos.e2e.spec.ts
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Create Video (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // replace with one of your real PandaVideo IDs
  const realVideoId = '13d403ac-da6f-4dd1-baee-4a288498a8d8';

  const videoBase = (courseId: string, moduleId: string) =>
    `/courses/${courseId}/modules/${moduleId}/videos`;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // clean up
    await prisma.videoTranslation.deleteMany({});
    await prisma.video.deleteMany({});
    await prisma.moduleTranslation.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});
  });

  afterAll(async () => {
    await prisma.videoTranslation.deleteMany({});
    await prisma.video.deleteMany({});
    await prisma.moduleTranslation.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});
    await app.close();
  });

  it('[POST] /courses → create course', async () => {
    const res = await request(app.getHttpServer())
      .post('/courses')
      .send({
        slug: 'video-course',
        translations: [
          { locale: 'pt', title: 'Curso Vídeo', description: 'Descrição PT' },
          { locale: 'it', title: 'Corso Video', description: 'Descrizione IT' },
          { locale: 'es', title: 'Curso Video', description: 'Descripción ES' },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('[POST] /courses/:courseId/modules → create module', async () => {
    const course = await prisma.course.findFirst();
    expect(course).toBeTruthy();

    const res = await request(app.getHttpServer())
      .post(`/courses/${course!.id}/modules`)
      .send({
        slug: 'module-video',
        translations: [
          { locale: 'pt', title: 'Módulo Vídeo', description: 'Descrição PT' },
          { locale: 'it', title: 'Modulo Video', description: 'Descrizione IT' },
          { locale: 'es', title: 'Modulo Video', description: 'Descripción ES' },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('[POST] create video → Success', async () => {
    const course = await prisma.course.findFirst();
    const module = await prisma.module.findFirst();
    expect(course).toBeTruthy();
    expect(module).toBeTruthy();

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
      .post(videoBase(course!.id, module!.id))
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        slug: payload.slug,
        providerVideoId: payload.providerVideoId,
      }),
    );
  });

  it('[POST] create video → Duplicate Slug', async () => {
    const course = await prisma.course.findFirst();
    const module = await prisma.module.findFirst();

    const payload = {
      slug: 'video-intro',
      providerVideoId: realVideoId,
      translations: [
        { locale: 'pt', title: 'Dup Vídeo', description: 'Desc PT' },
        { locale: 'it', title: 'Dup Video', description: 'Desc IT' },
        { locale: 'es', title: 'Dup Video', description: 'Desc ES' },
      ],
    };

    // first should 201
    const first = await request(app.getHttpServer())
      .post(videoBase(course!.id, module!.id))
      .send(payload);
    expect(first.status).toBe(201);

    // second same slug → 409
    const second = await request(app.getHttpServer())
      .post(videoBase(course!.id, module!.id))
      .send(payload);
    expect(second.status).toBe(409);
    expect(second.body).toHaveProperty('message');
  });

  it('[POST] create video → Missing Portuguese Translation', async () => {
    const course = await prisma.course.findFirst();
    const module = await prisma.module.findFirst();

    const payload = {
      slug: 'no-pt-video',
      providerVideoId: realVideoId,
      translations: [
        { locale: 'it', title: 'IT Only', description: 'Desc IT' },
        { locale: 'es', title: 'ES Only', description: 'Desc ES' },
      ],
    };

    const res = await request(app.getHttpServer())
      .post(videoBase(course!.id, module!.id))
      .send(payload);

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.message)).toBe(true);
    // error on translations.0
    expect(
      res.body.message.some((m: any) =>
        /translations\.0/.test(typeof m === 'string' ? m : m.message),
      ),
    ).toBe(true);
  });

  it('[POST] create video → Unsupported Locale', async () => {
    const course = await prisma.course.findFirst();
    const module = await prisma.module.findFirst();

    const payload = {
      slug: 'bad-locale-video',
      providerVideoId: realVideoId,
      translations: [
        { locale: 'pt', title: 'OK Vídeo', description: 'Desc PT' },
        // 'en' is not in the allowed union
        { locale: 'en' as any, title: 'EN Video', description: 'Desc EN' },
      ],
    };

    const res = await request(app.getHttpServer())
      .post(videoBase(course!.id, module!.id))
      .send(payload);

    expect(res.status).toBe(400);
    expect(
      res.body.message.some((m: any) =>
        /translations\.1\.locale/.test(typeof m === 'string' ? m : m.message),
      ),
    ).toBe(true);
  });
});