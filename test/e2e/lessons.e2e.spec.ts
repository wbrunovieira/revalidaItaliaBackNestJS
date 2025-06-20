// // src/test/lessons.e2e.spec.ts
// import request from 'supertest';
// import { INestApplication, ValidationPipe } from '@nestjs/common';
// import { Test } from '@nestjs/testing';
// import { AppModule } from '../../src/app.module';
// import { PrismaService } from '../../src/prisma/prisma.service';

// describe('LessonController (E2E)', () => {
//   let app: INestApplication;
//   let prisma: PrismaService;
//   let courseId: string;
//   let moduleId: string;

//   beforeAll(async () => {
//     const moduleRef = await Test.createTestingModule({
//       imports: [AppModule],
//     }).compile();

//     app = moduleRef.createNestApplication();
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
//     // Limpa todas as tabelas na ordem correta
//     await prisma.lessonTranslation.deleteMany();
//     await prisma.video.deleteMany();
//     await prisma.lesson.deleteMany();
//     await prisma.moduleTranslation.deleteMany();
//     await prisma.module.deleteMany();
//     await prisma.courseTranslation.deleteMany();
//     await prisma.course.deleteMany();

//     // Cria um curso
//     const course = await prisma.course.create({
//       data: {
//         slug: 'test-course',
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

//     // Cria um módulo
//     const module = await prisma.module.create({
//       data: {
//         slug: 'test-module',
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
//   });

//   const endpoint = () => `/courses/${courseId}/modules/${moduleId}/lessons`;

//   describe('[POST] create lesson', () => {
//     it('should create lesson successfully without video', async () => {
//       const payload = {
//         translations: [
//           { locale: 'pt', title: 'Aula PT', description: 'Desc PT' },
//           { locale: 'it', title: 'Lezione IT', description: 'Desc IT' },
//           { locale: 'es', title: 'Lección ES', description: 'Desc ES' },
//         ],
//       };

//       const res = await request(app.getHttpServer())
//         .post(endpoint())
//         .send(payload);

//       expect(res.status).toBe(201);
//       expect(res.body).toEqual(
//         expect.objectContaining({
//           id: expect.any(String),
//           moduleId,
//           translations: payload.translations,
//         }),
//       );
//       expect(res.body).not.toHaveProperty('videoId');
//     });

//     it('should return 400 when missing translation locale pt', async () => {
//       const payload = {
//         translations: [
//           { locale: 'it', title: 'Lezione IT', description: 'Desc IT' },
//           { locale: 'es', title: 'Lección ES', description: 'Desc ES' },
//         ],
//       };
//       const res = await request(app.getHttpServer())
//         .post(endpoint())
//         .send(payload);

//       expect(res.status).toBe(400);
//       expect(Array.isArray(res.body)).toBe(true);
//       expect(res.body).toEqual(
//         expect.arrayContaining([
//           expect.objectContaining({
//             path: expect.arrayContaining(['translations']),
//             code: 'too_small',
//           }),
//         ]),
//       );
//     });

//     it('should return 400 on unsupported locale', async () => {
//       const payload = {
//         translations: [
//           { locale: 'pt', title: 'Aula PT', description: 'Desc PT' },
//           { locale: 'en' as any, title: 'Lesson EN', description: 'Desc EN' },
//           { locale: 'es', title: 'Lección ES', description: 'Desc ES' },
//         ],
//       };
//       const res = await request(app.getHttpServer())
//         .post(endpoint())
//         .send(payload);

//       expect(res.status).toBe(400);
//       expect(res.body).toEqual(
//         expect.arrayContaining([
//           expect.objectContaining({
//             code: 'invalid_enum_value',
//             path: expect.arrayContaining(['translations', 1, 'locale']),
//           }),
//         ]),
//       );
//     });

//     it('should return 400 on empty translations array', async () => {
//       const res = await request(app.getHttpServer())
//         .post(endpoint())
//         .send({ translations: [] });

//       expect(res.status).toBe(400);
//       expect(res.body).toEqual(
//         expect.arrayContaining([
//           expect.objectContaining({
//             code: 'too_small',
//             path: expect.arrayContaining(['translations']),
//           }),
//         ]),
//       );
//     });

//     it('should return 400 on invalid moduleId format', async () => {
//       const badModuleId = 'invalid-uuid';
//       const res = await request(app.getHttpServer())
//         .post(`/courses/${courseId}/modules/${badModuleId}/lessons`)
//         .send({
//           translations: [
//             { locale: 'pt', title: 'Aula PT', description: 'Desc PT' },
//           ],
//         });

//       expect(res.status).toBe(400);
//     });

//     it('should return 404 when module not found', async () => {
//       const nonExistentModuleId = '00000000-0000-0000-0000-000000000000';
//       const payload = {
//         translations: [
//           { locale: 'pt', title: 'Aula PT', description: 'Desc PT' },
//           { locale: 'it', title: 'Lezione IT', description: 'Desc IT' },
//           { locale: 'es', title: 'Lección ES', description: 'Desc ES' },
//         ],
//       };
//       const res = await request(app.getHttpServer())
//         .post(`/courses/${courseId}/modules/${nonExistentModuleId}/lessons`)
//         .send(payload);

//       expect(res.status).toBe(404);
//     });
//   });

//   describe('[GET] list lessons', () => {
//     let baseLessonId: string;

//     beforeEach(async () => {
//       const lesson = await prisma.lesson.create({
//         data: {
//           moduleId,
//           translations: {
//             create: [
//               { locale: 'pt', title: 'Aula 1 PT', description: 'Desc PT' },
//               { locale: 'it', title: 'Lezione 1 IT', description: 'Desc IT' },
//               { locale: 'es', title: 'Lección 1 ES', description: 'Desc ES' },
//             ],
//           },
//         },
//       });
//       baseLessonId = lesson.id;
//     });

//     it('should list lessons with default pagination', async () => {
//       const res = await request(app.getHttpServer()).get(endpoint());
//       expect(res.status).toBe(200);
//       expect(res.body.lessons).toHaveLength(1);
//       expect(res.body.pagination).toEqual(
//         expect.objectContaining({
//           page: 1,
//           limit: 10,
//           total: 1,
//           totalPages: 1,
//           hasNext: false,
//           hasPrevious: false,
//         }),
//       );
//     });

//     it('should support pagination params', async () => {
//       const res = await request(app.getHttpServer())
//         .get(endpoint())
//         .query({ page: 1, limit: 1 });
//       expect(res.status).toBe(200);
//       expect(res.body.lessons).toHaveLength(1);
//     });

//     it('should return 400 on invalid query params', async () => {
//       const res = await request(app.getHttpServer())
//         .get(endpoint())
//         .query({ page: '0', limit: '-1' });
//       expect(res.status).toBe(400);
//     });

//     it('should return 404 for non-existent module', async () => {
//       const res = await request(app.getHttpServer()).get(
//         `/courses/${courseId}/modules/00000000-0000-0000-0000-000000000000/lessons`,
//       );
//       expect(res.status).toBe(404);
//     });
//   });
// });
