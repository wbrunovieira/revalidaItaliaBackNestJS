// test/e2e/tracks.e2e.spec.ts
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Track API (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
    await prisma.trackTranslation.deleteMany({});
    await prisma.track.deleteMany({});
    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});
  });

  afterAll(async () => {
    await prisma.trackTranslation.deleteMany({});
    await prisma.trackCourse.deleteMany({});
    await prisma.track.deleteMany({});
    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});
  });

  it('[POST] /tracks - Success', async () => {
    const courseRes = await request(app.getHttpServer())
      .post('/courses')
      .send({
        slug: 'curso-para-trilha',
        translations: [
          { locale: 'pt', title: 'Curso PT', description: 'Desc PT' },
          { locale: 'it', title: 'Corso IT', description: 'Desc IT' },
          { locale: 'es', title: 'Curso ES', description: 'Desc ES' },
        ],
      });
    expect(courseRes.status).toBe(201);
    const courseId = courseRes.body.id;

    const trackRes = await request(app.getHttpServer())
      .post('/tracks')
      .send({
        slug: 'trilha-exemplo',
        courseIds: [courseId],
        translations: [
          { locale: 'pt', title: 'Trilha PT', description: 'Desc Trilha PT' },
          { locale: 'it', title: 'Traccia IT', description: 'Desc Traccia IT' },
          { locale: 'es', title: 'Pista ES', description: 'Desc Pista ES' },
        ],
      });
    expect(trackRes.status).toBe(201);
    expect(trackRes.body.id).toBeTruthy();
    expect(trackRes.body.slug).toBe('trilha-exemplo');
  });

  it('[GET] /tracks/:id - Success', async () => {
    const courseRes = await request(app.getHttpServer())
      .post('/courses')
      .send({
        slug: 'curso-pt',
        translations: [
          { locale: 'pt', title: 'Curso PT2', description: 'Desc PT2' },
          { locale: 'it', title: 'Corso IT2', description: 'Desc IT2' },
          { locale: 'es', title: 'Curso ES2', description: 'Desc ES2' },
        ],
      });
    const courseId = courseRes.body.id;

    const trackRes = await request(app.getHttpServer())
      .post('/tracks')
      .send({
        slug: 'trilha-detalhe',
        courseIds: [courseId],
        translations: [
          { locale: 'pt', title: 'Detalhe PT', description: 'Desc Detalhe PT' },
          {
            locale: 'it',
            title: 'Dettaglio IT',
            description: 'Desc Dettaglio IT',
          },
          { locale: 'es', title: 'Detalle ES', description: 'Desc Detalle ES' },
        ],
      });
    const trackId = trackRes.body.id;

    const res = await request(app.getHttpServer()).get(`/tracks/${trackId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(trackId);
    expect(Array.isArray(res.body.translations)).toBe(true);
    expect(res.body.translations).toHaveLength(3);
  });

  it('[GET] /tracks - List Success', async () => {
    const res = await request(app.getHttpServer()).get('/tracks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    res.body.forEach((t: any) => {
      expect(t.id).toBeDefined();
      expect(t.slug).toBeDefined();
      expect(Array.isArray(t.translations)).toBe(true);
    });
  });

  it('[POST] same course in multiple tracks - Success', async () => {
    const courseRes = await request(app.getHttpServer())
      .post('/courses')
      .send({
        slug: 'curso-multi-track',
        translations: [
          {
            locale: 'pt',
            title: 'Curso PT Multi',
            description: 'Desc PT Multi',
          },
          {
            locale: 'it',
            title: 'Corso IT Multi',
            description: 'Desc IT Multi',
          },
          {
            locale: 'es',
            title: 'Curso ES Multi',
            description: 'Desc ES Multi',
          },
        ],
      });
    expect(courseRes.status).toBe(201);
    const courseId = courseRes.body.id;

    const track1 = await request(app.getHttpServer())
      .post('/tracks')
      .send({
        slug: 'trilha-multi-1',
        courseIds: [courseId],
        translations: [
          {
            locale: 'pt',
            title: 'Trilha 1 PT',
            description: 'Desc Trilha1 PT',
          },
          {
            locale: 'it',
            title: 'Traccia 1 IT',
            description: 'Desc Traccia1 IT',
          },
          { locale: 'es', title: 'Pista 1 ES', description: 'Desc Pista1 ES' },
        ],
      });
    expect(track1.status).toBe(201);

    const track2 = await request(app.getHttpServer())
      .post('/tracks')
      .send({
        slug: 'trilha-multi-2',
        courseIds: [courseId],
        translations: [
          {
            locale: 'pt',
            title: 'Trilha 2 PT',
            description: 'Desc Trilha2 PT',
          },
          {
            locale: 'it',
            title: 'Traccia 2 IT',
            description: 'Desc Traccia2 IT',
          },
          { locale: 'es', title: 'Pista 2 ES', description: 'Desc Pista2 ES' },
        ],
      });
    expect(track2.status).toBe(201);

    const listRes = await request(app.getHttpServer()).get('/tracks');
    expect(listRes.status).toBe(200);
    const slugs = listRes.body.map((t: any) => t.slug);
    expect(slugs).toEqual(
      expect.arrayContaining(['trilha-multi-1', 'trilha-multi-2']),
    );
  });
});
