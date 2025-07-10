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

    // Clean database in correct order respecting foreign keys
    await cleanDatabase();

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
    await cleanDatabase();
    await app.close();
  });

  const cleanDatabase = async () => {
    // Clean in correct order respecting foreign keys
    await prisma.lessonDocumentTranslation.deleteMany();
    await prisma.lessonDocument.deleteMany();

    await prisma.videoSeen.deleteMany();
    await prisma.videoTranslation.deleteMany();
    await prisma.videoLink.deleteMany();
    await prisma.video.deleteMany();

    await prisma.attemptAnswer.deleteMany();
    await prisma.attempt.deleteMany();
    await prisma.answerTranslation.deleteMany();
    await prisma.answer.deleteMany();
    await prisma.questionOption.deleteMany();
    await prisma.question.deleteMany();
    await prisma.argument.deleteMany();
    await prisma.assessment.deleteMany();

    await prisma.lessonTranslation.deleteMany();
    await prisma.lesson.deleteMany();

    await prisma.moduleTranslation.deleteMany();
    await prisma.moduleVideoLink.deleteMany();
    await prisma.module.deleteMany();

    await prisma.courseTranslation.deleteMany();
    await prisma.courseVideoLink.deleteMany();
    await prisma.trackCourse.deleteMany();
    await prisma.course.deleteMany();

    await prisma.trackTranslation.deleteMany();
    await prisma.track.deleteMany();

    await prisma.address.deleteMany();
    await prisma.user.deleteMany();
  };

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

  describe('Update Module (E2E)', () => {
    it('[PATCH] /courses/:courseId/modules/:moduleId - Update Slug Successfully', async () => {
      // Create a module first
      const createRes = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'modulo-original',
          translations: [
            { locale: 'pt', title: 'Original', description: 'Desc Original' },
            { locale: 'it', title: 'Originale', description: 'Desc Originale' },
            { locale: 'es', title: 'Original', description: 'Desc Original' },
          ],
          order: 60,
        });

      const moduleId = createRes.body.id;

      // Update the slug
      const updateRes = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/modules/${moduleId}`)
        .send({
          slug: 'modulo-atualizado',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body).toHaveProperty('id', moduleId);
      expect(updateRes.body.slug).toBe('modulo-atualizado');
      expect(updateRes.body.order).toBe(60); // Should remain unchanged
    });

    it('[PATCH] /courses/:courseId/modules/:moduleId - Update Order Successfully', async () => {
      // Create a module
      const createRes = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'modulo-order-test',
          translations: [
            { locale: 'pt', title: 'Order Test', description: 'Test Order' },
            { locale: 'it', title: 'Test Ordine', description: 'Test Ordine' },
            { locale: 'es', title: 'Test Orden', description: 'Test Orden' },
          ],
          order: 70,
        });

      const moduleId = createRes.body.id;

      // Update the order
      const updateRes = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/modules/${moduleId}`)
        .send({
          order: 75,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.order).toBe(75);
      expect(updateRes.body.slug).toBe('modulo-order-test'); // Should remain unchanged
    });

    it('[PATCH] /courses/:courseId/modules/:moduleId - Update Image URL', async () => {
      // Create a module with an image
      const createRes = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'modulo-image',
          imageUrl: 'https://example.com/old-image.jpg',
          translations: [
            { locale: 'pt', title: 'Image Test', description: 'Test Image' },
            {
              locale: 'it',
              title: 'Test Immagine',
              description: 'Test Immagine',
            },
            { locale: 'es', title: 'Test Imagen', description: 'Test Imagen' },
          ],
          order: 80,
        });

      const moduleId = createRes.body.id;

      // Update the image URL
      const updateRes = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/modules/${moduleId}`)
        .send({
          imageUrl: 'https://example.com/new-image.jpg',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.imageUrl).toBe('https://example.com/new-image.jpg');
    });

    it('[PATCH] /courses/:courseId/modules/:moduleId - Remove Image URL', async () => {
      // Create a module with an image
      const createRes = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'modulo-remove-image',
          imageUrl: 'https://example.com/image-to-remove.jpg',
          translations: [
            { locale: 'pt', title: 'Remove Image', description: 'Test Remove' },
            {
              locale: 'it',
              title: 'Rimuovi Immagine',
              description: 'Test Rimuovi',
            },
            {
              locale: 'es',
              title: 'Quitar Imagen',
              description: 'Test Quitar',
            },
          ],
          order: 85,
        });

      const moduleId = createRes.body.id;

      // Remove the image URL
      const updateRes = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/modules/${moduleId}`)
        .send({
          imageUrl: null,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.imageUrl).toBeUndefined();
    });

    it('[PATCH] /courses/:courseId/modules/:moduleId - Update Translations', async () => {
      // Create a module
      const createRes = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'modulo-trans',
          translations: [
            {
              locale: 'pt',
              title: 'Título Antigo',
              description: 'Desc Antiga',
            },
            {
              locale: 'it',
              title: 'Titolo Vecchio',
              description: 'Desc Vecchia',
            },
            { locale: 'es', title: 'Título Viejo', description: 'Desc Vieja' },
          ],
          order: 90,
        });

      const moduleId = createRes.body.id;

      // Update translations
      const updateRes = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/modules/${moduleId}`)
        .send({
          translations: [
            { locale: 'pt', title: 'Título Novo', description: 'Desc Nova' },
            { locale: 'it', title: 'Titolo Nuovo', description: 'Desc Nuova' },
            { locale: 'es', title: 'Título Nuevo', description: 'Desc Nueva' },
          ],
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body).toHaveProperty('id', moduleId);
      expect(updateRes.body.slug).toBe('modulo-trans');
      expect(updateRes.body.order).toBe(90);

      // Make a GET request to verify translations were updated
      const getRes = await request(app.getHttpServer()).get(
        `/courses/${courseId}/modules/${moduleId}`,
      );

      expect(getRes.status).toBe(200);
      expect(getRes.body.translations).toEqual(
        expect.arrayContaining([
          { locale: 'pt', title: 'Título Novo', description: 'Desc Nova' },
          { locale: 'it', title: 'Titolo Nuovo', description: 'Desc Nuova' },
          { locale: 'es', title: 'Título Nuevo', description: 'Desc Nueva' },
        ]),
      );
    });

    it('[PATCH] /courses/:courseId/modules/:moduleId - Update Multiple Fields', async () => {
      // Create a module
      const createRes = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'modulo-multi',
          imageUrl: 'https://example.com/original.jpg',
          translations: [
            { locale: 'pt', title: 'Multi Original', description: 'Original' },
            {
              locale: 'it',
              title: 'Multi Originale',
              description: 'Originale',
            },
            { locale: 'es', title: 'Multi Original', description: 'Original' },
          ],
          order: 95,
        });

      const moduleId = createRes.body.id;

      // Update multiple fields
      const updateRes = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/modules/${moduleId}`)
        .send({
          slug: 'modulo-multi-updated',
          imageUrl: 'https://example.com/updated.jpg',
          order: 96,
          translations: [
            {
              locale: 'pt',
              title: 'Multi Atualizado',
              description: 'Atualizado',
            },
            {
              locale: 'it',
              title: 'Multi Aggiornato',
              description: 'Aggiornato',
            },
            {
              locale: 'es',
              title: 'Multi Actualizado',
              description: 'Actualizado',
            },
          ],
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.slug).toBe('modulo-multi-updated');
      expect(updateRes.body.imageUrl).toBe('https://example.com/updated.jpg');
      expect(updateRes.body.order).toBe(96);

      // Make a GET request to verify all updates including translations
      const getRes = await request(app.getHttpServer()).get(
        `/courses/${courseId}/modules/${moduleId}`,
      );

      expect(getRes.status).toBe(200);
      expect(getRes.body.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ locale: 'pt', title: 'Multi Atualizado' }),
        ]),
      );
    });

    it('[PATCH] /courses/:courseId/modules/:moduleId - Module Not Found', async () => {
      const nonExistentId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

      const res = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/modules/${nonExistentId}`)
        .send({
          slug: 'new-slug',
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Module not found');
    });

    it('[PATCH] /courses/:courseId/modules/:moduleId - Invalid Module ID', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/modules/invalid-uuid`)
        .send({
          slug: 'new-slug',
        });

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

    it('[PATCH] /courses/:courseId/modules/:moduleId - Duplicate Slug', async () => {
      // Create two modules
      await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'existing-slug',
          translations: [
            { locale: 'pt', title: 'Existing', description: 'Existing' },
            { locale: 'it', title: 'Esistente', description: 'Esistente' },
            { locale: 'es', title: 'Existente', description: 'Existente' },
          ],
          order: 100,
        });

      const createRes2 = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'module-to-update',
          translations: [
            { locale: 'pt', title: 'To Update', description: 'To Update' },
            {
              locale: 'it',
              title: 'Da Aggiornare',
              description: 'Da Aggiornare',
            },
            {
              locale: 'es',
              title: 'Para Actualizar',
              description: 'Para Actualizar',
            },
          ],
          order: 101,
        });

      const moduleId = createRes2.body.id;

      // Try to update with existing slug
      const res = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/modules/${moduleId}`)
        .send({
          slug: 'existing-slug',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });

    it('[PATCH] /courses/:courseId/modules/:moduleId - Duplicate Order', async () => {
      // Create two modules
      await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'module-order-1',
          translations: [
            { locale: 'pt', title: 'Order 1', description: 'Order 1' },
            { locale: 'it', title: 'Ordine 1', description: 'Ordine 1' },
            { locale: 'es', title: 'Orden 1', description: 'Orden 1' },
          ],
          order: 110,
        });

      const createRes2 = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'module-order-2',
          translations: [
            { locale: 'pt', title: 'Order 2', description: 'Order 2' },
            { locale: 'it', title: 'Ordine 2', description: 'Ordine 2' },
            { locale: 'es', title: 'Orden 2', description: 'Orden 2' },
          ],
          order: 111,
        });

      const moduleId = createRes2.body.id;

      // Try to update with existing order
      const res = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/modules/${moduleId}`)
        .send({
          order: 110,
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('order already exists');
    });

    it('[PATCH] /courses/:courseId/modules/:moduleId - Invalid Slug Format', async () => {
      // Create a module
      const createRes = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'valid-slug',
          translations: [
            { locale: 'pt', title: 'Valid', description: 'Valid' },
            { locale: 'it', title: 'Valido', description: 'Valido' },
            { locale: 'es', title: 'Válido', description: 'Válido' },
          ],
          order: 120,
        });

      const moduleId = createRes.body.id;

      // Try to update with invalid slug
      const res = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/modules/${moduleId}`)
        .send({
          slug: 'Invalid Slug!',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message:
              'Slug must contain only lowercase letters, numbers, and hyphens',
            path: ['slug'],
          }),
        ]),
      );
    });

    it('[PATCH] /courses/:courseId/modules/:moduleId - Invalid Image URL', async () => {
      // Create a module
      const createRes = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'module-invalid-url',
          translations: [
            { locale: 'pt', title: 'Invalid URL', description: 'Invalid URL' },
            {
              locale: 'it',
              title: 'URL Non Valido',
              description: 'URL Non Valido',
            },
            {
              locale: 'es',
              title: 'URL Inválida',
              description: 'URL Inválida',
            },
          ],
          order: 125,
        });

      const moduleId = createRes.body.id;

      // Try to update with invalid URL
      const res = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/modules/${moduleId}`)
        .send({
          imageUrl: 'not-a-url',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      // The error message format might be different
      // It could be a simple array of strings instead of objects
      const messages = Array.isArray(res.body.message)
        ? res.body.message
        : [res.body.message];
      const hasUrlError = messages.some((msg) =>
        typeof msg === 'string'
          ? msg.includes('imageUrl must be a valid URL')
          : msg.message?.includes('imageUrl must be a valid URL'),
      );
      expect(hasUrlError).toBe(true);
    });

    it('[PATCH] /courses/:courseId/modules/:moduleId - Missing Portuguese Translation', async () => {
      // Create a module
      const createRes = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'module-missing-pt',
          translations: [
            { locale: 'pt', title: 'Has PT', description: 'Has PT' },
            { locale: 'it', title: 'Ha IT', description: 'Ha IT' },
            { locale: 'es', title: 'Tiene ES', description: 'Tiene ES' },
          ],
          order: 130,
        });

      const moduleId = createRes.body.id;

      // Try to update without Portuguese
      const res = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/modules/${moduleId}`)
        .send({
          translations: [
            { locale: 'it', title: 'Solo IT', description: 'Solo IT' },
            { locale: 'es', title: 'Solo ES', description: 'Solo ES' },
          ],
        });

      expect(res.status).toBe(400);
      const msgs: any[] = res.body.message;
      const hasPtError = msgs.some((m) =>
        m.message?.toLowerCase().includes('portuguese'),
      );
      expect(hasPtError).toBe(true);
    });

    it('[PATCH] /courses/:courseId/modules/:moduleId - Empty Update Body', async () => {
      // Create a module
      const createRes = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'module-empty-update',
          translations: [
            {
              locale: 'pt',
              title: 'Empty Update',
              description: 'Empty Update',
            },
            {
              locale: 'it',
              title: 'Aggiornamento Vuoto',
              description: 'Aggiornamento Vuoto',
            },
            {
              locale: 'es',
              title: 'Actualización Vacía',
              description: 'Actualización Vacía',
            },
          ],
          order: 135,
        });

      const moduleId = createRes.body.id;

      // Try to update with empty body
      const res = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/modules/${moduleId}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'At least one field must be provided for update',
          }),
        ]),
      );
    });

    it('[PATCH] /courses/:courseId/modules/:moduleId - Verify Translations Update', async () => {
      // Create a module
      const createRes = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'module-verify-trans',
          translations: [
            { locale: 'pt', title: 'Original PT', description: 'Desc PT' },
            { locale: 'it', title: 'Original IT', description: 'Desc IT' },
            { locale: 'es', title: 'Original ES', description: 'Desc ES' },
          ],
          order: 140,
        });

      const moduleId = createRes.body.id;

      // Verify original translations in DB
      const originalTrans = await prisma.moduleTranslation.findMany({
        where: { moduleId },
      });
      expect(originalTrans).toHaveLength(3);

      // Update translations
      await request(app.getHttpServer())
        .patch(`/courses/${courseId}/modules/${moduleId}`)
        .send({
          translations: [
            { locale: 'pt', title: 'Updated PT', description: 'New Desc PT' },
            { locale: 'it', title: 'Updated IT', description: 'New Desc IT' },
            { locale: 'es', title: 'Updated ES', description: 'New Desc ES' },
          ],
        });

      // Verify translations were replaced
      const updatedTrans = await prisma.moduleTranslation.findMany({
        where: { moduleId },
      });
      expect(updatedTrans).toHaveLength(3);

      const ptTrans = updatedTrans.find((t) => t.locale === 'pt');
      expect(ptTrans?.title).toBe('Updated PT');
      expect(ptTrans?.description).toBe('New Desc PT');
    });

    it('[PATCH] /courses/:courseId/modules/:moduleId - Update Same Slug (No Change)', async () => {
      // Create a module
      const createRes = await request(app.getHttpServer())
        .post(`/courses/${courseId}/modules`)
        .send({
          slug: 'same-slug-test',
          translations: [
            { locale: 'pt', title: 'Same Slug', description: 'Same Slug' },
            { locale: 'it', title: 'Stesso Slug', description: 'Stesso Slug' },
            { locale: 'es', title: 'Mismo Slug', description: 'Mismo Slug' },
          ],
          order: 145,
        });

      const moduleId = createRes.body.id;

      // Update with the same slug (should succeed)
      const res = await request(app.getHttpServer())
        .patch(`/courses/${courseId}/modules/${moduleId}`)
        .send({
          slug: 'same-slug-test',
          order: 146, // Change something else to ensure update works
        });

      expect(res.status).toBe(200);
      expect(res.body.slug).toBe('same-slug-test');
      expect(res.body.order).toBe(146);
    });
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

      // Create a lesson for this module with required fields
      await prisma.lesson.create({
        data: {
          id: 'lesson-1',
          slug: 'lesson-1-slug', // Required field
          moduleId: moduleId,
          order: 1, // Required field
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
