// // test/e2e/auth.e2e.spec.ts

// import 'dotenv/config';
// import { execSync } from 'child_process';
// import { INestApplication } from '@nestjs/common';
// import { Test } from '@nestjs/testing';
// import request from 'supertest';
// import { hash } from 'bcryptjs';
// import jwt from 'jsonwebtoken';

// import { AppModule } from '../../src/app.module';
// import { PrismaService } from '../../src/prisma/prisma.service';

// describe('Auth (E2E) — [POST] /auth/login', () => {
//   let app: INestApplication;
//   let prisma: PrismaService;
//   let testUserId: string;

//   const testEmail = 'login@test.com';
//   const testPassword = '12345@aA';

//   beforeAll(async () => {
//     execSync('npx prisma migrate deploy', { stdio: 'inherit' });
//     const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
//     app = moduleRef.createNestApplication();
//     await app.init();
//     prisma = app.get(PrismaService);

//     const hashed = await hash(testPassword, 10);
//     const user = await prisma.user.create({
//       data: { name: 'Login Test', email: testEmail, password: hashed, cpf: '99988877766', role: 'student' },
//     });
//     testUserId = user.id;
//   });

//   afterAll(async () => {
//     await prisma.user.delete({ where: { id: testUserId } });
//     await app.close();
//   });

//   it('✅ Sucesso: retorna 201, accessToken e usuário', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/auth/login')
//       .send({ email: testEmail, password: testPassword });

//     expect(res.status).toBe(201);
//     expect(res.body).toHaveProperty('accessToken');
//     expect(typeof res.body.accessToken).toBe('string');
//     expect(res.body.user.email).toBe(testEmail);
//   });

//   it('🔎 Token JWT contém sub e role corretos', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/auth/login')
//       .send({ email: testEmail, password: testPassword });

//     const decoded = jwt.decode(res.body.accessToken) as any;
//     expect(decoded.sub).toBe(testUserId);
//     expect(decoded.role).toBe('student');
//   });

//   it('⚠️ Falha: email ausente retorna 401', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/auth/login')
//       .send({ password: testPassword });

//     expect(res.status).toBe(401);
//     expect(res.body.message).toContain('Required');
//   });

//   it('⚠️ Falha: senha ausente retorna 401', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/auth/login')
//       .send({ email: testEmail });

//     expect(res.status).toBe(401);
//     expect(res.body.message).toContain('Required');
//   });

//   it('🔒 Falha: email não cadastrado retorna 401 e mensagem genérica', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/auth/login')
//       .send({ email: 'noone@nowhere.com', password: 'Whatever1A' });

//     expect(res.status).toBe(401);
//     expect(res.body.message).toBe('Invalid credentials');
//   });

//   it('🔒 Falha: senha inválida retorna 401 e mensagem genérica', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/auth/login')
//       .send({ email: testEmail, password: 'WrongPass1A' });

//     expect(res.status).toBe(401);
//     expect(res.body.message).toBe('Invalid credentials');
//   });

//   it('⚠️ Payload inválido: e-mail mal formado', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/auth/login')
//       .send({ email: 'not-an-email', password: '123456A' });

//     expect(res.status).toBe(401);
//     expect(res.body.message).toContain('Invalid email address');
//   });

//   it('⚠️ Payload inválido: senha muito curta', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/auth/login')
//       .send({ email: testEmail, password: '123' });

//     expect(res.status).toBe(401);
//     expect(res.body.message).toContain('Password must be at least 6 characters');
//   });

//   it('🔍 Ignora campos extras no payload e autentica', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/auth/login')
//       .send({ email: testEmail, password: testPassword, extra: 'field' });

//     expect(res.status).toBe(201);
//     expect(res.body.user.email).toBe(testEmail);
//   });

//   it('🛡️ Resiste a tentativa de SQL Injection', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/auth/login')
//       .send({ email: "' OR 1=1;--", password: "' OR 1=1;--" });

//     expect(res.status).toBe(401);
//     expect(res.body.message).toBe('Invalid credentials');
//   });

//   it('🔄 E-mail case-insensitive: autentica mesmo com uppercase', async () => {
//     const res = await request(app.getHttpServer())
//       .post('/auth/login')
//       .send({ email: testEmail.toUpperCase(), password: testPassword });

//     expect(res.status).toBe(201);
//     expect(res.body.user.email).toBe(testEmail);
//   });
// });