// test/e2e/modules.e2e.spec.ts
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Create Module (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let courseId: string;

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

    await prisma.moduleTranslation.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});

    const courseRes = await request(app.getHttpServer())
      .post('/courses')
      .send({
        slug: 'curso-pai',
        translations: [
          {
            locale: 'pt',
            title: 'Curso Pai',
            description: 'Descrição Curso Pai',
          },
          {
            locale: 'it',
            title: 'Corso Padre',
            description: 'Descrizione Corso Padre',
          },
          {
            locale: 'es',
            title: 'Curso Padre',
            description: 'Descripción Curso Padre',
          },
        ],
      });
    courseId = courseRes.body.id;
  });

  afterAll(async () => {
    await prisma.moduleTranslation.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});
    await app.close();
  });

  it('[POST] /courses/:courseId/modules - Success', async () => {
    const payload = {
      slug: 'modulo-1',
      translations: [
        {
          locale: 'pt',
          title: 'Módulo Um',
          description: 'Descrição Módulo Um',
        },
        {
          locale: 'it',
          title: 'Modulo Uno',
          description: 'Descrizione Modulo Uno',
        },
        {
          locale: 'es',
          title: 'Módulo Uno',
          description: 'Descripción Módulo Uno',
        },
      ],
      order: 1,
    };

    const res = await request(app.getHttpServer())
      .post(`/courses/${courseId}/modules`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.slug).toBe('modulo-1');
    expect(res.body.order).toBe(1);
    expect(res.body.translations).toEqual(
      expect.arrayContaining([
        {
          locale: 'pt',
          title: 'Módulo Um',
          description: 'Descrição Módulo Um',
        },
        {
          locale: 'it',
          title: 'Modulo Uno',
          description: 'Descrizione Modulo Uno',
        },
        {
          locale: 'es',
          title: 'Módulo Uno',
          description: 'Descripción Módulo Uno',
        },
      ]),
    );
  });

  it('[POST] /courses/:courseId/modules - Missing Portuguese Translation', async () => {
    const payload = {
      slug: 'modulo-sem-pt',
      translations: [
        {
          locale: 'it',
          title: 'Modulo Due',
          description: 'Descrizione Modulo Due',
        },
        {
          locale: 'es',
          title: 'Módulo Dos',
          description: 'Descripción Módulo Dos',
        },
      ],
      order: 2,
    };

    const res = await request(app.getHttpServer())
      .post(`/courses/${courseId}/modules`)
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

  it('[POST] /courses/:courseId/modules - Duplicate Module Order', async () => {
    // First create order=3
    await request(app.getHttpServer())
      .post(`/courses/${courseId}/modules`)
      .send({
        slug: 'modulo-3',
        translations: [
          { locale: 'pt', title: 'Módulo Três', description: 'Descrição Três' },
          { locale: 'it', title: 'Modulo Tre', description: 'Descrizione Tre' },
          {
            locale: 'es',
            title: 'Módulo Tres',
            description: 'Descripción Tres',
          },
        ],
        order: 3,
      });

    const res = await request(app.getHttpServer())
      .post(`/courses/${courseId}/modules`)
      .send({
        slug: 'modulo-3b',
        translations: [
          {
            locale: 'pt',
            title: 'Módulo Três B',
            description: 'Descrição Três B',
          },
          {
            locale: 'it',
            title: 'Modulo Tre B',
            description: 'Descrizione Tre B',
          },
          {
            locale: 'es',
            title: 'Módulo Tres B',
            description: 'Descripción Tres B',
          },
        ],
        order: 3,
      });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('message');
  });

  it('[POST] /courses/:courseId/modules - Course Not Found', async () => {
    const fakeCourseId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const payload = {
      slug: 'modulo-x',
      translations: [
        { locale: 'pt', title: 'Módulo X', description: 'Descrição X' },
        { locale: 'it', title: 'Modulo X', description: 'Descrizione X' },
        { locale: 'es', title: 'Módulo X', description: 'Descripción X' },
      ],
      order: 1,
    };

    const res = await request(app.getHttpServer())
      .post(`/courses/${fakeCourseId}/modules`)
      .send(payload);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });

  it('[POST] /courses/:courseId/modules - Invalid Slug Format', async () => {
    const payload = {
      slug: 'Invalid Slug!',
      translations: [
        { locale: 'pt', title: 'Módulo Y', description: 'Descrição Y' },
        { locale: 'it', title: 'Modulo Y', description: 'Descrizione Y' },
        { locale: 'es', title: 'Módulo Y', description: 'Descripción Y' },
      ],
      order: 4,
    };

    const res = await request(app.getHttpServer())
      .post(`/courses/${courseId}/modules`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('invalid-slug');
  });

  it('[GET] /courses/:courseId/modules/:moduleId - Success', async () => {
    // Create a module first
    const createRes = await request(app.getHttpServer())
      .post(`/courses/${courseId}/modules`)
      .send({
        slug: 'modulo-det',
        translations: [
          {
            locale: 'pt',
            title: 'Módulo Detalhe',
            description: 'Desc Detalhe',
          },
          {
            locale: 'it',
            title: 'Modulo Dettaglio',
            description: 'Desc Dettaglio',
          },
          {
            locale: 'es',
            title: 'Módulo Detalle',
            description: 'Desc Detalle',
          },
        ],
        order: 5,
      });

    const moduleId = createRes.body.id;

    const res = await request(app.getHttpServer()).get(
      `/courses/${courseId}/modules/${moduleId}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', moduleId);
    expect(res.body).toHaveProperty('slug', 'modulo-det');
    expect(res.body).toHaveProperty('order', 5);
    expect(res.body.translations).toEqual(
      expect.arrayContaining([
        { locale: 'pt', title: 'Módulo Detalhe', description: 'Desc Detalhe' },
        {
          locale: 'it',
          title: 'Modulo Dettaglio',
          description: 'Desc Dettaglio',
        },
        { locale: 'es', title: 'Módulo Detalle', description: 'Desc Detalle' },
      ]),
    );
  });
});
