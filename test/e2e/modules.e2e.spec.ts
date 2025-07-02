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

  describe('Delete Module (E2E)', () => {
    it('[DELETE] /courses/:courseId/modules/:moduleId - Success', async () => {
      // Create a module to delete
      const createRes = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'modulo-para-deletar',
          translations: [
            {
              locale: 'pt',
              title: 'Módulo Para Deletar',
              description: 'Este módulo será deletado',
            },
            {
              locale: 'it',
              title: 'Modulo da Cancellare',
              description: 'Questo modulo sarà cancellato',
            },
            {
              locale: 'es',
              title: 'Módulo Para Eliminar',
              description: 'Este módulo será eliminado',
            },
          ],
          order: 10,
        });

      const moduleId = createRes.body.id;

      // Delete the module
      const deleteRes = await request(app.getHttpServer()).delete(
        `/courses/${courseId}/modules/${moduleId}`,
      );

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body).toHaveProperty(
        'message',
        'Module deleted successfully',
      );
      expect(deleteRes.body).toHaveProperty('deletedAt');
      expect(new Date(deleteRes.body.deletedAt)).toBeInstanceOf(Date);

      // Verify module was deleted
      const getRes = await request(app.getHttpServer()).get(
        `/courses/${courseId}/modules/${moduleId}`,
      );

      expect(getRes.status).toBe(404);
    });

    it('[DELETE] /courses/:courseId/modules/:moduleId - Module Not Found', async () => {
      const nonExistentModuleId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

      const res = await request(app.getHttpServer()).delete(
        `/courses/${courseId}/modules/${nonExistentModuleId}`,
      );

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Module not found');
    });

    it('[DELETE] /courses/:courseId/modules/:moduleId - Invalid Module ID', async () => {
      const invalidModuleId = 'invalid-uuid-format';

      const res = await request(app.getHttpServer()).delete(
        `/courses/${courseId}/modules/${invalidModuleId}`,
      );

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Module ID must be a valid UUID',
            path: ['id'],
          }),
        ]),
      );
    });

    it('[DELETE] /courses/:courseId/modules/:moduleId - Module with Dependencies', async () => {
      // Create a module
      const moduleRes = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'modulo-com-licoes',
          translations: [
            {
              locale: 'pt',
              title: 'Módulo com Lições',
              description: 'Este módulo tem lições',
            },
            {
              locale: 'it',
              title: 'Modulo con Lezioni',
              description: 'Questo modulo ha lezioni',
            },
            {
              locale: 'es',
              title: 'Módulo con Lecciones',
              description: 'Este módulo tiene lecciones',
            },
          ],
          order: 20,
        });

      const moduleId = moduleRes.body.id;

      // Create a lesson for this module
      await prisma.lesson.create({
        data: {
          id: 'lesson-1',
          moduleId: moduleId,
          translations: {
            create: [
              {
                locale: 'pt',
                title: 'Lição 1',
                description: 'Primeira lição',
              },
            ],
          },
        },
      });

      // Try to delete the module with dependencies
      const deleteRes = await request(app.getHttpServer()).delete(
        `/courses/${courseId}/modules/${moduleId}`,
      );

      expect(deleteRes.status).toBe(409);
      expect(deleteRes.body).toHaveProperty('message');
      expect(deleteRes.body.message).toContain(
        'Cannot delete module because it has dependencies',
      );
      expect(deleteRes.body).toHaveProperty('dependencyInfo');
      expect(deleteRes.body.dependencyInfo).toMatchObject({
        canDelete: false,
        totalDependencies: 1,
        summary: {
          lessons: 1,
          videos: 0,
        },
      });

      // Clean up the lesson
      await prisma.lessonTranslation.deleteMany({
        where: { lessonId: 'lesson-1' },
      });
      await prisma.lesson.delete({ where: { id: 'lesson-1' } });
    });

    it('[DELETE] /courses/:courseId/modules/:moduleId - Empty Module ID', async () => {
      const res = await request(app.getHttpServer()).delete(
        `/courses/${courseId}/modules/`,
      );

      // This should return 404 because the route won't match
      expect(res.status).toBe(404);
    });

    it('[DELETE] /courses/:courseId/modules/:moduleId - SQL Injection Attempt', async () => {
      const maliciousId = "'; DROP TABLE modules; --";

      const res = await request(app.getHttpServer()).delete(
        `/courses/${courseId}/modules/${encodeURIComponent(maliciousId)}`,
      );

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('[DELETE] /courses/:courseId/modules/:moduleId - Concurrent Deletion', async () => {
      // Create a module
      const createRes = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'modulo-concorrente',
          translations: [
            {
              locale: 'pt',
              title: 'Módulo Concorrente',
              description: 'Teste concorrência',
            },
            {
              locale: 'it',
              title: 'Modulo Concorrente',
              description: 'Test concorrenza',
            },
            {
              locale: 'es',
              title: 'Módulo Concurrente',
              description: 'Prueba concurrencia',
            },
          ],
          order: 30,
        });

      const moduleId = createRes.body.id;

      // First deletion should succeed
      const firstDelete = await request(app.getHttpServer()).delete(
        `/courses/${courseId}/modules/${moduleId}`,
      );

      expect(firstDelete.status).toBe(200);

      // Second deletion should fail with 404
      const secondDelete = await request(app.getHttpServer()).delete(
        `/courses/${courseId}/modules/${moduleId}`,
      );

      expect(secondDelete.status).toBe(404);
    });

    it('[DELETE] /courses/:courseId/modules/:moduleId - Very Long Module ID', async () => {
      const veryLongId = 'a'.repeat(1000);

      const res = await request(app.getHttpServer()).delete(
        `/courses/${courseId}/modules/${veryLongId}`,
      );

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('[DELETE] /courses/:courseId/modules/:moduleId - Module from Different Course', async () => {
      // Create a second course
      const secondCourseRes = await request(app.getHttpServer())
        .post('/courses')
        .send({
          slug: 'curso-diferente',
          translations: [
            {
              locale: 'pt',
              title: 'Curso Diferente',
              description: 'Outro curso',
            },
            {
              locale: 'it',
              title: 'Corso Diverso',
              description: 'Altro corso',
            },
            {
              locale: 'es',
              title: 'Curso Diferente',
              description: 'Otro curso',
            },
          ],
        });

      const secondCourseId = secondCourseRes.body.id;

      // Create a module in the second course
      const moduleRes = await request(app.getHttpServer())
        .post(`/courses/${secondCourseId}/modules`)
        .send({
          slug: 'modulo-outro-curso',
          translations: [
            {
              locale: 'pt',
              title: 'Módulo Outro Curso',
              description: 'Módulo de outro curso',
            },
            {
              locale: 'it',
              title: 'Modulo Altro Corso',
              description: 'Modulo di altro corso',
            },
            {
              locale: 'es',
              title: 'Módulo Otro Curso',
              description: 'Módulo de otro curso',
            },
          ],
          order: 40,
        });

      const moduleId = moduleRes.body.id;

      // Try to delete the module using the first course ID (different from where it was created)
      // The API should still allow this since the module ID is unique
      const deleteRes = await request(app.getHttpServer()).delete(
        `/courses/${courseId}/modules/${moduleId}`,
      );

      expect(deleteRes.status).toBe(200);

      // Clean up
      await prisma.courseTranslation.deleteMany({
        where: { courseId: secondCourseId },
      });
      await prisma.course.delete({ where: { id: secondCourseId } });
    });

    it('[DELETE] /courses/:courseId/modules/:moduleId - Verify Cascade Deletion', async () => {
      // Create a module with translations
      const createRes = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'modulo-cascade',
          translations: [
            {
              locale: 'pt',
              title: 'Módulo Cascade',
              description: 'Teste de cascade',
            },
            {
              locale: 'it',
              title: 'Modulo Cascade',
              description: 'Test di cascade',
            },
            {
              locale: 'es',
              title: 'Módulo Cascade',
              description: 'Prueba de cascade',
            },
          ],
          order: 50,
        });

      const moduleId = createRes.body.id;

      // Verify translations exist
      const translationsBefore = await prisma.moduleTranslation.findMany({
        where: { moduleId },
      });
      expect(translationsBefore).toHaveLength(3);

      // Delete the module
      const deleteRes = await request(app.getHttpServer()).delete(
        `/courses/${courseId}/modules/${moduleId}`,
      );

      expect(deleteRes.status).toBe(200);

      // Verify translations were also deleted
      const translationsAfter = await prisma.moduleTranslation.findMany({
        where: { moduleId },
      });
      expect(translationsAfter).toHaveLength(0);
    });
  });
});
