// // test/e/e2e/addresses.e2e.spec.ts
// import 'dotenv/config';
// import { execSync } from 'child_process';
// import { INestApplication } from '@nestjs/common';
// import { Test } from '@nestjs/testing';
// import request from 'supertest';
// import { AppModule } from '../../src/app.module';
// import { PrismaService } from '../../src/prisma/prisma.service';

// describe('Create Address (E2E)', () => {
//   let app: INestApplication;
//   let prisma: PrismaService;
//   const testEmails = ['addr-user1@example.com', 'addr-user2@example.com'];

//   beforeAll(async () => {
//     execSync('npx prisma migrate deploy', { stdio: 'inherit' });

//     const moduleRef = await Test.createTestingModule({
//       imports: [AppModule],
//     }).compile();

//     app = moduleRef.createNestApplication();
//     await app.init();

//     prisma = app.get(PrismaService);
//   });

//   afterAll(async () => {
//     const users = await prisma.user.findMany({
//       where: { email: { in: testEmails } },
//       select: { id: true },
//     });
//     const ids = users.map((u) => u.id);
//     await prisma.address.deleteMany({ where: { userId: { in: ids } } });
//     await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
//     await app.close();
//   });

//   it('[POST] /addresses – Success', async () => {
//     const userRes = await request(app.getHttpServer()).post('/students').send({
//       name: 'Addr User1',
//       email: testEmails[0],
//       password: 'Aa11@@aa',
//       cpf: '90090090090',
//       role: 'student',
//     });
//     expect(userRes.status).toBe(201);
//     const userId = userRes.body.user.id;

//     const addrRes = await request(app.getHttpServer()).post('/addresses').send({
//       userId,
//       street: '100 Elm St',
//       number: '10B',
//       complement: 'Suite 5',
//       district: 'Downtown',
//       city: 'Cityville',
//       state: 'Stateburg',
//       country: 'Countryland',
//       postalCode: '00011-223',
//     });
//     expect(addrRes.status).toBe(201);

//     const addr = await prisma.address.findFirst({ where: { userId } });
//     expect(addr).toBeTruthy();
//     if (addr) {
//       expect(addr.street).toBe('100 Elm St');
//       expect(addr.postalCode).toBe('00011-223');
//     }
//   });

//   it('[POST] /addresses – Missing required field', async () => {
//     const userRes = await request(app.getHttpServer()).post('/students').send({
//       name: 'Addr User2',
//       email: testEmails[1],
//       password: 'Bb22##bb',
//       cpf: '80880880880',
//       role: 'student',
//     });
//     expect(userRes.status).toBe(201);
//     const userId = userRes.body.user.id;

//     const res = await request(app.getHttpServer())
//       .post('/addresses')
//       .send({
//         userId,

//         city: 'Cityville',
//         country: 'Countryland',
//         postalCode: '11122-334',
//       })
//       .expect(400);

//     expect(typeof res.body.message).toBe('string');
//     expect(res.body.message.toLowerCase()).toMatch(
//       /street|number|district|city/,
//     );
//   });

//   it('[POST] /addresses – User not found (FK violation)', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/addresses')
//       .send({
//         userId: 'non-existent-id',
//         street: '1 Ghost Rd',
//         number: '1',
//         city: 'Nowhere',
//         country: 'Noland',
//         postalCode: '99999-000',
//       })

//       .expect(500);

//     expect(res.body.message).toBe('Database error creating address');
//   });

//   it('[GET] /addresses?userId= – Success', async () => {
//     const userRes = await request(app.getHttpServer()).post('/students').send({
//       name: 'FindAddr User',
//       email: 'findaddr@example.com',
//       password: 'Cc33$$cc',
//       cpf: '70770770770',
//       role: 'student',
//     });
//     expect(userRes.status).toBe(201);
//     const userId = userRes.body.user.id;

//     await request(app.getHttpServer())
//       .post('/addresses')
//       .send({
//         userId,
//         street: '200 Oak St',
//         number: '20A',
//         city: 'Treeville',
//         country: 'Woodland',
//         postalCode: '22233-444',
//       })
//       .expect(201);

//     await request(app.getHttpServer())
//       .post('/addresses')
//       .send({
//         userId,
//         street: '300 Pine St',
//         number: '30B',
//         city: 'Forest City',
//         country: 'Woodland',
//         postalCode: '33344-555',
//       })
//       .expect(201);

//     const res = await request(app.getHttpServer())
//       .get('/addresses')
//       .query({ userId })
//       .expect(200);

//     expect(Array.isArray(res.body)).toBe(true);
//     expect(res.body).toHaveLength(2);
//     expect(res.body).toEqual(
//       expect.arrayContaining([
//         expect.objectContaining({
//           street: '200 Oak St',
//           number: '20A',
//           city: 'Treeville',
//         }),
//         expect.objectContaining({
//           street: '300 Pine St',
//           number: '30B',
//           city: 'Forest City',
//         }),
//       ]),
//     );
//   });

//   it('[GET] /addresses – Missing userId', async () => {
//     const res = await request(app.getHttpServer())
//       .get('/addresses')
//       .expect(400);

//     expect(typeof res.body.message).toBe('string');
//     expect(res.body.message.toLowerCase()).toMatch(/userid|userId/i);
//   });

//   it('[PATCH] /addresses/:id – Success', async () => {
//     const userRes = await request(app.getHttpServer()).post('/students').send({
//       name: 'Patch Success User',
//       email: 'addr-patch-success@example.com',
//       password: 'Cc44%%cc',
//       cpf: '60660660660',
//       role: 'student',
//     });
//     expect(userRes.status).toBe(201);
//     const userId = userRes.body.user.id;

//     const createRes = await request(app.getHttpServer())
//       .post('/addresses')
//       .send({
//         userId,
//         street: '200 Oak St',
//         number: '20A',
//         city: 'Oldtown',
//         country: 'Oldland',
//         postalCode: '22233-444',
//       });
//     expect(createRes.status).toBe(201);
//     const addressId = createRes.body.addressId;

//     const updateRes = await request(app.getHttpServer())
//       .patch(`/addresses/${addressId}`)
//       .send({ street: '201 Oak St', city: 'Newtown' })
//       .expect(200);

//     expect(updateRes.body).toMatchObject({
//       id: addressId,
//       street: '201 Oak St',
//       city: 'Newtown',
//     });

//     const updated = await prisma.address.findUnique({
//       where: { id: addressId },
//     });
//     expect(updated).toBeTruthy();
//     if (updated) {
//       expect(updated.street).toBe('201 Oak St');
//       expect(updated.city).toBe('Newtown');
//     }
//   });

//   it('[PATCH] /addresses/:id – Missing Fields', async () => {
//     const res = await request(app.getHttpServer())
//       .patch('/addresses/nonexistent-id')
//       .send({})
//       .expect(400);

//     expect(typeof res.body.message).toBe('string');
//     expect(res.body.message).toBe(
//       'At least one field to update must be provided',
//     );
//   });

//   it('[PATCH] /addresses/:id – Not Found', async () => {
//     const res = await request(app.getHttpServer())
//       .patch('/addresses/00000000-0000-0000-0000-000000000000')
//       .send({ street: 'Nothing' })
//       .expect(500);

//     expect(res.body.message).toBe('Address not found');
//   });
// });
