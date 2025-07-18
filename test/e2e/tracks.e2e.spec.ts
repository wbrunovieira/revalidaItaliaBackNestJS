// test/e2e/tracks.e2e.spec.ts
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';

import { AppModule } from '../../src/app.module';
import { E2ETestModule } from './test-helpers/e2e-test-module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Track API (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const { app: testApp } = await E2ETestModule.create([AppModule]);
    app = testApp;

    prisma = app.get(PrismaService);
    await prisma.trackTranslation.deleteMany({});
    await prisma.trackCourse.deleteMany({});
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
    await app.close();
  });

  afterEach(async () => {
    // Limpar dados após cada teste para evitar interferências
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
    // Criar dados de teste primeiro
    const courseRes = await request(app.getHttpServer())
      .post('/courses')
      .send({
        slug: 'curso-list-test',
        translations: [
          { locale: 'pt', title: 'Curso List PT', description: 'Desc List PT' },
          { locale: 'it', title: 'Corso List IT', description: 'Desc List IT' },
          { locale: 'es', title: 'Curso List ES', description: 'Desc List ES' },
        ],
      });
    const courseId = courseRes.body.id;

    await request(app.getHttpServer())
      .post('/tracks')
      .send({
        slug: 'trilha-list-test',
        courseIds: [courseId],
        translations: [
          {
            locale: 'pt',
            title: 'Trilha List PT',
            description: 'Desc List PT',
          },
          {
            locale: 'it',
            title: 'Traccia List IT',
            description: 'Desc List IT',
          },
          { locale: 'es', title: 'Pista List ES', description: 'Desc List ES' },
        ],
      });

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

  describe('[PUT] /tracks/:id', () => {
    it('should update track successfully with all fields', async () => {
      // Criar cursos
      const course1Res = await request(app.getHttpServer())
        .post('/courses')
        .send({
          slug: 'curso-update-1',
          translations: [
            {
              locale: 'pt',
              title: 'Curso Update 1 PT',
              description: 'Desc Update 1 PT',
            },
            {
              locale: 'it',
              title: 'Corso Update 1 IT',
              description: 'Desc Update 1 IT',
            },
            {
              locale: 'es',
              title: 'Curso Update 1 ES',
              description: 'Desc Update 1 ES',
            },
          ],
        });
      const course1Id = course1Res.body.id;

      const course2Res = await request(app.getHttpServer())
        .post('/courses')
        .send({
          slug: 'curso-update-2',
          translations: [
            {
              locale: 'pt',
              title: 'Curso Update 2 PT',
              description: 'Desc Update 2 PT',
            },
            {
              locale: 'it',
              title: 'Corso Update 2 IT',
              description: 'Desc Update 2 IT',
            },
            {
              locale: 'es',
              title: 'Curso Update 2 ES',
              description: 'Desc Update 2 ES',
            },
          ],
        });
      const course2Id = course2Res.body.id;

      // Criar track inicial
      const trackRes = await request(app.getHttpServer())
        .post('/tracks')
        .send({
          slug: 'trilha-original',
          imageUrl: 'https://example.com/original-image.jpg',
          courseIds: [course1Id],
          translations: [
            {
              locale: 'pt',
              title: 'Trilha Original PT',
              description: 'Desc Original PT',
            },
            {
              locale: 'it',
              title: 'Traccia Originale IT',
              description: 'Desc Originale IT',
            },
            {
              locale: 'es',
              title: 'Pista Original ES',
              description: 'Desc Original ES',
            },
          ],
        });
      const trackId = trackRes.body.id;

      // Atualizar track
      const updateRes = await request(app.getHttpServer())
        .put(`/tracks/${trackId}`)
        .send({
          slug: 'trilha-atualizada',
          imageUrl: 'https://example.com/updated-image.jpg',
          courseIds: [course1Id, course2Id],
          translations: [
            {
              locale: 'pt',
              title: 'Trilha Atualizada PT',
              description: 'Desc Atualizada PT',
            },
            {
              locale: 'it',
              title: 'Traccia Aggiornata IT',
              description: 'Desc Aggiornata IT',
            },
            {
              locale: 'es',
              title: 'Pista Actualizada ES',
              description: 'Desc Actualizada ES',
            },
          ],
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.slug).toBe('trilha-atualizada');
      expect(updateRes.body.imageUrl).toBe(
        'https://example.com/updated-image.jpg',
      );
      expect(updateRes.body.courseIds).toEqual(
        expect.arrayContaining([course1Id, course2Id]),
      );
      expect(updateRes.body.title).toBe('Trilha Atualizada PT');
      expect(updateRes.body.updatedAt).toBeDefined();

      // Verificar se foi realmente atualizado
      const getRes = await request(app.getHttpServer()).get(
        `/tracks/${trackId}`,
      );
      expect(getRes.status).toBe(200);
      expect(getRes.body.slug).toBe('trilha-atualizada');
    });

    it('should update track with empty courseIds array', async () => {
      // Criar curso
      const courseRes = await request(app.getHttpServer())
        .post('/courses')
        .send({
          slug: 'curso-empty-test',
          translations: [
            {
              locale: 'pt',
              title: 'Curso Empty PT',
              description: 'Desc Empty PT',
            },
            {
              locale: 'it',
              title: 'Corso Empty IT',
              description: 'Desc Empty IT',
            },
            {
              locale: 'es',
              title: 'Curso Empty ES',
              description: 'Desc Empty ES',
            },
          ],
        });
      const courseId = courseRes.body.id;

      // Criar track inicial
      const trackRes = await request(app.getHttpServer())
        .post('/tracks')
        .send({
          slug: 'trilha-com-curso',
          courseIds: [courseId],
          translations: [
            {
              locale: 'pt',
              title: 'Trilha Com Curso PT',
              description: 'Desc Com Curso PT',
            },
            {
              locale: 'it',
              title: 'Traccia Con Corso IT',
              description: 'Desc Con Corso IT',
            },
            {
              locale: 'es',
              title: 'Pista Con Curso ES',
              description: 'Desc Con Curso ES',
            },
          ],
        });
      const trackId = trackRes.body.id;

      // Atualizar para remover todos os cursos
      const updateRes = await request(app.getHttpServer())
        .put(`/tracks/${trackId}`)
        .send({
          slug: 'trilha-sem-curso',
          courseIds: [],
          translations: [
            {
              locale: 'pt',
              title: 'Trilha Sem Curso PT',
              description: 'Desc Sem Curso PT',
            },
            {
              locale: 'it',
              title: 'Traccia Senza Corso IT',
              description: 'Desc Senza Corso IT',
            },
            {
              locale: 'es',
              title: 'Pista Sin Curso ES',
              description: 'Desc Sin Curso ES',
            },
          ],
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.courseIds).toEqual([]);
      expect(updateRes.body.slug).toBe('trilha-sem-curso');

      // Verificar que associações foram removidas do banco
      const associations = await prisma.trackCourse.findMany({
        where: { trackId: trackId },
      });
      expect(associations).toHaveLength(0);
    });

    it('should update track removing imageUrl', async () => {
      // Criar curso
      const courseRes = await request(app.getHttpServer())
        .post('/courses')
        .send({
          slug: 'curso-image-test',
          translations: [
            {
              locale: 'pt',
              title: 'Curso Image PT',
              description: 'Desc Image PT',
            },
            {
              locale: 'it',
              title: 'Corso Image IT',
              description: 'Desc Image IT',
            },
            {
              locale: 'es',
              title: 'Curso Image ES',
              description: 'Desc Image ES',
            },
          ],
        });
      const courseId = courseRes.body.id;

      // Criar track com imagem
      const trackRes = await request(app.getHttpServer())
        .post('/tracks')
        .send({
          slug: 'trilha-com-imagem',
          imageUrl: 'https://example.com/image-to-remove.jpg',
          courseIds: [courseId],
          translations: [
            {
              locale: 'pt',
              title: 'Trilha Com Imagem PT',
              description: 'Desc Com Imagem PT',
            },
            {
              locale: 'it',
              title: 'Traccia Con Immagine IT',
              description: 'Desc Con Immagine IT',
            },
            {
              locale: 'es',
              title: 'Pista Con Imagen ES',
              description: 'Desc Con Imagen ES',
            },
          ],
        });
      const trackId = trackRes.body.id;

      // Atualizar removendo a imagem
      const updateRes = await request(app.getHttpServer())
        .put(`/tracks/${trackId}`)
        .send({
          slug: 'trilha-sem-imagem',
          imageUrl: '',
          courseIds: [courseId],
          translations: [
            {
              locale: 'pt',
              title: 'Trilha Sem Imagem PT',
              description: 'Desc Sem Imagem PT',
            },
            {
              locale: 'it',
              title: 'Traccia Senza Immagine IT',
              description: 'Desc Senza Immagine IT',
            },
            {
              locale: 'es',
              title: 'Pista Sin Imagen ES',
              description: 'Desc Sin Imagen ES',
            },
          ],
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.imageUrl).toBe('');
      expect(updateRes.body.slug).toBe('trilha-sem-imagem');
    });

    it('should return 404 when trying to update non-existent track', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const updateRes = await request(app.getHttpServer())
        .put(`/tracks/${nonExistentId}`)
        .send({
          slug: 'trilha-inexistente',
          courseIds: [],
          translations: [
            {
              locale: 'pt',
              title: 'Trilha Inexistente PT',
              description: 'Desc Inexistente PT',
            },
          ],
        });

      expect(updateRes.status).toBe(404);
    });

    it('should return 400 for invalid track ID format', async () => {
      const invalidId = 'invalid-uuid-format';

      const updateRes = await request(app.getHttpServer())
        .put(`/tracks/${invalidId}`)
        .send({
          slug: 'trilha-id-invalido',
          courseIds: [],
          translations: [
            {
              locale: 'pt',
              title: 'Trilha ID Inválido PT',
              description: 'Desc ID Inválido PT',
            },
          ],
        });

      expect(updateRes.status).toBe(400);
    });

    it('should return 409 when trying to update with existing slug', async () => {
      // Criar curso
      const courseRes = await request(app.getHttpServer())
        .post('/courses')
        .send({
          slug: 'curso-conflict-test',
          translations: [
            {
              locale: 'pt',
              title: 'Curso Conflict PT',
              description: 'Desc Conflict PT',
            },
            {
              locale: 'it',
              title: 'Corso Conflict IT',
              description: 'Desc Conflict IT',
            },
            {
              locale: 'es',
              title: 'Curso Conflict ES',
              description: 'Desc Conflict ES',
            },
          ],
        });
      const courseId = courseRes.body.id;

      // Criar primeiro track
      await request(app.getHttpServer())
        .post('/tracks')
        .send({
          slug: 'trilha-existente',
          courseIds: [courseId],
          translations: [
            {
              locale: 'pt',
              title: 'Trilha Existente PT',
              description: 'Desc Existente PT',
            },
            {
              locale: 'it',
              title: 'Traccia Esistente IT',
              description: 'Desc Esistente IT',
            },
            {
              locale: 'es',
              title: 'Pista Existente ES',
              description: 'Desc Existente ES',
            },
          ],
        });

      // Criar segundo track
      const track2Res = await request(app.getHttpServer())
        .post('/tracks')
        .send({
          slug: 'trilha-segunda',
          courseIds: [courseId],
          translations: [
            {
              locale: 'pt',
              title: 'Trilha Segunda PT',
              description: 'Desc Segunda PT',
            },
            {
              locale: 'it',
              title: 'Traccia Seconda IT',
              description: 'Desc Seconda IT',
            },
            {
              locale: 'es',
              title: 'Pista Segunda ES',
              description: 'Desc Segunda ES',
            },
          ],
        });
      const track2Id = track2Res.body.id;

      // Tentar atualizar segundo track com slug do primeiro
      const updateRes = await request(app.getHttpServer())
        .put(`/tracks/${track2Id}`)
        .send({
          slug: 'trilha-existente', // Slug já existe
          courseIds: [courseId],
          translations: [
            {
              locale: 'pt',
              title: 'Trilha Conflito PT',
              description: 'Desc Conflito PT',
            },
            {
              locale: 'it',
              title: 'Traccia Conflitto IT',
              description: 'Desc Conflitto IT',
            },
            {
              locale: 'es',
              title: 'Pista Conflicto ES',
              description: 'Desc Conflicto ES',
            },
          ],
        });

      expect(updateRes.status).toBe(409);
    });

    it('should return 400 for invalid input data', async () => {
      // Criar curso
      const courseRes = await request(app.getHttpServer())
        .post('/courses')
        .send({
          slug: 'curso-validation-test',
          translations: [
            {
              locale: 'pt',
              title: 'Curso Validation PT',
              description: 'Desc Validation PT',
            },
            {
              locale: 'it',
              title: 'Corso Validation IT',
              description: 'Desc Validation IT',
            },
            {
              locale: 'es',
              title: 'Curso Validation ES',
              description: 'Desc Validation ES',
            },
          ],
        });
      const courseId = courseRes.body.id;

      // Criar track
      const trackRes = await request(app.getHttpServer())
        .post('/tracks')
        .send({
          slug: 'trilha-validation',
          courseIds: [courseId],
          translations: [
            {
              locale: 'pt',
              title: 'Trilha Validation PT',
              description: 'Desc Validation PT',
            },
            {
              locale: 'it',
              title: 'Traccia Validation IT',
              description: 'Desc Validation IT',
            },
            {
              locale: 'es',
              title: 'Pista Validation ES',
              description: 'Desc Validation ES',
            },
          ],
        });
      const trackId = trackRes.body.id;

      // Tentar atualizar com dados inválidos
      const updateRes = await request(app.getHttpServer())
        .put(`/tracks/${trackId}`)
        .send({
          slug: '', // Slug vazio é inválido
          courseIds: ['invalid-uuid'], // UUID inválido
          translations: [
            { locale: 'invalid', title: 'Title', description: 'Description' }, // Locale inválido
          ],
        });

      expect(updateRes.status).toBe(400);
    });

    it('should preserve courses when updating track', async () => {
      // Criar cursos
      const course1Res = await request(app.getHttpServer())
        .post('/courses')
        .send({
          slug: 'curso-preserve-1',
          translations: [
            {
              locale: 'pt',
              title: 'Curso Preserve 1 PT',
              description: 'Desc Preserve 1 PT',
            },
            {
              locale: 'it',
              title: 'Corso Preserve 1 IT',
              description: 'Desc Preserve 1 IT',
            },
            {
              locale: 'es',
              title: 'Curso Preserve 1 ES',
              description: 'Desc Preserve 1 ES',
            },
          ],
        });
      const course1Id = course1Res.body.id;

      const course2Res = await request(app.getHttpServer())
        .post('/courses')
        .send({
          slug: 'curso-preserve-2',
          translations: [
            {
              locale: 'pt',
              title: 'Curso Preserve 2 PT',
              description: 'Desc Preserve 2 PT',
            },
            {
              locale: 'it',
              title: 'Corso Preserve 2 IT',
              description: 'Desc Preserve 2 IT',
            },
            {
              locale: 'es',
              title: 'Curso Preserve 2 ES',
              description: 'Desc Preserve 2 ES',
            },
          ],
        });
      const course2Id = course2Res.body.id;

      // Criar track
      const trackRes = await request(app.getHttpServer())
        .post('/tracks')
        .send({
          slug: 'trilha-preserve',
          courseIds: [course1Id, course2Id],
          translations: [
            {
              locale: 'pt',
              title: 'Trilha Preserve PT',
              description: 'Desc Preserve PT',
            },
            {
              locale: 'it',
              title: 'Traccia Preserve IT',
              description: 'Desc Preserve IT',
            },
            {
              locale: 'es',
              title: 'Pista Preserve ES',
              description: 'Desc Preserve ES',
            },
          ],
        });
      const trackId = trackRes.body.id;

      // Atualizar track removendo um curso
      const updateRes = await request(app.getHttpServer())
        .put(`/tracks/${trackId}`)
        .send({
          slug: 'trilha-preserve-updated',
          courseIds: [course1Id], // Remover course2Id
          translations: [
            {
              locale: 'pt',
              title: 'Trilha Preserve Updated PT',
              description: 'Desc Preserve Updated PT',
            },
            {
              locale: 'it',
              title: 'Traccia Preserve Updated IT',
              description: 'Desc Preserve Updated IT',
            },
            {
              locale: 'es',
              title: 'Pista Preserve Updated ES',
              description: 'Desc Preserve Updated ES',
            },
          ],
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.courseIds).toEqual([course1Id]);

      // Verificar que ambos os cursos ainda existem
      const course1StillExists = await request(app.getHttpServer()).get(
        `/courses/${course1Id}`,
      );
      expect(course1StillExists.status).toBe(200);

      const course2StillExists = await request(app.getHttpServer()).get(
        `/courses/${course2Id}`,
      );
      expect(course2StillExists.status).toBe(200);
    });
  });

  describe('[DELETE] /tracks/:id', () => {
    it('should delete track successfully', async () => {
      // Criar curso
      const courseRes = await request(app.getHttpServer())
        .post('/courses')
        .send({
          slug: 'curso-delete-test',
          translations: [
            {
              locale: 'pt',
              title: 'Curso Delete PT',
              description: 'Desc Delete PT',
            },
            {
              locale: 'it',
              title: 'Corso Delete IT',
              description: 'Desc Delete IT',
            },
            {
              locale: 'es',
              title: 'Curso Delete ES',
              description: 'Desc Delete ES',
            },
          ],
        });
      const courseId = courseRes.body.id;

      // Criar track
      const trackRes = await request(app.getHttpServer())
        .post('/tracks')
        .send({
          slug: 'trilha-delete-test',
          courseIds: [courseId],
          translations: [
            {
              locale: 'pt',
              title: 'Trilha Delete PT',
              description: 'Desc Delete PT',
            },
            {
              locale: 'it',
              title: 'Traccia Delete IT',
              description: 'Desc Delete IT',
            },
            {
              locale: 'es',
              title: 'Pista Delete ES',
              description: 'Desc Delete ES',
            },
          ],
        });
      const trackId = trackRes.body.id;

      // Verificar que track existe
      const getRes = await request(app.getHttpServer()).get(
        `/tracks/${trackId}`,
      );
      expect(getRes.status).toBe(200);

      // Deletar track
      const deleteRes = await request(app.getHttpServer()).delete(
        `/tracks/${trackId}`,
      );
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toBe('Track deleted successfully');
      expect(deleteRes.body.deletedAt).toBeDefined();

      // Verificar que track não existe mais
      const getAfterDeleteRes = await request(app.getHttpServer()).get(
        `/tracks/${trackId}`,
      );
      expect(getAfterDeleteRes.status).toBe(404);

      // Verificar que curso ainda existe (não foi afetado)
      const courseStillExistsRes = await request(app.getHttpServer()).get(
        `/courses/${courseId}`,
      );
      expect(courseStillExistsRes.status).toBe(200);
    });

    it('should return 404 when trying to delete non-existent track', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const deleteRes = await request(app.getHttpServer()).delete(
        `/tracks/${nonExistentId}`,
      );
      expect(deleteRes.status).toBe(404);
    });

    it('should return 400 for invalid track ID format', async () => {
      const invalidId = 'invalid-uuid-format';

      const deleteRes = await request(app.getHttpServer()).delete(
        `/tracks/${invalidId}`,
      );
      expect(deleteRes.status).toBe(400);
    });

    it('should delete track with multiple courses and preserve all courses', async () => {
      // Criar múltiplos cursos
      const course1Res = await request(app.getHttpServer())
        .post('/courses')
        .send({
          slug: 'curso-multi-1',
          translations: [
            {
              locale: 'pt',
              title: 'Curso Multi 1 PT',
              description: 'Desc Multi 1 PT',
            },
            {
              locale: 'it',
              title: 'Corso Multi 1 IT',
              description: 'Desc Multi 1 IT',
            },
            {
              locale: 'es',
              title: 'Curso Multi 1 ES',
              description: 'Desc Multi 1 ES',
            },
          ],
        });
      const course1Id = course1Res.body.id;

      const course2Res = await request(app.getHttpServer())
        .post('/courses')
        .send({
          slug: 'curso-multi-2',
          translations: [
            {
              locale: 'pt',
              title: 'Curso Multi 2 PT',
              description: 'Desc Multi 2 PT',
            },
            {
              locale: 'it',
              title: 'Corso Multi 2 IT',
              description: 'Desc Multi 2 IT',
            },
            {
              locale: 'es',
              title: 'Curso Multi 2 ES',
              description: 'Desc Multi 2 ES',
            },
          ],
        });
      const course2Id = course2Res.body.id;

      // Criar track com múltiplos cursos
      const trackRes = await request(app.getHttpServer())
        .post('/tracks')
        .send({
          slug: 'trilha-multi-courses',
          courseIds: [course1Id, course2Id],
          translations: [
            {
              locale: 'pt',
              title: 'Trilha Multi PT',
              description: 'Desc Multi PT',
            },
            {
              locale: 'it',
              title: 'Traccia Multi IT',
              description: 'Desc Multi IT',
            },
            {
              locale: 'es',
              title: 'Pista Multi ES',
              description: 'Desc Multi ES',
            },
          ],
        });
      const trackId = trackRes.body.id;

      // Deletar track
      const deleteRes = await request(app.getHttpServer()).delete(
        `/tracks/${trackId}`,
      );
      expect(deleteRes.status).toBe(200);

      // Verificar que ambos os cursos ainda existem
      const course1StillExists = await request(app.getHttpServer()).get(
        `/courses/${course1Id}`,
      );
      expect(course1StillExists.status).toBe(200);

      const course2StillExists = await request(app.getHttpServer()).get(
        `/courses/${course2Id}`,
      );
      expect(course2StillExists.status).toBe(200);
    });

    it('should delete track and remove all associations but preserve courses', async () => {
      // Criar curso
      const courseRes = await request(app.getHttpServer())
        .post('/courses')
        .send({
          slug: 'curso-association-test',
          translations: [
            {
              locale: 'pt',
              title: 'Curso Assoc PT',
              description: 'Desc Assoc PT',
            },
            {
              locale: 'it',
              title: 'Corso Assoc IT',
              description: 'Desc Assoc IT',
            },
            {
              locale: 'es',
              title: 'Curso Assoc ES',
              description: 'Desc Assoc ES',
            },
          ],
        });
      const courseId = courseRes.body.id;

      // Criar track
      const trackRes = await request(app.getHttpServer())
        .post('/tracks')
        .send({
          slug: 'trilha-association-test',
          courseIds: [courseId],
          translations: [
            {
              locale: 'pt',
              title: 'Trilha Assoc PT',
              description: 'Desc Assoc PT',
            },
            {
              locale: 'it',
              title: 'Traccia Assoc IT',
              description: 'Desc Assoc IT',
            },
            {
              locale: 'es',
              title: 'Pista Assoc ES',
              description: 'Desc Assoc ES',
            },
          ],
        });
      const trackId = trackRes.body.id;

      // Verificar que associações existem no banco
      const trackCourseAssociations = await prisma.trackCourse.findMany({
        where: { trackId: trackId },
      });
      expect(trackCourseAssociations).toHaveLength(1);

      const trackTranslations = await prisma.trackTranslation.findMany({
        where: { trackId: trackId },
      });
      expect(trackTranslations).toHaveLength(3);

      // Deletar track
      const deleteRes = await request(app.getHttpServer()).delete(
        `/tracks/${trackId}`,
      );
      expect(deleteRes.status).toBe(200);

      // Verificar que associações foram removidas
      const associationsAfterDelete = await prisma.trackCourse.findMany({
        where: { trackId: trackId },
      });
      expect(associationsAfterDelete).toHaveLength(0);

      const translationsAfterDelete = await prisma.trackTranslation.findMany({
        where: { trackId: trackId },
      });
      expect(translationsAfterDelete).toHaveLength(0);

      // Verificar que curso ainda existe
      const courseStillExists = await request(app.getHttpServer()).get(
        `/courses/${courseId}`,
      );
      expect(courseStillExists.status).toBe(200);
    });
  });
});
