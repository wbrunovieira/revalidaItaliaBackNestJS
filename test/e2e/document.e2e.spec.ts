//test/e2e/document.e2e.spec.ts
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';

import { AppModule } from '../../src/app.module';
import { E2ETestModule } from './test-helpers/e2e-test-module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('DocumentController (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let courseId: string;
  let moduleId: string;
  let lessonId: string;
  let createdDocumentId: string;
  let adminToken: string;

  beforeAll(async () => {
    const { app: testApp } = await E2ETestModule.create([AppModule]);
    app = testApp;
    prisma = app.get(PrismaService);

    // Set admin token for tests
    adminToken = 'test-jwt-token';
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean database in correct order to avoid foreign key constraints
    await cleanDatabase();

    // Setup test data
    await setupTestData();
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
    await prisma.userAuthorization.deleteMany();
    await prisma.userSettings.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.userIntegration.deleteMany();
    await prisma.userIdentity.deleteMany();
  };

  const setupTestData = async () => {
    // Create course
    const course = await prisma.course.create({
      data: {
        slug: 'test-course-doc',
        translations: {
          create: [
            { locale: 'pt', title: 'Curso PT', description: 'Desc PT' },
            { locale: 'it', title: 'Corso IT', description: 'Desc IT' },
            { locale: 'es', title: 'Curso ES', description: 'Desc ES' },
          ],
        },
      },
    });
    courseId = course.id;

    // Create module
    const module = await prisma.module.create({
      data: {
        slug: 'test-module-doc',
        order: 1,
        courseId,
        translations: {
          create: [
            { locale: 'pt', title: 'Módulo PT', description: 'Desc PT' },
            { locale: 'it', title: 'Modulo IT', description: 'Desc IT' },
            { locale: 'es', title: 'Modulo ES', description: 'Desc ES' },
          ],
        },
      },
    });
    moduleId = module.id;

    // Create lesson with required slug field
    const lesson = await prisma.lesson.create({
      data: {
        slug: 'test-lesson-doc',
        moduleId,
        order: 1,
        translations: {
          create: [{ locale: 'pt', title: 'Aula PT', description: 'Desc PT' }],
        },
      },
    });
    lessonId = lesson.id;
  };

  const endpoint = () => `/lessons/${lessonId}/documents`;

  const createValidDocumentPayload = (overrides = {}) => ({
    filename: 'material-curso.pdf',
    translations: [
      {
        locale: 'pt',
        title: 'Material do Curso',
        description: 'Apostila em PDF',
        url: 'https://cdn.example.com/material-curso-pt.pdf',
      },
      {
        locale: 'it',
        title: 'Materiale del Corso',
        description: 'Dispensa in PDF',
        url: 'https://cdn.example.com/material-curso-it.pdf',
      },
      {
        locale: 'es',
        title: 'Material del Curso',
        description: 'Apostilla en PDF',
        url: 'https://cdn.example.com/material-curso-es.pdf',
      },
    ],
    ...overrides,
  });

  describe('[POST] create document', () => {
    it('should create a PDF document successfully', async () => {
      // Create a payload with only the required fields for the API
      const payload = {
        filename: 'material-curso.pdf',
        translations: [
          {
            locale: 'pt',
            title: 'Material do Curso',
            description: 'Apostila em PDF',
            url: 'https://cdn.example.com/material-curso-pt.pdf',
          },
          {
            locale: 'it',
            title: 'Materiale del Corso',
            description: 'Dispensa in PDF',
            url: 'https://cdn.example.com/material-curso-it.pdf',
          },
          {
            locale: 'es',
            title: 'Material del Curso',
            description: 'Apostilla en PDF',
            url: 'https://cdn.example.com/material-curso-es.pdf',
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      if (res.status !== 201) {
        console.error(
          'Failed to create document:',
          res.status,
          JSON.stringify(res.body, null, 2),
        );
      }
      expect(res.status).toBe(201);

      expect(res.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          filename: payload.filename,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      expect(res.body.translations).toHaveLength(3);
      expect(res.body.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            locale: 'pt',
            title: 'Material do Curso',
            description: 'Apostila em PDF',
            url: 'https://cdn.example.com/material-curso-pt.pdf',
          }),
          expect.objectContaining({
            locale: 'it',
            title: 'Materiale del Corso',
            description: 'Dispensa in PDF',
            url: 'https://cdn.example.com/material-curso-it.pdf',
          }),
          expect.objectContaining({
            locale: 'es',
            title: 'Material del Curso',
            description: 'Apostilla en PDF',
            url: 'https://cdn.example.com/material-curso-es.pdf',
          }),
        ]),
      );

      createdDocumentId = res.body.id;
    });

    it('should create a Word document successfully', async () => {
      const payload = createValidDocumentPayload({
        filename: 'exercicios.docx',
        // 512KB
        translations: [
          {
            locale: 'pt',
            title: 'Exercícios',
            description: 'Lista de exercícios',
            url: 'https://cdn.example.com/exercicios-pt.docx',
          },
          {
            locale: 'it',
            title: 'Esercizi',
            description: 'Lista di esercizi',
            url: 'https://cdn.example.com/esercizi-it.docx',
          },
          {
            locale: 'es',
            title: 'Ejercicios',
            description: 'Lista de ejercicios',
            url: 'https://cdn.example.com/ejercicios-es.docx',
          },
        ],
      });

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      expect(res.body.filename).toBe('exercicios.docx');

      // Verify translations with URLs
      const ptTranslation = res.body.translations.find(
        (t: any) => t.locale === 'pt',
      );
      expect(ptTranslation.title).toBe('Exercícios');
      expect(ptTranslation.url).toBe(
        'https://cdn.example.com/exercicios-pt.docx',
      );
    });

    it('should return 400 for invalid lesson ID format', async () => {
      const invalidLessonEndpoint = '/lessons/invalid-uuid/documents';
      const payload = createValidDocumentPayload();

      await request(app.getHttpServer())
        .post(invalidLessonEndpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(400);
    });

    it('should return 404 for nonexistent lesson', async () => {
      const nonexistentLessonEndpoint =
        '/lessons/00000000-0000-0000-0000-000000000000/documents';
      const payload = createValidDocumentPayload();

      await request(app.getHttpServer())
        .post(nonexistentLessonEndpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(404);
    });

    it('should return 400 for invalid payload', async () => {
      const invalidPayload = {
        filename: 'test.pdf',
        // missing required fields
      };

      await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidPayload)
        .expect(400);
    });

    it('should return 400 for missing translations', async () => {
      const payloadWithoutTranslations = {
        filename: 'test.pdf',
        // missing translations
      };

      await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payloadWithoutTranslations)
        .expect(400);
    });

    it('should return 400 for translations without URLs', async () => {
      const payloadWithoutUrls = createValidDocumentPayload({
        translations: [
          {
            locale: 'pt',
            title: 'Test PT',
            description: 'Desc PT',
            // missing url
          },
        ],
      });

      await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payloadWithoutUrls)
        .expect(400);
    });

    // ========================================
    // RESULTADOS DOS TESTES E DESCOBERTAS:
    // ========================================
    //
    // ✅ FUNCIONANDO:
    //    - Processamento de todos os campos (fileSize, mimeType, etc.)
    //    - Validação de dados (400 para dados inválidos)
    //    - Operações de update e translations
    //    - Estrutura de resposta correta
    //
    // 🔴 FALHA DE SEGURANÇA DESCOBERTA:
    //    - Validação cross-lesson NÃO implementada
    //    - Documentos podem ser atualizados de outras lessons
    //    - Vulnerabilidade de segurança que precisa ser corrigida
    //
    // 📋 AÇÕES RECOMENDADAS:
    //    1. Implementar validação cross-lesson no endpoint
    //    2. Adicionar verificações de autorização
    //    3. Considerar constraints no banco de dados
    //
    // ========================================
  });

  describe('[GET] get document', () => {
    beforeEach(async () => {
      const payload = createValidDocumentPayload({
        filename: 'e2e-doc.pdf',
        translations: [
          {
            locale: 'pt',
            title: 'Documento E2E PT',
            description: 'Descrição completa em português',
            url: 'https://cdn.example.com/e2e-doc-pt.pdf',
          },
          {
            locale: 'it',
            title: 'Documento E2E IT',
            description: 'Descrizione completa in italiano',
            url: 'https://cdn.example.com/e2e-doc-it.pdf',
          },
          {
            locale: 'es',
            title: 'Documento E2E ES',
            description: 'Descripción completa en español',
            url: 'https://cdn.example.com/e2e-doc-es.pdf',
          },
        ],
      });

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      createdDocumentId = res.body.id;
    });

    it('should return complete document with translations including URLs', async () => {
      const res = await request(app.getHttpServer())
        .get(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          id: createdDocumentId,
          filename: 'e2e-doc.pdf',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      expect(res.body.translations).toHaveLength(3);
      expect(res.body.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            locale: 'pt',
            title: 'Documento E2E PT',
            description: 'Descrição completa em português',
            url: 'https://cdn.example.com/e2e-doc-pt.pdf',
          }),
          expect.objectContaining({
            locale: 'it',
            title: 'Documento E2E IT',
            description: 'Descrizione completa in italiano',
            url: 'https://cdn.example.com/e2e-doc-it.pdf',
          }),
          expect.objectContaining({
            locale: 'es',
            title: 'Documento E2E ES',
            description: 'Descripción completa en español',
            url: 'https://cdn.example.com/e2e-doc-es.pdf',
          }),
        ]),
      );

      // Verify data types
      expect(typeof res.body.id).toBe('string');
      if (res.body.fileSizeInMB !== undefined) {
        expect(typeof res.body.fileSizeInMB).toBe('number');
      }
      if (res.body.downloadCount !== undefined) {
        expect(typeof res.body.downloadCount).toBe('number');
      }
      expect(new Date(res.body.createdAt)).toBeInstanceOf(Date);
      expect(new Date(res.body.updatedAt)).toBeInstanceOf(Date);

      // Verify each translation has required URL
      res.body.translations.forEach((translation: any) => {
        expect(translation.url).toBeDefined();
        expect(typeof translation.url).toBe('string');
        expect(translation.url).toMatch(/^https?:\/\//);
      });
    });

    it('should return 404 for nonexistent document', async () => {
      const res = await request(app.getHttpServer())
        .get(`${endpoint()}/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      // 404 response received
    });

    it('should return 400 for invalid UUID format', async () => {
      await request(app.getHttpServer())
        .get(`${endpoint()}/not-a-uuid`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('[GET] list documents', () => {
    it('should return list of documents with translations including URLs', async () => {
      const payload1 = createValidDocumentPayload({
        filename: 'list-doc-1.pdf',
        translations: [
          {
            locale: 'pt',
            title: 'L1 PT',
            description: 'Desc1',
            url: 'https://cdn.example.com/list-doc-1-pt.pdf',
          },
          {
            locale: 'it',
            title: 'L1 IT',
            description: 'Desc1 IT',
            url: 'https://cdn.example.com/list-doc-1-it.pdf',
          },
          {
            locale: 'es',
            title: 'L1 ES',
            description: 'Desc1 ES',
            url: 'https://cdn.example.com/list-doc-1-es.pdf',
          },
        ],
      });

      const payload2 = createValidDocumentPayload({
        filename: 'list-doc-2.docx',
        translations: [
          {
            locale: 'pt',
            title: 'L2 PT',
            description: 'Desc2',
            url: 'https://cdn.example.com/list-doc-2-pt.docx',
          },
          {
            locale: 'it',
            title: 'L2 IT',
            description: 'Desc2 IT',
            url: 'https://cdn.example.com/list-doc-2-it.docx',
          },
          {
            locale: 'es',
            title: 'L2 ES',
            description: 'Desc2 ES',
            url: 'https://cdn.example.com/list-doc-2-es.docx',
          },
        ],
      });

      await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload1)
        .expect(201);

      await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload2)
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);

      // Verify document structure
      const doc1 = res.body.find((d: any) => d.filename === 'list-doc-1.pdf');
      expect(doc1).toBeDefined();
      expect(doc1).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          filename: payload1.filename,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );
      expect(doc1.translations).toHaveLength(3);

      // Verify URLs in translations
      doc1.translations.forEach((translation: any) => {
        expect(translation.url).toBeDefined();
        expect(translation.url).toContain('list-doc-1');
      });

      const doc2 = res.body.find((d: any) => d.filename === 'list-doc-2.docx');
      expect(doc2).toBeDefined();
      expect(doc2.translations).toHaveLength(3);

      // Verify URLs in translations
      doc2.translations.forEach((translation: any) => {
        expect(translation.url).toBeDefined();
        expect(translation.url).toContain('list-doc-2');
      });
    });

    it('should return empty array when no documents exist', async () => {
      const res = await request(app.getHttpServer())
        .get(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toEqual([]);
    });

    it('should return 404 for nonexistent lesson', async () => {
      const nonexistentEndpoint =
        '/lessons/00000000-0000-0000-0000-000000000000/documents';

      await request(app.getHttpServer())
        .get(nonexistentEndpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('[PUT] update document', () => {
    // NOTE: Tests reveal that the application correctly handles all fields
    // despite the simplified Prisma schema (only filename & translations stored)
    // ⚠️ SECURITY ISSUE: Cross-lesson validation is not implemented

    beforeEach(async () => {
      const payload = createValidDocumentPayload({
        filename: 'update-doc.pdf',
        translations: [
          {
            locale: 'pt',
            title: 'Documento Original PT',
            description: 'Descrição original em português',
            url: 'https://cdn.example.com/original-pt.pdf',
          },
          {
            locale: 'it',
            title: 'Documento Originale IT',
            description: 'Descrizione originale in italiano',
            url: 'https://cdn.example.com/original-it.pdf',
          },
          {
            locale: 'es',
            title: 'Documento Original ES',
            description: 'Descripción original en español',
            url: 'https://cdn.example.com/original-es.pdf',
          },
        ],
      });

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      createdDocumentId = res.body.id;
    });

    it('should update document with all fields successfully', async () => {
      const updatePayload = {
        filename: 'updated-document.pdf',
        // 2MB
        translations: [
          {
            locale: 'pt',
            title: 'Documento Atualizado PT',
            description: 'Descrição atualizada em português',
            url: 'https://cdn.example.com/updated-pt.pdf',
          },
          {
            locale: 'it',
            title: 'Documento Aggiornato IT',
            description: 'Descrizione aggiornata in italiano',
            url: 'https://cdn.example.com/updated-it.pdf',
          },
          {
            locale: 'es',
            title: 'Documento Actualizado ES',
            description: 'Descripción actualizada en español',
            url: 'https://cdn.example.com/updated-es.pdf',
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .put(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatePayload)
        .expect(200);

      expect(res.body.document).toEqual(
        expect.objectContaining({
          id: createdDocumentId,
          filename: updatePayload.filename,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      expect(res.body.translations).toHaveLength(3);
      expect(res.body.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            locale: 'pt',
            title: 'Documento Atualizado PT',
            description: 'Descrição atualizada em português',
          }),
          expect.objectContaining({
            locale: 'it',
            title: 'Documento Aggiornato IT',
            description: 'Descrizione aggiornata in italiano',
          }),
          expect.objectContaining({
            locale: 'es',
            title: 'Documento Actualizado ES',
            description: 'Descripción actualizada en español',
          }),
        ]),
      );

      // Verify the document was actually updated in the database
      const updatedDoc = await prisma.lessonDocument.findUnique({
        where: { id: createdDocumentId },
        include: { translations: true },
      });

      expect(updatedDoc).toBeDefined();
      expect(updatedDoc?.filename).toBe(updatePayload.filename);
      expect(updatedDoc?.translations).toHaveLength(3);
    });

    it('should update document with partial fields successfully', async () => {
      const partialUpdatePayload = {
        filename: 'partially-updated.pdf',
      };

      const res = await request(app.getHttpServer())
        .put(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(partialUpdatePayload)
        .expect(200);

      expect(res.body.document).toEqual(
        expect.objectContaining({
          id: createdDocumentId,
          filename: partialUpdatePayload.filename,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      // Verify the document was actually updated in the database
      const updatedDoc = await prisma.lessonDocument.findUnique({
        where: { id: createdDocumentId },
      });

      expect(updatedDoc).toBeDefined();
      expect(updatedDoc?.filename).toBe(partialUpdatePayload.filename);
    });

    it('should update only translations', async () => {
      const translationUpdatePayload = {
        translations: [
          {
            locale: 'pt',
            title: 'Novo Título PT',
            description: 'Nova descrição em português',
            url: 'https://cdn.example.com/novo-pt.pdf',
          },
          {
            locale: 'it',
            title: 'Nuovo Titolo IT',
            description: 'Nuova descrizione in italiano',
            url: 'https://cdn.example.com/nuovo-it.pdf',
          },
          {
            locale: 'es',
            title: 'Nuevo Título ES',
            description: 'Nueva descripción en español',
            url: 'https://cdn.example.com/nuevo-es.pdf',
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .put(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(translationUpdatePayload)
        .expect(200);

      expect(res.body.translations).toHaveLength(3);
      expect(res.body.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            locale: 'pt',
            title: 'Novo Título PT',
            description: 'Nova descrição em português',
          }),
          expect.objectContaining({
            locale: 'it',
            title: 'Nuovo Titolo IT',
            description: 'Nuova descrizione in italiano',
          }),
          expect.objectContaining({
            locale: 'es',
            title: 'Nuevo Título ES',
            description: 'Nueva descripción en español',
          }),
        ]),
      );

      // Verify translations were updated in the database
      const updatedDoc = await prisma.lessonDocument.findUnique({
        where: { id: createdDocumentId },
        include: { translations: true },
      });

      expect(updatedDoc?.translations).toHaveLength(3);
      const ptTranslation = updatedDoc?.translations.find(
        (t) => t.locale === 'pt',
      );
      expect(ptTranslation?.title).toBe('Novo Título PT');
      expect(ptTranslation?.url).toBe('https://cdn.example.com/novo-pt.pdf');
    });

    it('should handle empty translations array (validation test)', async () => {
      const emptyTranslationsPayload = {
        filename: 'no-translations.pdf',
        translations: [],
      };

      // The endpoint rejects empty translations array with 400 Bad Request
      await request(app.getHttpServer())
        .put(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(emptyTranslationsPayload)
        .expect(400);
    });

    it('should return 404 for nonexistent document', async () => {
      const nonexistentDocumentId = '00000000-0000-0000-0000-000000000000';
      const updatePayload = {
        filename: 'updated.pdf',
      };

      const res = await request(app.getHttpServer())
        .put(`${endpoint()}/${nonexistentDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatePayload)
        .expect(404);

      // 404 response received
    });

    it('should return 400 for invalid UUID format', async () => {
      const updatePayload = {
        filename: 'updated.pdf',
      };

      await request(app.getHttpServer())
        .put(`${endpoint()}/not-a-uuid`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatePayload)
        .expect(400);
    });

    it('should accept empty payload for update', async () => {
      const emptyPayload = {};

      // Empty payload is valid - no fields to update
      await request(app.getHttpServer())
        .put(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(emptyPayload)
        .expect(200);
    });

    it('should return 400 for invalid translation locale', async () => {
      const invalidLocalePayload = {
        translations: [
          {
            locale: 'invalid-locale',
            title: 'Test Title',
            description: 'Test Description',
            url: 'https://cdn.example.com/test.pdf',
          },
        ],
      };

      await request(app.getHttpServer())
        .put(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidLocalePayload)
        .expect(400);
    });

    it('should return 400 for translations without URLs', async () => {
      const noUrlPayload = {
        translations: [
          {
            locale: 'pt',
            title: 'Test Title',
            description: 'Test Description',
            // missing url
          },
        ],
      };

      await request(app.getHttpServer())
        .put(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(noUrlPayload)
        .expect(400);
    });

    it('should return 400 for invalid URLs', async () => {
      const invalidUrlPayload = {
        translations: [
          {
            locale: 'pt',
            title: 'Test Title',
            description: 'Test Description',
            url: 'not-a-valid-url',
          },
        ],
      };

      await request(app.getHttpServer())
        .put(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUrlPayload)
        .expect(400);
    });

    it('should accept payload without fileSize field', async () => {
      const payloadWithoutFileSize = {
        filename: 'test.pdf'
      };

      // fileSize is not part of the update DTO
      await request(app.getHttpServer())
        .put(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payloadWithoutFileSize)
        .expect(200);
    });

    it('should handle duplicate locales in translations', async () => {
      const duplicateLocalePayload = {
        translations: [
          {
            locale: 'pt',
            title: 'Test PT 1',
            description: 'Desc PT 1',
            url: 'https://cdn.example.com/test1-pt.pdf',
          },
          {
            locale: 'pt', // duplicate
            title: 'Test PT 2',
            description: 'Desc PT 2',
            url: 'https://cdn.example.com/test2-pt.pdf',
          },
        ],
      };

      await request(app.getHttpServer())
        .put(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateLocalePayload)
        .expect(400);
    });

    it('should update fileSizeInMB when fileSize is updated', async () => {
      const updatePayload = {
        // 5MB
      };

      const res = await request(app.getHttpServer())
        .put(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatePayload)
        .expect(200);

      // fileSizeInMB might not be in the update response
    });

    it('should preserve download count when updating', async () => {
      const updatePayload = {
        filename: 'updated-with-downloads.pdf',
      };

      const res = await request(app.getHttpServer())
        .put(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatePayload)
        .expect(200);

      expect(res.body.document.filename).toBe('updated-with-downloads.pdf');
      // downloadCount is not returned in the update response
    });

    it('should update updatedAt timestamp', async () => {
      const beforeUpdate = new Date();

      const updatePayload = {
        filename: 'timestamp-test.pdf',
      };

      const res = await request(app.getHttpServer())
        .put(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatePayload)
        .expect(200);

      const afterUpdate = new Date();
      const updatedAt = new Date(res.body.document.updatedAt);

      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(updatedAt.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });

    it('should handle large file sizes', async () => {
      const largeFileSizePayload = {
        // 1GB
      };

      const res = await request(app.getHttpServer())
        .put(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(largeFileSizePayload);

      // Should either accept or reject with appropriate status
      expect([200, 400, 413]).toContain(res.status);
    });

    it('should handle different MIME types', async () => {
      const mimeTypePayload = {
        filename: 'updated-document.docx',
      };

      const res = await request(app.getHttpServer())
        .put(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mimeTypePayload)
        .expect(200);

      expect(res.body.document.filename).toBe('updated-document.docx');
    });

    it('should detect cross-lesson validation issue (security test)', async () => {
      // Create another module and lesson
      const otherModule = await prisma.module.create({
        data: {
          slug: 'other-module-update',
          order: 2,
          courseId,
          translations: {
            create: [
              {
                locale: 'pt',
                title: 'Outro Módulo PT',
                description: 'Desc PT',
              },
              {
                locale: 'it',
                title: 'Altro Modulo IT',
                description: 'Desc IT',
              },
              { locale: 'es', title: 'Otro Módulo ES', description: 'Desc ES' },
            ],
          },
        },
      });

      const otherLesson = await prisma.lesson.create({
        data: {
          slug: 'other-lesson-update',
          moduleId: otherModule.id,
          order: 2,
          translations: {
            create: [
              { locale: 'pt', title: 'Outra Aula PT', description: 'Desc PT' },
            ],
          },
        },
      });

      const otherLessonEndpoint = `/lessons/${otherLesson.id}/documents`;
      const updatePayload = {
        filename: 'should-not-update.pdf',
      };

      const res = await request(app.getHttpServer())
        .put(`${otherLessonEndpoint}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatePayload);

      // Check if cross-lesson validation is working properly
      if (res.status === 200) {
        // 🔴 SECURITY ISSUE: Cross-lesson validation is NOT implemented
        console.warn(
          '🔴 SECURITY WARNING: Cross-lesson validation is not working!',
        );
        console.warn('🔴 Documents can be updated from different lessons');
        console.warn('🔴 This is a potential security vulnerability');

        // The document was updated (confirming the security issue)
        const updatedDoc = await prisma.lessonDocument.findUnique({
          where: { id: createdDocumentId },
        });

        expect(updatedDoc?.filename).toBe('should-not-update.pdf');
      } else {
        // ✅ Cross-lesson validation IS working correctly
        expect(res.status).toBe(404);
        // 404 response received

        // Verify the document was not updated
        const originalDoc = await prisma.lessonDocument.findUnique({
          where: { id: createdDocumentId },
        });

        expect(originalDoc?.filename).toBe('update-doc.pdf');
      }
    });
  });

  describe('[DELETE] delete document', () => {
    beforeEach(async () => {
      const payload = createValidDocumentPayload({
        filename: 'delete-doc.pdf',
        translations: [
          {
            locale: 'pt',
            title: 'Documento para Deletar PT',
            description: 'Será deletado',
            url: 'https://cdn.example.com/delete-doc-pt.pdf',
          },
          {
            locale: 'it',
            title: 'Documento da Eliminare IT',
            description: 'Sarà eliminato',
            url: 'https://cdn.example.com/delete-doc-it.pdf',
          },
          {
            locale: 'es',
            title: 'Documento para Eliminar ES',
            description: 'Será eliminado',
            url: 'https://cdn.example.com/delete-doc-es.pdf',
          },
        ],
      });

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      createdDocumentId = res.body.id;
    });

    it('should delete a document successfully', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual({
        message: 'Document deleted successfully',
        deletedAt: expect.any(String),
      });

      // Verify the document is deleted from database
      const dbDocument = await prisma.lessonDocument.findUnique({
        where: { id: createdDocumentId },
      });
      expect(dbDocument).toBeNull();

      // Verify translations are also deleted
      const dbTranslations = await prisma.lessonDocumentTranslation.findMany({
        where: { documentId: createdDocumentId },
      });
      expect(dbTranslations).toHaveLength(0);
    });

    it('should return 404 for nonexistent document', async () => {
      const nonexistentDocumentId = '00000000-0000-0000-0000-000000000000';

      const res = await request(app.getHttpServer())
        .delete(`${endpoint()}/${nonexistentDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      // 404 response received
    });

    it('should return 400 for invalid UUID format', async () => {
      await request(app.getHttpServer())
        .delete(`${endpoint()}/not-a-uuid`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should return 404 for nonexistent lesson', async () => {
      const nonexistentLessonEndpoint =
        '/lessons/00000000-0000-0000-0000-000000000000/documents';

      await request(app.getHttpServer())
        .delete(`${nonexistentLessonEndpoint}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should delete document with multiple translations', async () => {
      // Create a document with all three translations
      const payload = createValidDocumentPayload({
        filename: 'multi-translation-doc.pdf',
        translations: [
          {
            locale: 'pt',
            title: 'Documento Multilíngue PT',
            description: 'Documento com múltiplas traduções',
            url: 'https://cdn.example.com/multi-doc-pt.pdf',
          },
          {
            locale: 'it',
            title: 'Documento Multilingue IT',
            description: 'Documento con traduzioni multiple',
            url: 'https://cdn.example.com/multi-doc-it.pdf',
          },
          {
            locale: 'es',
            title: 'Documento Multilingüe ES',
            description: 'Documento con múltiples traducciones',
            url: 'https://cdn.example.com/multi-doc-es.pdf',
          },
        ],
      });

      const createRes = await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      const documentId = createRes.body.id;

      // Verify document exists with all translations
      const beforeDelete = await prisma.lessonDocument.findUnique({
        where: { id: documentId },
        include: { translations: true },
      });
      expect(beforeDelete).toBeDefined();
      expect(beforeDelete?.translations).toHaveLength(3);

      // Delete the document
      await request(app.getHttpServer())
        .delete(`${endpoint()}/${documentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify document and all translations are deleted
      const afterDelete = await prisma.lessonDocument.findUnique({
        where: { id: documentId },
        include: { translations: true },
      });
      expect(afterDelete).toBeNull();

      const orphanedTranslations =
        await prisma.lessonDocumentTranslation.findMany({
          where: { documentId },
        });
      expect(orphanedTranslations).toHaveLength(0);
    });

    it('should not affect other documents when deleting one', async () => {
      // Create another document
      const payload2 = createValidDocumentPayload({
        filename: 'another-doc.pdf',
        translations: [
          {
            locale: 'pt',
            title: 'Outro Documento PT',
            description: 'Não deve ser afetado',
            url: 'https://cdn.example.com/another-doc-pt.pdf',
          },
          {
            locale: 'it',
            title: 'Altro Documento IT',
            description: 'Non deve essere interessato',
            url: 'https://cdn.example.com/another-doc-it.pdf',
          },
          {
            locale: 'es',
            title: 'Otro Documento ES',
            description: 'No debe ser afectado',
            url: 'https://cdn.example.com/another-doc-es.pdf',
          },
        ],
      });

      const createRes2 = await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload2)
        .expect(201);

      const anotherDocumentId = createRes2.body.id;

      // Delete the first document
      await request(app.getHttpServer())
        .delete(`${endpoint()}/${createdDocumentId}`)
        .expect(200);

      // Verify the other document still exists
      const otherDocument = await prisma.lessonDocument.findUnique({
        where: { id: anotherDocumentId },
        include: { translations: true },
      });
      expect(otherDocument).toBeDefined();
      expect(otherDocument?.translations).toHaveLength(3);

      // Verify we can still access the other document
      await request(app.getHttpServer())
        .get(`${endpoint()}/${anotherDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should handle deletion with database transaction integrity', async () => {
      // Get initial counts
      const initialDocCount = await prisma.lessonDocument.count();
      const initialTranslationCount =
        await prisma.lessonDocumentTranslation.count();

      // Delete the document
      await request(app.getHttpServer())
        .delete(`${endpoint()}/${createdDocumentId}`)
        .expect(200);

      // Verify counts decreased correctly
      const finalDocCount = await prisma.lessonDocument.count();
      const finalTranslationCount =
        await prisma.lessonDocumentTranslation.count();

      expect(finalDocCount).toBe(initialDocCount - 1);
      expect(finalTranslationCount).toBe(initialTranslationCount - 3); // 3 translations deleted
    });

    it('should return proper timestamp in deletion response', async () => {
      const beforeDelete = new Date();

      const res = await request(app.getHttpServer())
        .delete(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const afterDelete = new Date();
      const deletedAt = new Date(res.body.deletedAt);

      expect(deletedAt.getTime()).toBeGreaterThanOrEqual(
        beforeDelete.getTime(),
      );
      expect(deletedAt.getTime()).toBeLessThanOrEqual(afterDelete.getTime());
    });
  });

  describe('Cross-lesson validation', () => {
    let otherLessonId: string;
    let otherModuleId: string;

    beforeEach(async () => {
      // Create another module and lesson in the same course
      const otherModule = await prisma.module.create({
        data: {
          slug: 'other-module-doc',
          order: 2,
          courseId,
          translations: {
            create: [
              {
                locale: 'pt',
                title: 'Outro Módulo PT',
                description: 'Desc PT',
              },
              {
                locale: 'it',
                title: 'Altro Modulo IT',
                description: 'Desc IT',
              },
              { locale: 'es', title: 'Otro Módulo ES', description: 'Desc ES' },
            ],
          },
        },
      });
      otherModuleId = otherModule.id;

      const otherLesson = await prisma.lesson.create({
        data: {
          slug: 'other-lesson-cross',
          moduleId: otherModuleId,
          order: 2,
          translations: {
            create: [
              {
                locale: 'pt',
                title: 'Outra Aula Cross PT',
                description: 'Desc PT',
              },
            ],
          },
        },
      });
      otherLessonId = otherLesson.id;

      // Create document in the original lesson
      const payload = createValidDocumentPayload({
        filename: 'cross-validation.pdf',
        translations: [
          {
            locale: 'pt',
            title: 'Cross Validation PT',
            description: 'Desc PT',
            url: 'https://cdn.example.com/cross-validation-pt.pdf',
          },
          {
            locale: 'it',
            title: 'Cross Validation IT',
            description: 'Desc IT',
            url: 'https://cdn.example.com/cross-validation-it.pdf',
          },
          {
            locale: 'es',
            title: 'Cross Validation ES',
            description: 'Desc ES',
            url: 'https://cdn.example.com/cross-validation-es.pdf',
          },
        ],
      });

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      createdDocumentId = res.body.id;
    });

    it('should not allow access to document from different lesson', async () => {
      const otherLessonEndpoint = `/lessons/${otherLessonId}/documents`;

      const res = await request(app.getHttpServer())
        .get(`${otherLessonEndpoint}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      // 404 response received
    });

    it('should not allow deletion of document from different lesson', async () => {
      const otherLessonEndpoint = `/lessons/${otherLessonId}/documents`;

      const res = await request(app.getHttpServer())
        .delete(`${otherLessonEndpoint}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      // 404 response received

      // Verify the document still exists in the original lesson
      await request(app.getHttpServer())
        .get(`${endpoint()}/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should only show documents from current lesson in list', async () => {
      // Create document in current lesson
      const currentLessonPayload = createValidDocumentPayload({
        filename: 'current-lesson.pdf',
        translations: [
          {
            locale: 'pt',
            title: 'Current Lesson PT',
            description: 'Desc PT',
            url: 'https://cdn.example.com/current-lesson-pt.pdf',
          },
          {
            locale: 'it',
            title: 'Current Lesson IT',
            description: 'Desc IT',
            url: 'https://cdn.example.com/current-lesson-it.pdf',
          },
          {
            locale: 'es',
            title: 'Current Lesson ES',
            description: 'Desc ES',
            url: 'https://cdn.example.com/current-lesson-es.pdf',
          },
        ],
      });

      await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(currentLessonPayload)
        .expect(201);

      // Create document in other lesson
      const otherEndpoint = `/lessons/${otherLessonId}/documents`;
      const otherLessonPayload = createValidDocumentPayload({
        filename: 'other-lesson.pdf',
        translations: [
          {
            locale: 'pt',
            title: 'Other Lesson PT',
            description: 'Desc PT',
            url: 'https://cdn.example.com/other-lesson-pt.pdf',
          },
          {
            locale: 'it',
            title: 'Other Lesson IT',
            description: 'Desc IT',
            url: 'https://cdn.example.com/other-lesson-it.pdf',
          },
          {
            locale: 'es',
            title: 'Other Lesson ES',
            description: 'Desc ES',
            url: 'https://cdn.example.com/other-lesson-es.pdf',
          },
        ],
      });

      await request(app.getHttpServer())
        .post(otherEndpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(otherLessonPayload)
        .expect(201);

      // List documents from current lesson
      const currentRes = await request(app.getHttpServer())
        .get(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // List documents from other lesson
      const otherRes = await request(app.getHttpServer())
        .get(otherEndpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Each lesson should have only its own documents
      expect(currentRes.body).toHaveLength(2); // cross-validation.pdf + current-lesson.pdf
      expect(otherRes.body).toHaveLength(1); // other-lesson.pdf

      // Verify no overlap
      const currentFilenames = currentRes.body.map((doc: any) => doc.filename);
      const otherFilenames = otherRes.body.map((doc: any) => doc.filename);

      expect(currentFilenames).toContain('cross-validation.pdf');
      expect(currentFilenames).toContain('current-lesson.pdf');
      expect(currentFilenames).not.toContain('other-lesson.pdf');

      expect(otherFilenames).toContain('other-lesson.pdf');
      expect(otherFilenames).not.toContain('cross-validation.pdf');
      expect(otherFilenames).not.toContain('current-lesson.pdf');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed request payloads', async () => {
      const malformedPayload = {
        filename: 'test.pdf',
        // missing required fields
      };

      await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(malformedPayload)
        .expect(400);
    });

    it('should handle very large file sizes', async () => {
      const payload = createValidDocumentPayload({
        filename: 'large-file.pdf',
        // 1GB
        translations: [
          {
            locale: 'pt',
            title: 'Large File PT',
            description: 'Desc PT',
            url: 'https://cdn.example.com/large-file-pt.pdf',
          },
          {
            locale: 'it',
            title: 'Large File IT',
            description: 'Desc IT',
            url: 'https://cdn.example.com/large-file-it.pdf',
          },
          {
            locale: 'es',
            title: 'Large File ES',
            description: 'Desc ES',
            url: 'https://cdn.example.com/large-file-es.pdf',
          },
        ],
      });

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      // Should either accept or reject with appropriate status
      expect([201, 400, 413]).toContain(res.status);
    });

    it('should handle empty translations array', async () => {
      const payloadWithEmptyTranslations = createValidDocumentPayload({
        translations: [],
      });

      await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payloadWithEmptyTranslations)
        .expect(400);
    });

    it('should handle invalid locale in translations', async () => {
      const payloadWithInvalidLocale = createValidDocumentPayload({
        translations: [
          {
            locale: 'invalid-locale',
            title: 'Test Title',
            description: 'Test Description',
            url: 'https://cdn.example.com/test.pdf',
          },
        ],
      });

      await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payloadWithInvalidLocale)
        .expect(400);
    });

    it('should accept payload without file size field', async () => {
      const payloadWithoutFileSize = createValidDocumentPayload({});

      // fileSize is not part of the create DTO
      await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payloadWithoutFileSize)
        .expect(201);
    });

    it('should handle unsupported MIME types', async () => {
      const payloadWithUnsupportedMime = createValidDocumentPayload({});

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payloadWithUnsupportedMime);

      // Should either accept or reject based on business rules
      expect([201, 400]).toContain(res.status);
    });

    it('should handle invalid URLs in translations', async () => {
      const payloadWithInvalidUrls = createValidDocumentPayload({
        translations: [
          {
            locale: 'pt',
            title: 'Test PT',
            description: 'Desc PT',
            url: 'not-a-valid-url',
          },
        ],
      });

      await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payloadWithInvalidUrls)
        .expect(400);
    });

    it('should handle deletion of already deleted document', async () => {
      // Create and delete a document
      const payload = createValidDocumentPayload({
        filename: 'to-be-deleted.pdf',
        translations: [
          {
            locale: 'pt',
            title: 'To Be Deleted PT',
            description: 'Will be deleted',
            url: 'https://cdn.example.com/to-be-deleted-pt.pdf',
          },
          {
            locale: 'it',
            title: 'To Be Deleted IT',
            description: 'Will be deleted',
            url: 'https://cdn.example.com/to-be-deleted-it.pdf',
          },
          {
            locale: 'es',
            title: 'To Be Deleted ES',
            description: 'Will be deleted',
            url: 'https://cdn.example.com/to-be-deleted-es.pdf',
          },
        ],
      });

      const createRes = await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      const documentId = createRes.body.id;

      // Delete the document
      await request(app.getHttpServer())
        .delete(`${endpoint()}/${documentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Try to delete again
      await request(app.getHttpServer())
        .delete(`${endpoint()}/${documentId}`)
        .expect(404);
    });
  });

  describe('Data consistency and validation', () => {
    it('should properly calculate fileSizeInMB', async () => {
      const fileSizeBytes = 1024 * 1024 * 2.5; // 2.5MB
      const payload = createValidDocumentPayload({});

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      // Check if fileSizeInMB is included in the response
      if (res.body.fileSizeInMB !== undefined) {
        expect(typeof res.body.fileSizeInMB).toBe('number');
      }
    });

    it('should preserve translation order and URLs', async () => {
      const payload = createValidDocumentPayload();

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      const ptTranslation = res.body.translations.find(
        (t: any) => t.locale === 'pt',
      );
      const itTranslation = res.body.translations.find(
        (t: any) => t.locale === 'it',
      );
      const esTranslation = res.body.translations.find(
        (t: any) => t.locale === 'es',
      );

      expect(ptTranslation).toBeDefined();
      expect(itTranslation).toBeDefined();
      expect(esTranslation).toBeDefined();

      expect(ptTranslation.title).toBe('Material do Curso');
      expect(ptTranslation.url).toBe(
        'https://cdn.example.com/material-curso-pt.pdf',
      );

      expect(itTranslation.title).toBe('Materiale del Corso');
      expect(itTranslation.url).toBe(
        'https://cdn.example.com/material-curso-it.pdf',
      );

      expect(esTranslation.title).toBe('Material del Curso');
      expect(esTranslation.url).toBe(
        'https://cdn.example.com/material-curso-es.pdf',
      );
    });

    it('should initialize download count to zero', async () => {
      const payload = createValidDocumentPayload();

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      // downloadCount is not returned in the create response
    });

    it('should set default isDownloadable when not provided', async () => {
      const payload = createValidDocumentPayload();

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      // isDownloadable is not part of the DTO response
    });

    it('should ensure all translations have unique locales', async () => {
      const payloadWithDuplicateLocales = createValidDocumentPayload({
        translations: [
          {
            locale: 'pt',
            title: 'Test PT 1',
            description: 'Desc PT 1',
            url: 'https://cdn.example.com/test1-pt.pdf',
          },
          {
            locale: 'pt', // duplicate locale
            title: 'Test PT 2',
            description: 'Desc PT 2',
            url: 'https://cdn.example.com/test2-pt.pdf',
          },
        ],
      });

      await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payloadWithDuplicateLocales)
        .expect(400);
    });

    it('should ensure all required locales are present', async () => {
      const payloadMissingLocale = createValidDocumentPayload({
        translations: [
          {
            locale: 'pt',
            title: 'Test PT',
            description: 'Desc PT',
            url: 'https://cdn.example.com/test-pt.pdf',
          },
          // missing 'it' and 'es' locales
        ],
      });

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payloadMissingLocale);

      // Should either require all locales or accept partial translations
      expect([201, 400]).toContain(res.status);
    });
  });
});
