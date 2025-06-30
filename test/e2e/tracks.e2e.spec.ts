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
