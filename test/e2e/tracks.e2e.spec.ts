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
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = app.get(PrismaService);
    // cleanup
    await prisma.trackTranslation.deleteMany({});
    await prisma.track.deleteMany({});
    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});
  });

  afterAll(async () => {
    await prisma.trackTranslation.deleteMany({});
    await prisma.track.deleteMany({});
    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});
    await app.close();
  });

  it('[POST] /tracks - Success', async () => {
    const courseRes = await request(app.getHttpServer()).post('/courses').send({
      slug: 'curso-para-trilha',
      translations: [
        { locale: 'pt', title: 'Curso PT', description: 'Desc PT' },
        { locale: 'it', title: 'Corso IT', description: 'Desc IT' },
        { locale: 'es', title: 'Curso ES', description: 'Desc ES' },
      ],
    });
    expect(courseRes.status).toBe(201);
    const courseId = courseRes.body.id;

    const trackRes = await request(app.getHttpServer()).post('/tracks').send({
      slug: 'trilha-exemplo',
      courseIds: [courseId],
      translations: [
        { locale: 'pt', title: 'Trilha PT', description: 'Desc Trilha PT' },
        { locale: 'it', title: 'Traccia IT', description: 'Desc Traccia IT' },
        { locale: 'es', title: 'Pista ES', description: 'Desc Pista ES' },
      ],
    });
    expect(trackRes.status).toBe(201);
    expect(trackRes.body).toHaveProperty('id');
    expect(trackRes.body.slug).toBe('trilha-exemplo');
  });

  it('[GET] /tracks/:id - Success', async () => {
    const courseRes = await request(app.getHttpServer()).post('/courses').send({
      slug: 'curso-pt',
      translations: [
        { locale: 'pt', title: 'Curso PT2', description: 'Desc PT2' },
        { locale: 'it', title: 'Corso IT2', description: 'Desc IT2' },
        { locale: 'es', title: 'Curso ES2', description: 'Desc ES2' },
      ],
    });
    const courseId = courseRes.body.id;

    const trackRes = await request(app.getHttpServer()).post('/tracks').send({
      slug: 'trilha-detalhe',
      courseIds: [courseId],
      translations: [
        { locale: 'pt', title: 'Detalhe PT', description: 'Desc Detalhe PT' },
        { locale: 'it', title: 'Dettaglio IT', description: 'Desc Dettaglio IT' },
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
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('slug');
      expect(Array.isArray(t.translations)).toBe(true);
    });
  });
});