// test/e2e/documents.e2e.spec.ts
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('DocumentController (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let courseId: string;
  let moduleId: string;
  let lessonId: string;
  let createdDocumentId: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // limpa tudo na ordem certa
    await prisma.lessonDocumentTranslation.deleteMany();
    await prisma.lessonDocument.deleteMany();

    await prisma.videoTranslation.deleteMany();
    await prisma.video.deleteMany();

    await prisma.lesson.deleteMany();

    await prisma.moduleTranslation.deleteMany();
    await prisma.module.deleteMany();

    await prisma.courseTranslation.deleteMany();
    await prisma.course.deleteMany();

    // cria curso
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

    // cria módulo
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

    // agora criamos a lesson vinculada ao módulo
    const lesson = await prisma.lesson.create({
      data: { moduleId },
    });
    lessonId = lesson.id;
  });

  // monta a rota usando lessonId
  const endpoint = () => `/courses/${courseId}/lessons/${lessonId}/documents`;

  describe('[POST] create document', () => {
    it('→ Success (PDF Document)', async () => {
      const payload = {
        url: 'https://cdn.example.com/material-curso.pdf',
        filename: 'material-curso.pdf',
        fileSize: 1024 * 1024, // 1MB
        mimeType: 'application/pdf',
        isDownloadable: true,
        translations: [
          {
            locale: 'pt',
            title: 'Material do Curso',
            description: 'Apostila em PDF',
          },
          {
            locale: 'it',
            title: 'Materiale del Corso',
            description: 'Dispensa in PDF',
          },
          {
            locale: 'es',
            title: 'Material del Curso',
            description: 'Apostilla en PDF',
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          url: payload.url,
          filename: payload.filename,
          title: 'Material do Curso',
          fileSize: payload.fileSize,
          fileSizeInMB: 1,
          mimeType: payload.mimeType,
          isDownloadable: payload.isDownloadable,
          downloadCount: 0,
        }),
      );
      createdDocumentId = res.body.id;
    });

    it('→ Success (Word Document)', async () => {
      const payload = {
        url: 'https://cdn.example.com/exercicios.docx',
        filename: 'exercicios.docx',
        fileSize: 512 * 1024, // 512KB
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        isDownloadable: true,
        translations: [
          {
            locale: 'pt',
            title: 'Exercícios',
            description: 'Lista de exercícios',
          },
          { locale: 'it', title: 'Esercizi', description: 'Lista di esercizi' },
          {
            locale: 'es',
            title: 'Ejercicios',
            description: 'Lista de ejercicios',
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.mimeType).toBe(payload.mimeType);
      expect(res.body.fileSizeInMB).toBe(0.5);
    });

    it('→ Success (Excel Document)', async () => {
      const payload = {
        url: 'https://cdn.example.com/planilha.xlsx',
        filename: 'planilha.xlsx',
        fileSize: 256 * 1024, // 256KB
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        translations: [
          {
            locale: 'pt',
            title: 'Planilha',
            description: 'Planilha de cálculos',
          },
          { locale: 'it', title: 'Foglio', description: 'Foglio di calcolo' },
          { locale: 'es', title: 'Hoja', description: 'Hoja de cálculo' },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.fileSizeInMB).toBe(0.25);
    });

    it('→ Duplicate Filename', async () => {
      const payload = {
        url: 'https://cdn.example.com/duplicate.pdf',
        filename: 'duplicate.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        translations: [
          { locale: 'pt', title: 'Duplicado PT', description: 'Desc PT' },
          { locale: 'it', title: 'Duplicato IT', description: 'Desc IT' },
          { locale: 'es', title: 'Duplicado ES', description: 'Desc ES' },
        ],
      };

      let res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);
      expect(res.status).toBe(201);

      res = await request(app.getHttpServer()).post(endpoint()).send(payload);
      expect(res.status).toBe(409);
    });

    it('→ File Too Large (>50MB)', async () => {
      const payload = {
        url: 'https://cdn.example.com/huge-file.pdf',
        filename: 'huge-file.pdf',
        fileSize: 60 * 1024 * 1024, // 60MB
        mimeType: 'application/pdf',
        translations: [
          {
            locale: 'pt',
            title: 'Arquivo Gigante',
            description: 'Muito grande',
          },
          { locale: 'it', title: 'File Gigante', description: 'Troppo grande' },
          { locale: 'es', title: 'Archivo Gigante', description: 'Muy grande' },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('→ Invalid MIME Type', async () => {
      const payload = {
        url: 'https://cdn.example.com/document.pdf',
        filename: 'document.pdf',
        fileSize: 1024,
        mimeType: 'application/unsupported',
        translations: [
          { locale: 'pt', title: 'MIME Inválido', description: 'Desc PT' },
          { locale: 'it', title: 'MIME Invalido', description: 'Desc IT' },
          { locale: 'es', title: 'MIME Inválido', description: 'Desc ES' },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('→ MIME Type vs Extension Mismatch', async () => {
      const payload = {
        url: 'https://cdn.example.com/document.txt',
        filename: 'document.txt',
        fileSize: 1024,
        mimeType: 'application/pdf', // TXT file with PDF MIME type
        translations: [
          { locale: 'pt', title: 'Extensão Errada', description: 'Desc PT' },
          {
            locale: 'it',
            title: 'Estensione Sbagliata',
            description: 'Desc IT',
          },
          {
            locale: 'es',
            title: 'Extensión Incorrecta',
            description: 'Desc ES',
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('→ Missing Portuguese Translation', async () => {
      const payload = {
        url: 'https://cdn.example.com/no-pt.pdf',
        filename: 'no-pt.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        translations: [
          { locale: 'it', title: 'Only IT', description: 'Desc IT' },
          { locale: 'es', title: 'Only ES', description: 'Desc ES' },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('→ Insufficient Translations', async () => {
      const payload = {
        url: 'https://cdn.example.com/one-trans.pdf',
        filename: 'one-trans.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        translations: [
          { locale: 'pt', title: 'Apenas PT', description: 'Só português' },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('→ Invalid URL Format', async () => {
      const payload = {
        url: 'not-a-valid-url',
        filename: 'document.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        translations: [
          { locale: 'pt', title: 'URL Inválida', description: 'Desc PT' },
          { locale: 'it', title: 'URL Invalido', description: 'Desc IT' },
          { locale: 'es', title: 'URL Inválido', description: 'Desc ES' },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('→ Invalid Filename Format', async () => {
      const payload = {
        url: 'https://cdn.example.com/document.pdf',
        filename: 'invalid filename without extension',
        fileSize: 1024,
        mimeType: 'application/pdf',
        translations: [
          { locale: 'pt', title: 'Nome Inválido', description: 'Desc PT' },
          { locale: 'it', title: 'Nome Invalido', description: 'Desc IT' },
          { locale: 'es', title: 'Nombre Inválido', description: 'Desc ES' },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('→ Unsupported Locale', async () => {
      const payload = {
        url: 'https://cdn.example.com/bad-locale.pdf',
        filename: 'bad-locale.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        translations: [
          { locale: 'pt', title: 'OK', description: 'Desc PT' },
          { locale: 'en' as any, title: 'EN', description: 'Desc EN' },
          { locale: 'fr' as any, title: 'FR', description: 'Desc FR' },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('→ Missing Required Fields', async () => {
      const payload = {
        // url missing
        filename: 'incomplete.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        translations: [
          { locale: 'pt', title: 'Incompleto', description: 'Desc PT' },
          { locale: 'it', title: 'Incompleto', description: 'Desc IT' },
          { locale: 'es', title: 'Incompleto', description: 'Desc ES' },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send(payload);

      expect(res.status).toBe(400);
    });
  });

  describe('[GET] get document', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send({
          url: 'https://cdn.example.com/e2e-doc.pdf',
          filename: 'e2e-doc.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          translations: [
            { locale: 'pt', title: 'Documento E2E PT', description: 'Desc PT' },
            { locale: 'it', title: 'Documento E2E IT', description: 'Desc IT' },
            { locale: 'es', title: 'Documento E2E ES', description: 'Desc ES' },
          ],
        });
      createdDocumentId = res.body.id;
    });

    it('→ Success returns placeholder message (not implemented)', async () => {
      const res = await request(app.getHttpServer())
        .get(`${endpoint()}/${createdDocumentId}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Get document endpoint - to be implemented',
          documentId: createdDocumentId,
        }),
      );
    });

    it('→ Not Found for nonexistent id', async () => {
      const res = await request(app.getHttpServer())
        .get(`${endpoint()}/00000000-0000-0000-0000-000000000000`)
        .send();
      expect(res.status).toBe(404);
    });

    it('→ Bad Request for invalid UUID', async () => {
      const res = await request(app.getHttpServer())
        .get(`${endpoint()}/not-a-uuid`)
        .send();
      expect(res.status).toBe(400);
    });
  });

  describe('[GET] list documents', () => {
    it('→ Success returns placeholder message (not implemented)', async () => {
      const payload1 = {
        url: 'https://cdn.example.com/list-doc-1.pdf',
        filename: 'list-doc-1.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        translations: [
          { locale: 'pt', title: 'L1 PT', description: 'Desc1' },
          { locale: 'it', title: 'L1 IT', description: 'Desc1 IT' },
          { locale: 'es', title: 'L1 ES', description: 'Desc1 ES' },
        ],
      };
      const payload2 = {
        url: 'https://cdn.example.com/list-doc-2.docx',
        filename: 'list-doc-2.docx',
        fileSize: 2048,
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        translations: [
          { locale: 'pt', title: 'L2 PT', description: 'Desc2' },
          { locale: 'it', title: 'L2 IT', description: 'Desc2 IT' },
          { locale: 'es', title: 'L2 ES', description: 'Desc2 ES' },
        ],
      };
      await request(app.getHttpServer()).post(endpoint()).send(payload1);
      await request(app.getHttpServer()).post(endpoint()).send(payload2);

      const res = await request(app.getHttpServer()).get(endpoint()).send();
      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'List documents endpoint - to be implemented',
          lessonId,
        }),
      );
    });

    it('→ Success returns placeholder when no documents', async () => {
      const res = await request(app.getHttpServer()).get(endpoint()).send();
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('to be implemented');
    });
  });

  describe('[POST] increment download', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send({
          url: 'https://cdn.example.com/download-test.pdf',
          filename: 'download-test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          translations: [
            {
              locale: 'pt',
              title: 'Teste Download PT',
              description: 'Desc PT',
            },
            { locale: 'it', title: 'Test Download IT', description: 'Desc IT' },
            { locale: 'es', title: 'Test Download ES', description: 'Desc ES' },
          ],
        });
      createdDocumentId = res.body.id;
    });

    it('→ Success increments download count', async () => {
      const res = await request(app.getHttpServer())
        .post(`${endpoint()}/${createdDocumentId}/download`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Download count incremented successfully',
          documentId: createdDocumentId,
        }),
      );
    });

    it('→ Not Found for nonexistent document', async () => {
      const res = await request(app.getHttpServer())
        .post(`${endpoint()}/00000000-0000-0000-0000-000000000000/download`)
        .send();
      expect(res.status).toBe(404);
    });

    it('→ Bad Request for invalid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post(`${endpoint()}/not-a-uuid/download`)
        .send();
      expect(res.status).toBe(400);
    });
  });

  describe('Cross-lesson validation', () => {
    let otherLessonId: string;

    beforeEach(async () => {
      // Criar outra lesson no mesmo módulo
      const otherLesson = await prisma.lesson.create({
        data: { moduleId },
      });
      otherLessonId = otherLesson.id;

      // Criar documento na primeira lesson
      const res = await request(app.getHttpServer())
        .post(endpoint())
        .send({
          url: 'https://cdn.example.com/cross-lesson.pdf',
          filename: 'cross-lesson.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          translations: [
            { locale: 'pt', title: 'Cross Lesson PT', description: 'Desc PT' },
            { locale: 'it', title: 'Cross Lesson IT', description: 'Desc IT' },
            { locale: 'es', title: 'Cross Lesson ES', description: 'Desc ES' },
          ],
        });
      createdDocumentId = res.body.id;
    });
  });
});
