// test/e2e/courses.e2e.spec.ts
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Create & List & Delete Courses (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Função helper para limpeza completa respeitando foreign keys
  const cleanupDatabase = async () => {
    // Deletar na ordem correta para respeitar foreign keys
    await prisma.video.deleteMany({});
    await prisma.lesson.deleteMany({});
    await prisma.moduleTranslation.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.trackCourse.deleteMany({});
    await prisma.trackTranslation.deleteMany({});
    await prisma.track.deleteMany({});
    await prisma.courseVideoLink.deleteMany({});
    await prisma.courseTranslation.deleteMany({});
    await prisma.course.deleteMany({});
  };

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

    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await app.close();
  });

  beforeEach(async () => {
    // Limpeza antes de cada teste para isolamento
    await cleanupDatabase();
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

    // ✅ CORREÇÃO: Verificar estrutura correta com translations
    res.body.forEach((course: any) => {
      expect(course).toHaveProperty('id');
      expect(course).toHaveProperty('slug');
      expect(course).toHaveProperty('translations');

      // ✅ Verificar que translations é um array
      expect(Array.isArray(course.translations)).toBe(true);
      expect(course.translations.length).toBeGreaterThan(0);

      // ✅ Verificar estrutura de cada tradução
      course.translations.forEach((translation: any) => {
        expect(translation).toHaveProperty('locale');
        expect(translation).toHaveProperty('title');
        expect(translation).toHaveProperty('description');
        expect(['pt', 'it', 'es']).toContain(translation.locale);
      });

      // ✅ Verificar que tem tradução em português
      const ptTranslation = course.translations.find(
        (t: any) => t.locale === 'pt',
      );
      expect(ptTranslation).toBeDefined();
      expect(ptTranslation.title).toBeTruthy();
      expect(ptTranslation.description).toBeTruthy();
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

  describe('DELETE /courses/:id', () => {
    it('[DELETE] /courses/:id - Success', async () => {
      // Criar um curso novo para deletar
      const createPayload = {
        slug: 'curso-para-deletar',
        translations: [
          {
            locale: 'pt',
            title: 'Curso Para Deletar',
            description: 'Este curso será deletado',
          },
          {
            locale: 'it',
            title: 'Corso da Cancellare',
            description: 'Questo corso sarà cancellato',
          },
          {
            locale: 'es',
            title: 'Curso para Eliminar',
            description: 'Este curso será eliminado',
          },
        ],
      };

      const createRes = await request(app.getHttpServer())
        .post('/courses')
        .send(createPayload);
      expect(createRes.status).toBe(201);
      const courseId = createRes.body.id;

      // Verificar que o curso existe antes da deleção
      const getRes = await request(app.getHttpServer()).get(
        `/courses/${courseId}`,
      );
      expect(getRes.status).toBe(200);

      // Deletar o curso
      const deleteRes = await request(app.getHttpServer()).delete(
        `/courses/${courseId}`,
      );

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body).toHaveProperty('success', true);
      expect(deleteRes.body).toHaveProperty(
        'message',
        'Course deleted successfully',
      );
      expect(deleteRes.body).toHaveProperty('deletedAt');
      expect(new Date(deleteRes.body.deletedAt)).toBeInstanceOf(Date);

      // Verificar que o curso não existe mais
      const getAfterDeleteRes = await request(app.getHttpServer()).get(
        `/courses/${courseId}`,
      );
      expect(getAfterDeleteRes.status).toBe(404);

      // Verificar que as traduções também foram deletadas
      const translations = await prisma.courseTranslation.findMany({
        where: { courseId },
      });
      expect(translations).toHaveLength(0);
    });

    it('[DELETE] /courses/:id - Course Not Found', async () => {
      const nonExistentId = '12345678-1234-1234-1234-123456789012';

      const res = await request(app.getHttpServer()).delete(
        `/courses/${nonExistentId}`,
      );

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'COURSE_NOT_FOUND');
      expect(res.body).toHaveProperty('message', 'Course not found');
    });

    it('[DELETE] /courses/:id - Invalid UUID Format', async () => {
      const invalidId = 'invalid-uuid-format';

      const res = await request(app.getHttpServer()).delete(
        `/courses/${invalidId}`,
      );

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
      expect(res.body).toHaveProperty('message', 'Invalid course ID format');
      expect(res.body).toHaveProperty('details');
      expect(Array.isArray(res.body.details)).toBe(true);

      const hasUuidError = res.body.details.some(
        (detail: any) =>
          detail.message && detail.message.toLowerCase().includes('uuid'),
      );
      expect(hasUuidError).toBe(true);
    });

    it('[DELETE] /courses/:id - Course with Modules (Dependencies)', async () => {
      // Criar curso
      const coursePayload = {
        slug: 'curso-com-modulos',
        translations: [
          {
            locale: 'pt',
            title: 'Curso com Módulos',
            description: 'Este curso tem módulos e não pode ser deletado',
          },
        ],
      };

      const courseRes = await request(app.getHttpServer())
        .post('/courses')
        .send(coursePayload);
      expect(courseRes.status).toBe(201);
      const courseId = courseRes.body.id;

      // Criar módulo para o curso usando Prisma diretamente
      const module = await prisma.module.create({
        data: {
          slug: 'modulo-teste',
          order: 1,
          courseId,
        },
      });

      // Criar tradução para o módulo
      await prisma.moduleTranslation.create({
        data: {
          locale: 'pt',
          title: 'Módulo de Teste',
          description: 'Módulo que impede deleção do curso',
          moduleId: module.id,
        },
      });

      // Tentar deletar o curso
      const deleteRes = await request(app.getHttpServer()).delete(
        `/courses/${courseId}`,
      );

      expect(deleteRes.status).toBe(400);
      expect(deleteRes.body).toHaveProperty('error', 'COURSE_HAS_DEPENDENCIES');
      expect(deleteRes.body).toHaveProperty('canDelete', false);
      expect(deleteRes.body).toHaveProperty('dependencies');
      expect(deleteRes.body).toHaveProperty('summary');
      expect(deleteRes.body).toHaveProperty('totalDependencies');
      expect(deleteRes.body).toHaveProperty('actionRequired');

      // Verificar estrutura das dependências
      expect(Array.isArray(deleteRes.body.dependencies)).toBe(true);
      expect(deleteRes.body.dependencies.length).toBeGreaterThan(0);

      const moduleDependency = deleteRes.body.dependencies.find(
        (dep: any) => dep.type === 'module',
      );
      expect(moduleDependency).toBeDefined();
      // ✅ CORREÇÃO: O repository retorna o title da tradução, não o slug
      expect(moduleDependency).toHaveProperty('name', 'Módulo de Teste');
      expect(moduleDependency).toHaveProperty('actionRequired');

      // Verificar summary
      expect(deleteRes.body.summary.modules).toBe(1);
      expect(deleteRes.body.totalDependencies).toBeGreaterThan(0);

      // Verificar que o curso ainda existe
      const getRes = await request(app.getHttpServer()).get(
        `/courses/${courseId}`,
      );
      expect(getRes.status).toBe(200);
    });

    it('[DELETE] /courses/:id - Course with Track Association (Dependencies)', async () => {
      // Criar curso
      const coursePayload = {
        slug: 'curso-com-track',
        translations: [
          {
            locale: 'pt',
            title: 'Curso com Track',
            description: 'Este curso está em uma track',
          },
        ],
      };

      const courseRes = await request(app.getHttpServer())
        .post('/courses')
        .send(coursePayload);
      expect(courseRes.status).toBe(201);
      const courseId = courseRes.body.id;

      // Criar track usando Prisma diretamente
      const track = await prisma.track.create({
        data: {
          slug: 'track-teste',
        },
      });

      // Criar tradução para a track
      await prisma.trackTranslation.create({
        data: {
          locale: 'pt',
          title: 'Track de Teste',
          description: 'Track que impede deleção do curso',
          trackId: track.id,
        },
      });

      // Associar curso à track
      await prisma.trackCourse.create({
        data: {
          trackId: track.id,
          courseId,
        },
      });

      // Tentar deletar o curso
      const deleteRes = await request(app.getHttpServer()).delete(
        `/courses/${courseId}`,
      );

      expect(deleteRes.status).toBe(400);
      expect(deleteRes.body).toHaveProperty('error', 'COURSE_HAS_DEPENDENCIES');
      expect(deleteRes.body).toHaveProperty('canDelete', false);
      expect(deleteRes.body).toHaveProperty('dependencies');

      // Verificar que tem dependência de track
      const trackDependency = deleteRes.body.dependencies.find(
        (dep: any) => dep.type === 'track',
      );
      expect(trackDependency).toBeDefined();
      expect(trackDependency).toHaveProperty('name', 'Track de Teste');
      expect(trackDependency).toHaveProperty('actionRequired');

      // Verificar summary
      expect(deleteRes.body.summary.tracks).toBe(1);
      expect(deleteRes.body.totalDependencies).toBeGreaterThan(0);
    });

    it('[DELETE] /courses/:id - Multiple Consecutive Deletes', async () => {
      // Criar múltiplos cursos
      const courses: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const payload = {
          slug: `curso-multiple-${i}`,
          translations: [
            {
              locale: 'pt',
              title: `Curso Multiple ${i}`,
              description: `Descrição do curso ${i}`,
            },
          ],
        };

        const res = await request(app.getHttpServer())
          .post('/courses')
          .send(payload);
        expect(res.status).toBe(201);
        courses.push(res.body.id);
      }

      // Deletar todos os cursos em sequência
      for (const courseId of courses) {
        const deleteRes = await request(app.getHttpServer()).delete(
          `/courses/${courseId}`,
        );
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body).toHaveProperty('success', true);
      }

      // Verificar que nenhum curso existe mais
      for (const courseId of courses) {
        const getRes = await request(app.getHttpServer()).get(
          `/courses/${courseId}`,
        );
        expect(getRes.status).toBe(404);
      }

      // Verificar que não há traduções órfãs
      const orphanTranslations = await prisma.courseTranslation.findMany({
        where: { courseId: { in: courses } },
      });
      expect(orphanTranslations).toHaveLength(0);
    });

    it('[DELETE] /courses/:id - Verify Cleanup After Delete', async () => {
      // Criar curso
      const coursePayload = {
        slug: 'curso-cleanup-test',
        imageUrl: '/test-image.jpg',
        translations: [
          {
            locale: 'pt',
            title: 'Curso Cleanup Test',
            description: 'Teste de limpeza',
          },
          {
            locale: 'it',
            title: 'Corso Cleanup Test',
            description: 'Test di pulizia',
          },
        ],
      };

      const courseRes = await request(app.getHttpServer())
        .post('/courses')
        .send(coursePayload);
      expect(courseRes.status).toBe(201);
      const courseId = courseRes.body.id;

      // Criar CourseVideoLink usando Prisma diretamente
      await prisma.courseVideoLink.create({
        data: {
          locale: 'pt',
          url: 'https://example.com/video-pt',
          courseId,
        },
      });

      // Verificar que tudo foi criado
      const coursesBefore = await prisma.course.count({
        where: { id: courseId },
      });
      const translationsBefore = await prisma.courseTranslation.count({
        where: { courseId },
      });
      const videoLinksBefore = await prisma.courseVideoLink.count({
        where: { courseId },
      });

      expect(coursesBefore).toBe(1);
      expect(translationsBefore).toBe(2);
      expect(videoLinksBefore).toBe(1);

      // Deletar o curso
      const deleteRes = await request(app.getHttpServer()).delete(
        `/courses/${courseId}`,
      );
      expect(deleteRes.status).toBe(200);

      // Verificar que tudo foi deletado
      const coursesAfter = await prisma.course.count({
        where: { id: courseId },
      });
      const translationsAfter = await prisma.courseTranslation.count({
        where: { courseId },
      });
      const videoLinksAfter = await prisma.courseVideoLink.count({
        where: { courseId },
      });

      expect(coursesAfter).toBe(0);
      expect(translationsAfter).toBe(0);
      expect(videoLinksAfter).toBe(0);
    });
  });
});
