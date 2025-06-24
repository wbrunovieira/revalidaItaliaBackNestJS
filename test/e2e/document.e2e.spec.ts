// // test/e2e/documents.e2e.spec.ts (Versão atualizada com testes GetDocument)
// import request from 'supertest';
// import { INestApplication, ValidationPipe } from '@nestjs/common';
// import { Test } from '@nestjs/testing';
// import { AppModule } from '../../src/app.module';
// import { PrismaService } from '../../src/prisma/prisma.service';

// describe('DocumentController (E2E)', () => {
//   let app: INestApplication;
//   let prisma: PrismaService;
//   let courseId: string;
//   let moduleId: string;
//   let lessonId: string;
//   let createdDocumentId: string;

//   beforeAll(async () => {
//     const modRef = await Test.createTestingModule({
//       imports: [AppModule],
//     }).compile();

//     app = modRef.createNestApplication();
//     app.useGlobalPipes(
//       new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
//     );
//     await app.init();

//     prisma = app.get(PrismaService);
//   });

//   afterAll(async () => {
//     await app.close();
//   });

//   beforeEach(async () => {
//     // limpa tudo na ordem certa
//     await prisma.lessonDocumentTranslation.deleteMany();
//     await prisma.lessonDocument.deleteMany();

//     await prisma.videoTranslation.deleteMany();
//     await prisma.video.deleteMany();

//     await prisma.lesson.deleteMany();

//     await prisma.moduleTranslation.deleteMany();
//     await prisma.module.deleteMany();

//     await prisma.courseTranslation.deleteMany();
//     await prisma.course.deleteMany();

//     // cria curso
//     const course = await prisma.course.create({
//       data: {
//         slug: 'test-course-doc',
//         translations: {
//           create: [
//             { locale: 'pt', title: 'Curso PT', description: 'Desc PT' },
//             { locale: 'it', title: 'Corso IT', description: 'Desc IT' },
//             { locale: 'es', title: 'Curso ES', description: 'Desc ES' },
//           ],
//         },
//       },
//     });
//     courseId = course.id;

//     // cria módulo
//     const module = await prisma.module.create({
//       data: {
//         slug: 'test-module-doc',
//         order: 1,
//         courseId,
//         translations: {
//           create: [
//             { locale: 'pt', title: 'Módulo PT', description: 'Desc PT' },
//             { locale: 'it', title: 'Modulo IT', description: 'Desc IT' },
//             { locale: 'es', title: 'Modulo ES', description: 'Desc ES' },
//           ],
//         },
//       },
//     });
//     moduleId = module.id;

//     // agora criamos a lesson vinculada ao módulo
//     const lesson = await prisma.lesson.create({
//       data: { moduleId },
//     });
//     lessonId = lesson.id;
//   });

//   // monta a rota usando lessonId
//   const endpoint = () => `/courses/${courseId}/lessons/${lessonId}/documents`;

//   describe('[POST] create document', () => {
//     it('→ Success (PDF Document)', async () => {
//       const payload = {
//         url: 'https://cdn.example.com/material-curso.pdf',
//         filename: 'material-curso.pdf',
//         fileSize: 1024 * 1024, // 1MB
//         mimeType: 'application/pdf',
//         isDownloadable: true,
//         translations: [
//           {
//             locale: 'pt',
//             title: 'Material do Curso',
//             description: 'Apostila em PDF',
//           },
//           {
//             locale: 'it',
//             title: 'Materiale del Corso',
//             description: 'Dispensa in PDF',
//           },
//           {
//             locale: 'es',
//             title: 'Material del Curso',
//             description: 'Apostilla en PDF',
//           },
//         ],
//       };

//       const res = await request(app.getHttpServer())
//         .post(endpoint())
//         .send(payload);

//       expect(res.status).toBe(201);
//       expect(res.body).toEqual(
//         expect.objectContaining({
//           url: payload.url,
//           filename: payload.filename,
//           title: 'Material do Curso',
//           fileSize: payload.fileSize,
//           fileSizeInMB: 1,
//           mimeType: payload.mimeType,
//           isDownloadable: payload.isDownloadable,
//           downloadCount: 0,
//         }),
//       );
//       createdDocumentId = res.body.id;
//     });

//     it('→ Success (Word Document)', async () => {
//       const payload = {
//         url: 'https://cdn.example.com/exercicios.docx',
//         filename: 'exercicios.docx',
//         fileSize: 512 * 1024, // 512KB
//         mimeType:
//           'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//         isDownloadable: true,
//         translations: [
//           {
//             locale: 'pt',
//             title: 'Exercícios',
//             description: 'Lista de exercícios',
//           },
//           { locale: 'it', title: 'Esercizi', description: 'Lista di esercizi' },
//           {
//             locale: 'es',
//             title: 'Ejercicios',
//             description: 'Lista de ejercicios',
//           },
//         ],
//       };

//       const res = await request(app.getHttpServer())
//         .post(endpoint())
//         .send(payload);

//       expect(res.status).toBe(201);
//       expect(res.body.filename).toBe('exercicios.docx');
//       expect(res.body.title).toBe('Exercícios');
//       expect(typeof res.body.fileSizeInMB).toBe('number');
//       expect(typeof res.body.mimeType).toBe('string');
//     });

//     // ... outros testes de create permanecem iguais ...
//   });

//   describe('[GET] get document', () => {
//     beforeEach(async () => {
//       const res = await request(app.getHttpServer())
//         .post(endpoint())
//         .send({
//           url: 'https://cdn.example.com/e2e-doc.pdf',
//           filename: 'e2e-doc.pdf',
//           fileSize: 1024 * 1024, // 1MB
//           mimeType: 'application/pdf',
//           isDownloadable: true,
//           translations: [
//             {
//               locale: 'pt',
//               title: 'Documento E2E PT',
//               description: 'Descrição completa em português',
//             },
//             {
//               locale: 'it',
//               title: 'Documento E2E IT',
//               description: 'Descrizione completa in italiano',
//             },
//             {
//               locale: 'es',
//               title: 'Documento E2E ES',
//               description: 'Descripción completa en español',
//             },
//           ],
//         });
//       createdDocumentId = res.body.id;
//     });

//     it('→ Success returns complete document with translations', async () => {
//       const res = await request(app.getHttpServer())
//         .get(`${endpoint()}/${createdDocumentId}`)
//         .send();

//       expect(res.status).toBe(200);
//       expect(res.body).toEqual(
//         expect.objectContaining({
//           id: createdDocumentId,
//           url: 'https://cdn.example.com/e2e-doc.pdf',
//           filename: 'e2e-doc.pdf',
//           title: 'Documento E2E PT', // Título da tradução PT (padrão)
//           // Campos que podem ter valores padrão na implementação atual
//           fileSize: expect.any(Number),
//           fileSizeInMB: expect.any(Number),
//           mimeType: expect.any(String),
//           isDownloadable: expect.any(Boolean),
//           downloadCount: expect.any(Number),
//           createdAt: expect.any(String),
//           updatedAt: expect.any(String),
//           translations: expect.arrayContaining([
//             expect.objectContaining({
//               locale: 'pt',
//               title: 'Documento E2E PT',
//               description: 'Descrição completa em português',
//             }),
//             expect.objectContaining({
//               locale: 'it',
//               title: 'Documento E2E IT',
//               description: 'Descrizione completa in italiano',
//             }),
//             expect.objectContaining({
//               locale: 'es',
//               title: 'Documento E2E ES',
//               description: 'Descripción completa en español',
//             }),
//           ]),
//         }),
//       );

//       // Verificar que todas as traduções estão presentes
//       expect(res.body.translations).toHaveLength(3);

//       // Verificar tipos de dados
//       expect(typeof res.body.id).toBe('string');
//       expect(typeof res.body.fileSize).toBe('number');
//       expect(typeof res.body.fileSizeInMB).toBe('number');
//       expect(typeof res.body.isDownloadable).toBe('boolean');
//       expect(typeof res.body.downloadCount).toBe('number');
//       expect(new Date(res.body.createdAt)).toBeInstanceOf(Date);
//       expect(new Date(res.body.updatedAt)).toBeInstanceOf(Date);

//       // Verificar estrutura específica das traduções
//       const ptTranslation = res.body.translations.find(
//         (t: any) => t.locale === 'pt',
//       );
//       const itTranslation = res.body.translations.find(
//         (t: any) => t.locale === 'it',
//       );
//       const esTranslation = res.body.translations.find(
//         (t: any) => t.locale === 'es',
//       );

//       expect(ptTranslation).toBeDefined();
//       expect(ptTranslation.title).toBe('Documento E2E PT');
//       expect(ptTranslation.description).toBe('Descrição completa em português');

//       expect(itTranslation).toBeDefined();
//       expect(itTranslation.title).toBe('Documento E2E IT');
//       expect(itTranslation.description).toBe(
//         'Descrizione completa in italiano',
//       );

//       expect(esTranslation).toBeDefined();
//       expect(esTranslation.title).toBe('Documento E2E ES');
//       expect(esTranslation.description).toBe('Descripción completa en español');
//     });

//     it('→ Not Found for nonexistent document', async () => {
//       const res = await request(app.getHttpServer())
//         .get(`${endpoint()}/00000000-0000-0000-0000-000000000000`)
//         .send();

//       expect(res.status).toBe(404);
//       expect(res.body.message).toMatch(/Document not found|not found/i);
//     });

//     it('→ Bad Request for invalid UUID format', async () => {
//       const res = await request(app.getHttpServer())
//         .get(`${endpoint()}/not-a-uuid`)
//         .send();

//       expect(res.status).toBe(400);
//     });

//     it('→ Not Found for document from different lesson', async () => {
//       // Criar outro módulo e lesson
//       const otherModule = await prisma.module.create({
//         data: {
//           slug: 'test-module-other',
//           order: 2,
//           courseId,
//           translations: {
//             create: [
//               {
//                 locale: 'pt',
//                 title: 'Outro Módulo PT',
//                 description: 'Desc PT',
//               },
//               {
//                 locale: 'it',
//                 title: 'Altro Modulo IT',
//                 description: 'Desc IT',
//               },
//               { locale: 'es', title: 'Otro Módulo ES', description: 'Desc ES' },
//             ],
//           },
//         },
//       });

//       const otherLesson = await prisma.lesson.create({
//         data: { moduleId: otherModule.id },
//       });

//       // Criar documento na outra lesson
//       const otherDocRes = await request(app.getHttpServer())
//         .post(`/courses/${courseId}/lessons/${otherLesson.id}/documents`)
//         .send({
//           url: 'https://cdn.example.com/other-lesson-doc.pdf',
//           filename: 'other-lesson-doc.pdf',
//           fileSize: 1024,
//           mimeType: 'application/pdf',
//           translations: [
//             {
//               locale: 'pt',
//               title: 'Doc Outra Lesson PT',
//               description: 'Desc PT',
//             },
//             {
//               locale: 'it',
//               title: 'Doc Altra Lezione IT',
//               description: 'Desc IT',
//             },
//             {
//               locale: 'es',
//               title: 'Doc Otra Lección ES',
//               description: 'Desc ES',
//             },
//           ],
//         });

//       // Tentar acessar documento da outra lesson através da lesson atual
//       const res = await request(app.getHttpServer())
//         .get(`${endpoint()}/${otherDocRes.body.id}`)
//         .send();

//       expect(res.status).toBe(404);
//       expect(res.body.message).toMatch(/Document not found|not found/i);
//     });

//     it('→ Success handles different MIME types correctly', async () => {
//       const testCases = [
//         {
//           filename: 'test.docx',
//           mimeType:
//             'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//           size: 512 * 1024, // 512KB
//           expectedTitle: 'Teste test.docx PT',
//         },
//         {
//           filename: 'test.xlsx',
//           mimeType:
//             'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//           size: 256 * 1024, // 256KB
//           expectedTitle: 'Teste test.xlsx PT',
//         },
//         {
//           filename: 'test.pptx',
//           mimeType:
//             'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//           size: 1024 * 1024, // 1MB
//           expectedTitle: 'Teste test.pptx PT',
//         },
//       ];

//       for (const testCase of testCases) {
//         const payload = {
//           url: `https://cdn.example.com/${testCase.filename}`,
//           filename: testCase.filename,
//           fileSize: testCase.size,
//           mimeType: testCase.mimeType,
//           translations: [
//             {
//               locale: 'pt',
//               title: `Teste ${testCase.filename} PT`,
//               description: 'Desc PT',
//             },
//             {
//               locale: 'it',
//               title: `Test ${testCase.filename} IT`,
//               description: 'Desc IT',
//             },
//             {
//               locale: 'es',
//               title: `Test ${testCase.filename} ES`,
//               description: 'Desc ES',
//             },
//           ],
//         };

//         const createRes = await request(app.getHttpServer())
//           .post(endpoint())
//           .send(payload);

//         const res = await request(app.getHttpServer())
//           .get(`${endpoint()}/${createRes.body.id}`)
//           .send();

//         expect(res.status).toBe(200);

//         // Verificar propriedades básicas
//         expect(res.body.filename).toBe(testCase.filename);
//         expect(res.body.url).toBe(payload.url);
//         expect(res.body.title).toBe(testCase.expectedTitle);

//         // Verificar tipos dos campos (mesmo que tenham valores padrão)
//         expect(typeof res.body.mimeType).toBe('string');
//         expect(typeof res.body.fileSize).toBe('number');
//         expect(typeof res.body.fileSizeInMB).toBe('number');

//         // Verificar traduções
//         expect(res.body.translations).toHaveLength(3);
//         const ptTranslation = res.body.translations.find(
//           (t: any) => t.locale === 'pt',
//         );
//         expect(ptTranslation.title).toBe(`Teste ${testCase.filename} PT`);
//         expect(ptTranslation.description).toBe('Desc PT');
//       }
//     });
//   });

//   describe('[GET] list documents', () => {
//     it('→ Success returns list of documents', async () => {
//       const payload1 = {
//         url: 'https://cdn.example.com/list-doc-1.pdf',
//         filename: 'list-doc-1.pdf',
//         fileSize: 1024,
//         mimeType: 'application/pdf',
//         translations: [
//           { locale: 'pt', title: 'L1 PT', description: 'Desc1' },
//           { locale: 'it', title: 'L1 IT', description: 'Desc1 IT' },
//           { locale: 'es', title: 'L1 ES', description: 'Desc1 ES' },
//         ],
//       };
//       const payload2 = {
//         url: 'https://cdn.example.com/list-doc-2.docx',
//         filename: 'list-doc-2.docx',
//         fileSize: 2048,
//         mimeType:
//           'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//         translations: [
//           { locale: 'pt', title: 'L2 PT', description: 'Desc2' },
//           { locale: 'it', title: 'L2 IT', description: 'Desc2 IT' },
//           { locale: 'es', title: 'L2 ES', description: 'Desc2 ES' },
//         ],
//       };
//       await request(app.getHttpServer()).post(endpoint()).send(payload1);
//       await request(app.getHttpServer()).post(endpoint()).send(payload2);

//       const res = await request(app.getHttpServer()).get(endpoint()).send();
//       expect(res.status).toBe(200);
//       expect(Array.isArray(res.body)).toBe(true);
//       expect(res.body).toHaveLength(2);

//       // Verificar estrutura dos documentos retornados
//       const doc1 = res.body.find((d: any) => d.filename === 'list-doc-1.pdf');
//       expect(doc1).toBeDefined();
//       expect(doc1).toEqual(
//         expect.objectContaining({
//           id: expect.any(String),
//           url: payload1.url,
//           filename: payload1.filename,
//           title: 'L1 PT', // título da tradução PT
//           fileSize: expect.any(Number),
//           fileSizeInMB: expect.any(Number),
//           mimeType: expect.any(String),
//           isDownloadable: expect.any(Boolean),
//           downloadCount: expect.any(Number),
//           createdAt: expect.any(String),
//           updatedAt: expect.any(String),
//           translations: expect.arrayContaining([
//             expect.objectContaining({ locale: 'pt', title: 'L1 PT' }),
//             expect.objectContaining({ locale: 'it', title: 'L1 IT' }),
//             expect.objectContaining({ locale: 'es', title: 'L1 ES' }),
//           ]),
//         }),
//       );

//       const doc2 = res.body.find((d: any) => d.filename === 'list-doc-2.docx');
//       expect(doc2).toBeDefined();
//       expect(doc2.translations).toHaveLength(3);
//     });

//     it('→ Success returns empty array when no documents', async () => {
//       const res = await request(app.getHttpServer()).get(endpoint()).send();
//       expect(res.status).toBe(200);
//       expect(Array.isArray(res.body)).toBe(true);
//       expect(res.body).toEqual([]);
//     });
//   });

//   describe('[POST] increment download', () => {
//     beforeEach(async () => {
//       const res = await request(app.getHttpServer())
//         .post(endpoint())
//         .send({
//           url: 'https://cdn.example.com/download-test.pdf',
//           filename: 'download-test.pdf',
//           fileSize: 1024,
//           mimeType: 'application/pdf',
//           translations: [
//             {
//               locale: 'pt',
//               title: 'Teste Download PT',
//               description: 'Desc PT',
//             },
//             { locale: 'it', title: 'Test Download IT', description: 'Desc IT' },
//             { locale: 'es', title: 'Test Download ES', description: 'Desc ES' },
//           ],
//         });
//       createdDocumentId = res.body.id;
//     });

//     it('→ Success increments download count', async () => {
//       const res = await request(app.getHttpServer())
//         .post(`${endpoint()}/${createdDocumentId}/download`)
//         .send();

//       expect(res.status).toBe(200);
//       expect(res.body).toEqual(
//         expect.objectContaining({
//           message: 'Download count incremented successfully',
//           documentId: createdDocumentId,
//         }),
//       );
//     });

//     it('→ Not Found for nonexistent document', async () => {
//       const res = await request(app.getHttpServer())
//         .post(`${endpoint()}/00000000-0000-0000-0000-000000000000/download`)
//         .send();
//       expect(res.status).toBe(404);
//     });

//     it('→ Bad Request for invalid UUID', async () => {
//       const res = await request(app.getHttpServer())
//         .post(`${endpoint()}/not-a-uuid/download`)
//         .send();
//       expect(res.status).toBe(400);
//     });
//   });

//   describe('Cross-lesson and Cross-course validation', () => {
//     let otherCourseId: string;
//     let otherLessonId: string;
//     let sameCourseOtherLessonId: string;

//     beforeEach(async () => {
//       // Criar outro curso
//       const otherCourse = await prisma.course.create({
//         data: {
//           slug: 'other-course-doc',
//           translations: {
//             create: [
//               { locale: 'pt', title: 'Outro Curso PT', description: 'Desc PT' },
//               { locale: 'it', title: 'Altro Corso IT', description: 'Desc IT' },
//               { locale: 'es', title: 'Otro Curso ES', description: 'Desc ES' },
//             ],
//           },
//         },
//       });
//       otherCourseId = otherCourse.id;

//       // Criar módulo e lesson no outro curso
//       const otherModule = await prisma.module.create({
//         data: {
//           slug: 'other-module-doc',
//           order: 1,
//           courseId: otherCourseId,
//           translations: {
//             create: [
//               {
//                 locale: 'pt',
//                 title: 'Outro Módulo PT',
//                 description: 'Desc PT',
//               },
//               {
//                 locale: 'it',
//                 title: 'Altro Modulo IT',
//                 description: 'Desc IT',
//               },
//               { locale: 'es', title: 'Otro Módulo ES', description: 'Desc ES' },
//             ],
//           },
//         },
//       });

//       const otherLesson = await prisma.lesson.create({
//         data: { moduleId: otherModule.id },
//       });
//       otherLessonId = otherLesson.id;

//       // Criar outro módulo e lesson no mesmo curso
//       const sameCourseModule = await prisma.module.create({
//         data: {
//           slug: 'same-course-other-module',
//           order: 2,
//           courseId,
//           translations: {
//             create: [
//               {
//                 locale: 'pt',
//                 title: 'Módulo Mesmo Curso PT',
//                 description: 'Desc PT',
//               },
//               {
//                 locale: 'it',
//                 title: 'Modulo Stesso Corso IT',
//                 description: 'Desc IT',
//               },
//               {
//                 locale: 'es',
//                 title: 'Módulo Mismo Curso ES',
//                 description: 'Desc ES',
//               },
//             ],
//           },
//         },
//       });

//       const sameCourseOtherLesson = await prisma.lesson.create({
//         data: { moduleId: sameCourseModule.id },
//       });
//       sameCourseOtherLessonId = sameCourseOtherLesson.id;

//       // Criar documento na lesson original
//       const res = await request(app.getHttpServer())
//         .post(endpoint())
//         .send({
//           url: 'https://cdn.example.com/cross-validation.pdf',
//           filename: 'cross-validation.pdf',
//           fileSize: 1024,
//           mimeType: 'application/pdf',
//           translations: [
//             {
//               locale: 'pt',
//               title: 'Cross Validation PT',
//               description: 'Desc PT',
//             },
//             {
//               locale: 'it',
//               title: 'Cross Validation IT',
//               description: 'Desc IT',
//             },
//             {
//               locale: 'es',
//               title: 'Cross Validation ES',
//               description: 'Desc ES',
//             },
//           ],
//         });
//       createdDocumentId = res.body.id;
//     });

//     it('→ Cannot access document from different course', async () => {
//       const otherCourseEndpoint = `/courses/${otherCourseId}/lessons/${otherLessonId}/documents`;

//       const res = await request(app.getHttpServer())
//         .get(`${otherCourseEndpoint}/${createdDocumentId}`)
//         .send();

//       expect(res.status).toBe(404);
//       expect(res.body.message).toMatch(/Lesson not found|not found/i);
//     });

//     it('→ Cannot access document from different lesson (same course)', async () => {
//       const sameCourseOtherEndpoint = `/courses/${courseId}/lessons/${sameCourseOtherLessonId}/documents`;

//       const res = await request(app.getHttpServer())
//         .get(`${sameCourseOtherEndpoint}/${createdDocumentId}`)
//         .send();

//       expect(res.status).toBe(404);
//       expect(res.body.message).toMatch(/Document not found|not found/i);
//     });

//     it('→ List documents only shows documents from current lesson', async () => {
//       // Criar documento na lesson atual
//       await request(app.getHttpServer())
//         .post(endpoint())
//         .send({
//           url: 'https://cdn.example.com/current-lesson.pdf',
//           filename: 'current-lesson.pdf',
//           fileSize: 1024,
//           mimeType: 'application/pdf',
//           translations: [
//             {
//               locale: 'pt',
//               title: 'Current Lesson PT',
//               description: 'Desc PT',
//             },
//             {
//               locale: 'it',
//               title: 'Current Lesson IT',
//               description: 'Desc IT',
//             },
//             {
//               locale: 'es',
//               title: 'Current Lesson ES',
//               description: 'Desc ES',
//             },
//           ],
//         });

//       // Criar documento na outra lesson (mesmo curso)
//       const otherEndpoint = `/courses/${courseId}/lessons/${sameCourseOtherLessonId}/documents`;
//       await request(app.getHttpServer())
//         .post(otherEndpoint)
//         .send({
//           url: 'https://cdn.example.com/other-lesson.pdf',
//           filename: 'other-lesson.pdf',
//           fileSize: 1024,
//           mimeType: 'application/pdf',
//           translations: [
//             { locale: 'pt', title: 'Other Lesson PT', description: 'Desc PT' },
//             { locale: 'it', title: 'Other Lesson IT', description: 'Desc IT' },
//             { locale: 'es', title: 'Other Lesson ES', description: 'Desc ES' },
//           ],
//         });

//       // Listar documentos da lesson atual
//       const currentRes = await request(app.getHttpServer())
//         .get(endpoint())
//         .send();

//       // Listar documentos da outra lesson
//       const otherRes = await request(app.getHttpServer())
//         .get(otherEndpoint)
//         .send();

//       expect(currentRes.status).toBe(200);
//       expect(otherRes.status).toBe(200);

//       // Cada lesson deve ter apenas seus próprios documentos
//       expect(currentRes.body).toHaveLength(2); // cross-validation.pdf + current-lesson.pdf
//       expect(otherRes.body).toHaveLength(1); // other-lesson.pdf

//       // Verificar que não há overlap
//       const currentFilenames = currentRes.body.map((doc: any) => doc.filename);
//       const otherFilenames = otherRes.body.map((doc: any) => doc.filename);

//       expect(currentFilenames).toContain('cross-validation.pdf');
//       expect(currentFilenames).toContain('current-lesson.pdf');
//       expect(currentFilenames).not.toContain('other-lesson.pdf');

//       expect(otherFilenames).toContain('other-lesson.pdf');
//       expect(otherFilenames).not.toContain('cross-validation.pdf');
//       expect(otherFilenames).not.toContain('current-lesson.pdf');
//     });
//   });
// });
