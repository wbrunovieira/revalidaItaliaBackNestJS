// test/e2e/tracks.e2e.spec.ts
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Create Track (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
    );
    await app.init();

    prisma = app.get(PrismaService);
    // clean up tracks and courses
    await prisma.trackTranslation.deleteMany({});
    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.track.deleteMany({});
    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});
  });

  afterAll(async () => {
    await prisma.trackTranslation.deleteMany({});
    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});   
    await prisma.track.deleteMany({});
    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});
    await app.close();
  });

  it('[POST] /tracks - Success', async () => {
    // first create a course to reference
    const coursePayload = {
      slug: 'curso-para-trilha',
      translations: [
        { locale: 'pt', title: 'Curso PT', description: 'Descrição PT' },
        { locale: 'it', title: 'Corso IT', description: 'Descrizione IT' },
        { locale: 'es', title: 'Curso ES', description: 'Descripción ES' },
      ],
    };
    const courseRes = await request(app.getHttpServer())
      .post('/courses')
      .send(coursePayload);
    expect(courseRes.status).toBe(201);
    const courseId = courseRes.body.id;

    const trackPayload = {
      slug: 'trilha-exemplo',
      courseIds: [courseId],
      translations: [
        { locale: 'pt', title: 'Trilha Exemplo', description: 'Descrição da trilha' },
        { locale: 'it', title: 'Traccia Esempio', description: 'Descrizione della traccia' },
        { locale: 'es', title: 'Pista Ejemplo', description: 'Descripción de la pista' },
      ],
    };

    const res = await request(app.getHttpServer())
      .post('/tracks')
      .send(trackPayload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('slug', 'trilha-exemplo');
    expect(res.body).toHaveProperty('courseIds');
    expect(res.body.courseIds).toEqual([courseId]);
    expect(res.body).toHaveProperty('title', 'Trilha Exemplo');
    expect(res.body).toHaveProperty('description', 'Descrição da trilha');
  });

  it('[POST] /tracks - Missing Portuguese Translation', async () => {
    // ensure at least one course exists
    const courseRes = await request(app.getHttpServer())
      .post('/courses')
      .send({
        slug: 'curso-pt1',
        translations: [
          { locale: 'pt', title: 'Curso PT1', description: 'Desc PT1' },
          { locale: 'it', title: 'Corso IT1', description: 'Desc IT1' },
          { locale: 'es', title: 'Curso ES1', description: 'Desc ES1' },
        ],
      });
    expect(courseRes.status).toBe(201);
    const courseId = courseRes.body.id;

    const payload = {
      slug: 'sem-traducao-pt',
      courseIds: [courseId],
      translations: [
        { locale: 'it', title: 'Solo IT', description: 'Solo descrizione' },
        { locale: 'es', title: 'Solo ES', description: 'Solo descripción' },
      ],
    };

    const res = await request(app.getHttpServer())
      .post('/tracks')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    const msgs: any[] = res.body.message;
    const hasPtError = msgs.some(m =>
      typeof m === 'string'
        ? m.toLowerCase().includes('portuguese')
        : typeof m.message === 'string' && m.message.toLowerCase().includes('portuguese')
    );
    expect(hasPtError).toBe(true);
  });
});