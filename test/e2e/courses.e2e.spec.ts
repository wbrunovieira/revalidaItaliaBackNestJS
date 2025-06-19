// test/e2e/courses.e2e.spec.ts
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Create & List Courses (E2E)', () => {
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

    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});
  });

  afterAll(async () => {
    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});
    await app.close();
  });

  it('[POST] /courses - Success', async () => {
    const payload = {
      slug: 'test-course',
      translations: [
        {
          locale: 'pt',
          title: 'Curso de Teste',
          description: 'Descrição em Português',
        },
        {
          locale: 'it',
          title: 'Corso di Test',
          description: 'Descrizione in Italiano',
        },
        {
          locale: 'es',
          title: 'Curso de Prueba',
          description: 'Descripción en Español',
        },
      ],
    };

    const res = await request(app.getHttpServer())
      .post('/courses')
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('[POST] /courses - Missing Portuguese Translation', async () => {
    const payload = {
      slug: 'no-pt-course',
      translations: [
        {
          locale: 'it',
          title: 'Corso Italiano',
          description: 'Descrizione valida',
        },
        {
          locale: 'es',
          title: 'Curso Español',
          description: 'Descripción válida',
        },
      ],
    };

    const res = await request(app.getHttpServer())
      .post('/courses')
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    const msgs: any[] = res.body.message;

    const hasPtError = msgs.some((m) =>
      typeof m === 'string'
        ? m.toLowerCase().includes('portuguese')
        : typeof m.message === 'string' &&
          m.message.toLowerCase().includes('portuguese'),
    );
    expect(hasPtError).toBe(true);
  });

  it('[POST] /courses - Duplicate Portuguese Title', async () => {
    const firstPayload = {
      slug: 'first-course',
      translations: [
        {
          locale: 'pt',
          title: 'Título Duplicado',
          description: 'Descrição única',
        },
        {
          locale: 'it',
          title: 'Titolo Duplicato',
          description: 'Descrizione unica',
        },
        {
          locale: 'es',
          title: 'Título Duplicado',
          description: 'Descripción única',
        },
      ],
    };

    const firstRes = await request(app.getHttpServer())
      .post('/courses')
      .send(firstPayload);
    expect(firstRes.status).toBe(201);

    const secondPayload = { ...firstPayload, slug: 'second-course' };
    const secondRes = await request(app.getHttpServer())
      .post('/courses')
      .send(secondPayload);
    expect(secondRes.status).toBe(409);
    expect(secondRes.body).toHaveProperty('message');
  });

  it('[POST] /courses - Too-Short Title in a Translation', async () => {
    const payload = {
      slug: 'short-title-course',
      translations: [
        { locale: 'pt', title: 'OK', description: 'Descrição válida' },
        { locale: 'it', title: 'Corso OK', description: 'Descrizione valida' },
        { locale: 'es', title: 'Curso OK', description: 'Descripción válida' },
      ],
    };

    const res = await request(app.getHttpServer())
      .post('/courses')
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    const msgs: any[] = res.body.message;

    const titleError = msgs.some((m) =>
      typeof m === 'string'
        ? m.toLowerCase().includes('translations.0.title')
        : typeof m.message === 'string' &&
          m.message.toLowerCase().includes('translations.0.title'),
    );
    expect(titleError).toBe(true);
  });

  it('[POST] /courses - Unsupported Locale', async () => {
    const payload = {
      slug: 'unsupported-locale',
      translations: [
        { locale: 'pt', title: 'Curso OK', description: 'Descrição válida' },
        { locale: 'en', title: 'Course OK', description: 'Valid description' },
      ],
    };

    const res = await request(app.getHttpServer())
      .post('/courses')
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    const msgs: any[] = res.body.message;

    const localeError = msgs.some((m) =>
      typeof m === 'string'
        ? m.toLowerCase().includes('translations.1.locale')
        : typeof m.message === 'string' &&
          m.message.toLowerCase().includes('translations.1.locale'),
    );
    expect(localeError).toBe(true);
  });

  it('[POST] /courses - Duplicate Slug in Database', async () => {
    const firstPayload = {
      slug: 'same-slug',
      translations: [
        { locale: 'pt', title: 'Curso A', description: 'Descrição A' },
        { locale: 'it', title: 'Corso A', description: 'Descrizione A' },
        { locale: 'es', title: 'Curso A', description: 'Descripción A' },
      ],
    };

    const firstRes = await request(app.getHttpServer())
      .post('/courses')
      .send(firstPayload);
    expect(firstRes.status).toBe(201);

    const secondPayload = {
      slug: 'same-slug',
      translations: [
        { locale: 'pt', title: 'Curso B', description: 'Descrição B' },
        { locale: 'it', title: 'Corso B', description: 'Descrizione B' },
        { locale: 'es', title: 'Curso B', description: 'Descripción B' },
      ],
    };

    const secondRes = await request(app.getHttpServer())
      .post('/courses')
      .send(secondPayload);
    expect(secondRes.status).toBe(500);
    expect(secondRes.body).toHaveProperty('statusCode', 500);
  });

  it('[GET] /courses - Success', async () => {
    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});

    const payload1 = {
      slug: 'lista-curso-1',
      translations: [
        { locale: 'pt', title: 'Lista Curso Um', description: 'Descrição Um' },
        {
          locale: 'it',
          title: 'Lista Corso Uno',
          description: 'Descrizione Uno',
        },
        {
          locale: 'es',
          title: 'Lista Curso Uno',
          description: 'Descripción Uno',
        },
      ],
    };
    const payload2 = {
      slug: 'lista-curso-2',
      translations: [
        {
          locale: 'pt',
          title: 'Lista Curso Dois',
          description: 'Descrição Dois',
        },
        {
          locale: 'it',
          title: 'Lista Corso Due',
          description: 'Descrizione Due',
        },
        {
          locale: 'es',
          title: 'Lista Curso Dos',
          description: 'Descripción Dos',
        },
      ],
    };

    await request(app.getHttpServer()).post('/courses').send(payload1);
    await request(app.getHttpServer()).post('/courses').send(payload2);

    const res = await request(app.getHttpServer()).get('/courses');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);

    res.body.forEach((course: any) => {
      expect(course).toHaveProperty('id');
      expect(course).toHaveProperty('slug');
      expect(course).toHaveProperty('title');
      expect(course).toHaveProperty('description');
    });
  });

  it('[POST] /courses - Slug Normalization', async () => {
    const payload = {
      slug: 'Invalid Slug!',
      translations: [
        { locale: 'pt', title: 'Curso X', description: 'Descrição válida' },
        { locale: 'it', title: 'Corso X', description: 'Descrizione valida' },
        { locale: 'es', title: 'Curso X', description: 'Descripción válida' },
      ],
    };

    const res = await request(app.getHttpServer())
      .post('/courses')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('slug', 'invalid-slug');
  });

  it('[GET] /courses/:id - Success', async () => {
    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});

    const createPayload = {
      slug: 'detalhe-curso',
      translations: [
        {
          locale: 'pt',
          title: 'Detalhe Curso',
          description: 'Descrição Detalhe',
        },
        {
          locale: 'it',
          title: 'Dettaglio Corso',
          description: 'Descrizione Dettaglio',
        },
        {
          locale: 'es',
          title: 'Detalle Curso',
          description: 'Descripción Detalle',
        },
      ],
    };
    const createRes = await request(app.getHttpServer())
      .post('/courses')
      .send(createPayload);
    expect(createRes.status).toBe(201);
    const courseId = createRes.body.id;

    const res = await request(app.getHttpServer()).get(`/courses/${courseId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', courseId);
    expect(res.body).toHaveProperty('slug', 'detalhe-curso');

    expect(Array.isArray(res.body.translations)).toBe(true);
    expect(res.body.translations).toEqual(
      expect.arrayContaining([
        {
          locale: 'pt',
          title: 'Detalhe Curso',
          description: 'Descrição Detalhe',
        },
        {
          locale: 'it',
          title: 'Dettaglio Corso',
          description: 'Descrizione Dettaglio',
        },
        {
          locale: 'es',
          title: 'Detalle Curso',
          description: 'Descripción Detalle',
        },
      ]),
    );
  });
});
