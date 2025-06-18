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
//     // limpa as tabelas na ordem correta
//     await prisma.lessonTranslation.deleteMany();
//     await prisma.lesson.deleteMany();
//     await prisma.moduleTranslation.deleteMany();
//     await prisma.module.deleteMany();
//     await prisma.courseTranslation.deleteMany();
//     await prisma.course.deleteMany();

//     // cria Course
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

//     // cria Module
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
//     it('→ Success', async () => {
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
//     });

//     it('→ Missing Portuguese translation', async () => {
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
//       expect(res.body).toEqual(
//         expect.objectContaining({
//           error: 'Bad Request',
//           message: expect.arrayContaining([
//             expect.objectContaining({
//               message: expect.stringMatching(/pt translation/i),
//             }),
//           ]),
//           statusCode: 400,
//         }),
//       );
//     });

//     it('→ Unsupported locale', async () => {
//       const payload = {
//         translations: [
//           { locale: 'pt', title: 'Aula PT', description: 'Desc PT' },
//           // locale 'en' não suportado
//           { locale: 'en' as any, title: 'Lesson EN', description: 'Desc EN' },
//           { locale: 'es', title: 'Lección ES', description: 'Desc ES' },
//         ],
//       };

//       const res = await request(app.getHttpServer())
//         .post(endpoint())
//         .send(payload);

//       expect(res.status).toBe(400);
//       expect(res.body).toEqual(
//         expect.objectContaining({
//           error: 'Bad Request',
//           message: expect.arrayContaining([
//             expect.objectContaining({
//               message: expect.stringMatching(/locale/i),
//             }),
//           ]),
//           statusCode: 400,
//         }),
//       );
//     });
//   });
// });
