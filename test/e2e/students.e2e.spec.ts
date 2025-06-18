// // test/e2e/students.e2e.spec.ts
// import 'dotenv/config'
// import { execSync } from 'child_process'
// import { INestApplication } from '@nestjs/common'
// import { Test } from '@nestjs/testing'
// import request from 'supertest'
// import { AppModule } from '../../src/app.module'
// import { PrismaService } from '../../src/prisma/prisma.service'

// describe('Create Account (E2E)', () => {
//   let app: INestApplication
//   let prisma: PrismaService

//   beforeAll(async () => {

//     execSync('npx prisma migrate deploy', { stdio: 'inherit' })

//     const moduleRef = await Test.createTestingModule({
//       imports: [AppModule],
//     }).compile()

//     app = moduleRef.createNestApplication()
//     await app.init()

//     prisma = app.get(PrismaService)
//   })

//   afterAll(async () => {

//     await prisma.user.deleteMany({
//       where: {
//         email: {
//           in: [
//             'bruno@example.com',
//             'duplicate@example.com',
//             'alice@example.com',
//             'bob@example.com',
//             'conflictcpf@example.com',
//           ],
//         },
//       },
//     })
//     await app.close()
//   })

//   it('[POST] /students  - Success', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/students')
//       .send({
//         name: 'Bruno Vieira',
//         email: 'bruno@example.com',
//         password: '12345@aA',
//         cpf: '12345678909',
//         role: 'student',
//       })

//     expect(res.status).toBe(201)
//     const user = await prisma.user.findUnique({
//       where: { email: 'bruno@example.com' },
//     })
//     expect(user).toBeTruthy()
//   })

//   it('[POST] /students - Missing Name', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/students')
//       .send({
//         email: 'missingname@example.com',
//         password: '12345@aA',
//         cpf: '11122233344',
//         role: 'student',
//       })

//     expect(res.status).toBe(400)
//     expect(res.body.errors.details).toContainEqual({
//       code: 'invalid_type',
//       expected: 'string',
//       message: 'Required',
//       path: ['name'],
//       received: 'undefined',
//     })
//   })

//   it('[POST] /students - Missing CPF', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/students')
//       .send({
//         name: 'Alice',
//         email: 'alice@example.com',
//         password: '12345@aA',
//         role: 'student',
//       })

//     expect(res.status).toBe(400)
//     expect(res.body.errors.details).toContainEqual({
//       code: 'invalid_type',
//       expected: 'string',
//       message: 'Required',
//       path: ['cpf'],
//       received: 'undefined',
//     })
//   })

//   it('[POST] /students - Missing Role', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/students')
//       .send({
//         name: 'Bob',
//         email: 'bob@example.com',
//         password: '12345@aA',
//         cpf: '55566677788',
//       })

//     expect(res.status).toBe(400)
//     expect(res.body.errors.details).toContainEqual({
//       code: 'invalid_type',
//       expected: 'string',
//       message: 'Required',
//       path: ['role'],
//       received: 'undefined',
//     })
//   })

//   it('[POST] /students - Invalid Email', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/students')
//       .send({
//         name: 'Invalid Email',
//         email: 'invalid-email',
//         password: '12345@aA',
//         cpf: '22233344455',
//         role: 'student',
//       })

//     expect(res.status).toBe(400)
//     expect(res.body.errors.details).toContainEqual({
//       code: 'invalid_string',
//       validation: 'email',
//       message: 'Invalid email',
//       path: ['email'],
//     })
//   })

//   it('[POST] /students - Invalid CPF', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/students')
//       .send({
//         name: 'Invalid CPF',
//         email: 'cpf@example.com',
//         password: '12345@aA',
//         cpf: 'abc123',
//         role: 'student',
//       })

//     expect(res.status).toBe(400)
//     expect(res.body.errors.details).toContainEqual({
//       code: 'invalid_string',
//       validation: 'regex',
//       message: 'Invalid CPF',
//       path: ['cpf'],
//     })
//   })

//   it('[POST] /students - Weak Password', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/students')
//       .send({
//         name: 'Weak Password',
//         email: 'weak@example.com',
//         password: 'weak',
//         cpf: '77788899900',
//         role: 'student',
//       })

//     expect(res.status).toBe(400)
//     // password <6 chars
//     expect(res.body.errors.details).toContainEqual(
//       expect.objectContaining({
//         code: 'too_small',
//         minimum: 6,
//         path: ['password'],
//       })
//     )
//     // sem letra maiúscula
//     expect(res.body.errors.details).toContainEqual(
//       expect.objectContaining({
//         code: 'invalid_string',
//         message: 'Password must contain at least one uppercase letter',
//         validation: 'regex',
//         path: ['password'],
//       })
//     )
//   })

//   it('[POST] /students - Email Conflict', async () => {
//     const payload = {
//       name: 'Duplicate User',
//       email: 'duplicate@example.com',
//       password: '12345@aA',
//       cpf: '33344455566',
//       role: 'student',
//     }

//     await request(app.getHttpServer()).post('/students').send(payload)

//     const res = await request(app.getHttpServer())
//       .post('/students')
//       .send({
//         ...payload,
//         cpf: '44455566677',
//       })

//     expect(res.status).toBe(409)
//     expect(res.body.message).toContain('already exists')
//   })

//   it('[POST] /students - CPF Conflict', async () => {
//     const payload1 = {
//       name: 'User A',
//       email: 'conflictcpf@example.com',
//       password: '12345@aA',
//       cpf: '88899900011',
//       role: 'student',
//     }

//     await request(app.getHttpServer()).post('/students').send(payload1)

//     const res = await request(app.getHttpServer())
//       .post('/students')
//       .send({
//         name: 'User B',
//         email: 'another@example.com',
//         password: '12345@aA',
//         cpf: '88899900011',
//         role: 'student',
//       })

//     expect(res.status).toBe(409)
//     expect(res.body.message).toContain('already exists')
//   })

//   // ────────────────────────────────────────────────────────────
//   // Update Account (E2E)
//   // ────────────────────────────────────────────────────────────

//   it('[PATCH] /students/:id - Success', async () => {

//     const createRes = await request(app.getHttpServer())
//       .post('/students')
//       .send({
//         name:     'Updater',
//         email:    'updater@example.com',
//         password: 'Aa11@@aa',
//         cpf:      '10101010101',
//         role:     'student',
//       });
//     expect(createRes.status).toBe(201);
//     const { id } = createRes.body.user;

//     const res = await request(app.getHttpServer())
//       .patch(`/students/${id}`)
//       .send({
//         name:  'Updated Name',
//         email: 'updated@example.com',
//       });
//     expect(res.status).toBe(200);
//     expect(res.body.user.name).toBe('Updated Name');
//     expect(res.body.user.email).toBe('updated@example.com');

//     const updated = await prisma.user.findUnique({ where: { id } });
//     expect(updated).toBeTruthy();
//     if (updated) {
//           expect(updated.name).toBe('Updated Name');
//             expect(updated.email).toBe('updated@example.com');
//           }
//   });

//   it('[PATCH] /students/:id - Missing Fields', async () => {
//     const createRes = await request(app.getHttpServer())
//       .post('/students')
//       .send({
//         name:     'NoFields',
//         email:    'nofields@example.com',
//         password: 'Bb22##bb',
//         cpf:      '20202020202',
//         role:     'student',
//       });
//     const { id } = createRes.body.user;

//     const res = await request(app.getHttpServer())
//       .patch(`/students/${id}`)
//       .send({});
//     expect(res.status).toBe(400);
//     expect(res.body.message).toBe('At least one field to update must be provided');
//     expect(res.body.errors.details).toEqual([]);
//   });

//   it('[PATCH] /students/:id - Not Found', async () => {
//     const res = await request(app.getHttpServer())
//       .patch('/students/nonexistent-id')
//       .send({ name: 'X' });
//     expect(res.status).toBe(400);
//     expect(res.body.message).toBe('User not found');
//   });

//   it('[PATCH] /students/:id - Email Conflict', async () => {

//     const u1 = await request(app.getHttpServer())
//       .post('/students')
//       .send({
//         name:     'EmailA',
//         email:    'emaila@example.com',
//         password: 'Cc33$$cc',
//         cpf:      '30303030303',
//         role:     'student',
//       });
//     const u2 = await request(app.getHttpServer())
//       .post('/students')
//       .send({
//         name:     'EmailB',
//         email:    'emailb@example.com',
//         password: 'Dd44%%dd',
//         cpf:      '40404040404',
//         role:     'student',
//       });
//     const idA = u1.body.user.id;

//     const res = await request(app.getHttpServer())
//       .patch(`/students/${idA}`)
//       .send({ email: 'emailb@example.com' });
//     expect(res.status).toBe(409);
//     expect(res.body.message).toContain('already exists');
//   });

//   it('[PATCH] /students/:id - CPF Conflict', async () => {

//     const u1 = await request(app.getHttpServer())
//       .post('/students')
//       .send({
//         name:     'CpfA',
//         email:    'cpfa@example.com',
//         password: 'Ee55^^ee',
//         cpf:      '50505050505',
//         role:     'student',
//       });
//     const u2 = await request(app.getHttpServer())
//       .post('/students')
//       .send({
//         name:     'CpfB',
//         email:    'cpfb@example.com',
//         password: 'Ff66&&ff',
//         cpf:      '60606060606',
//         role:     'student',
//       });
//     const idA = u1.body.user.id;

//     const res = await request(app.getHttpServer())
//       .patch(`/students/${idA}`)
//       .send({ cpf: '60606060606' });
//     expect(res.status).toBe(409);
//     expect(res.body.message).toContain('already exists');
//   });
// })
