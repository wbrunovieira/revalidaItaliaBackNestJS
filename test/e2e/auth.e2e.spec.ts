// test/e2e/auth.e2e.spec.ts

import 'dotenv/config';
import { execSync } from 'child_process';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { E2ETestModule } from './test-helpers/e2e-test-module';

describe('Auth (E2E) — [POST] /auth/login', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUserId: string;

  const testEmail = 'login@test.com';
  const testPassword = '12345@aA';

  beforeAll(async () => {
    // Set JWT keys BEFORE creating the module
    process.env.JWT_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Z3VS5JDcds4meW8hfaF3PhSVP3wG6gxPEYdVV5EiNsVDmCh
gweHg1lCrNgMPd0YFe82KwO66vC0IZhZ7VfB0xV2Wwfb/4Wto7C7pV8lQjBHxwHo
W8w7eL7gwAIRJiLlafqPf4qhkJrP8rMYj9RgSbUsdCCYfKLI6qHiU4km3OTXzVOE
DPvkUXxom8Y+GkwFm9jF0xwqNeTm/XJyJJnSrPmLQN7k5ePXO2++HHGLUXo7iT7J
NUoD3YzGsXFjy0TJQgS7NhCGD0or0Y0EYs2vBnwlqCmpCRQlwY3lg3Og3a92dTQo
M4NCJEoQjvBJxPHxGR2vYPCqBx8nGhpvNGePvwIDAQABAoIBAElNcMillfnR72F1
Sz3/BQNX3HPFTliWQu5miTnTW0L6UVQN7nCudLOmVyiXKoKNZDGJ4LTKXG3F6fMb
XaOjpRCp3m4H5KvmzwwdIp6lNgJoYIy3cOYPAKdP3hxHT3IJHYXjdmvDJh2cTxUr
9rW8AK3UBvCGEMLtbP5uYmuLxjQy5lSU+Nvwqxph8V/4j8hYN9RP1Y5bBPFQpUKe
DiMJ3VMOd0LxQR4UQ8ROx8Bs9YMkHHGxxNrF2xDZT3haYisUJNPKBcKb2sd0Vb9L
kR05KGL7YXLQVJT5XxGQ72D9KNxNk8W7wLNFwRedN9wLSNqGyTp/bXEXDU6qx/vZ
+1rPmlECgYEA78E0++H+NFOCMqHPjECMvbrI+G7gNQlFl0Bk5oH8/AUqRwYi49qJ
bjKUqQNjZEQK8T8OZTvWZv8+1QB8Q+gVuPQU4W6wLqLWD3RaSYBQQxNcU/tTXHLg
C0hoK9p6cFHQj6xNUQgIICEK5e7wnBvEW9du+1kU7ri1gTKb6xvzNdMCgYEA4A6x
iP5TtE1F9k+kqNvmMm6J1cqPa7TY0RT6aVZkuFZaKPVXBnmsC8045kNaquoCpLXE
wyH6TbfvBX4yKvmgR1L7D6dAbAg9HIvo+6DDxBBG3x1S+lrGmCXPKKYd+ka4D5aH
1WFXVLCzB5rEVTrv6+FtvFXpK2IKwWt50PNRnXUCgYEAxIZP1qTi+Lq0tf1uTqHz
W1kZVMZQs7xNmVsVQ7cVdrC/2fbtLV5cZPtHI3S1FX7dFQu7c/bQ4wCDzzld9vLx
LyJ3tXGU6yBrJztaH0QrKvgYnRdMNT6SQbLCXsSXqALBczNTs8c2JCdKKvGDNo5G
rEhurj1x1ahfBBLNmyKPTl0CgYB3YXQjYrRVEKTIuqc8dFpztpHVOCR0hkNhLZDR
tI48IFXpBPW5qnSHvlQw5IbIECTBpwYiHEMr5dRgMVmgJumwSBEAOf5fvc5kJ3NG
y3XfEWmVd5T3GXnzFME3i/jSfv8jqhp7HZBkN0u1wc6pL9YmAMpMSRIQ1f0cqxdH
EJ7zBQKBgG5Vc+NFcEM7EG9k0XPLqtLYhsHUa0Z8W5v3j+RuPX8J6LZmWZ3gNJtU
4tM2RwXCqNQoqPmFmnJOr9qHbCqE8BtbCXRbHNNBS0LVo3wXpDgeVjcgaQcNkHcy
-----END RSA PRIVATE KEY-----`;
    process.env.JWT_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3VS5JDcds4meW8hfaF
3PhSVP3wG6gxPEYdVV5EiNsVDmChgweHg1lCrNgMPd0YFe82KwO66vC0IZhZ7VfB
0xV2Wwfb/4Wto7C7pV8lQjBHxwHoW8w7eL7gwAIRJiLlafqPf4qhkJrP8rMYj9Rg
SbUsdCCYfKLI6qHiU4km3OTXzVOEDPvkUXxom8Y+GkwFm9jF0xwqNeTm/XJyJJnS
rPmLQN7k5ePXO2++HHGLUXo7iT7JNUoD3YzGsXFjy0TJQgS7NhCGD0or0Y0EYs2v
BnwlqCmpCRQlwY3lg3Og3a92dTQoM4NCJEoQjvBJxPHxGR2vYPCqBx8nGhpvNGeP
vwIDAQAB
-----END PUBLIC KEY-----`;

    execSync('npx prisma migrate deploy', { stdio: 'inherit' });

    // Ensure JWT env vars are set before module creation
    const { app: testApp } = await E2ETestModule.create([AppModule]);
    app = testApp;
    prisma = app.get(PrismaService);

    const hashed = await hash(testPassword, 10);
    const user = await prisma.user.create({
      data: {
        name: 'Login Test',
        email: testEmail,
        password: hashed,
        cpf: '99988877766',
        role: 'student',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUserId } });
    await app.close();
  });

  it('✅ Sucesso: retorna 201, accessToken e usuário', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(typeof res.body.accessToken).toBe('string');
    expect(res.body.user.email).toBe(testEmail);
  });

  it('🔎 Token JWT contém sub e role corretos', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });

    const decoded = jwt.decode(res.body.accessToken) as any;
    expect(decoded.sub).toBe(testUserId);
    expect(decoded.role).toBe('student');
  });

  it('⚠️ Falha: email ausente retorna 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ password: testPassword });

    expect(res.status).toBe(401);
    expect(res.body.detail).toBe('Invalid credentials');
  });

  it('⚠️ Falha: senha ausente retorna 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail });

    expect(res.status).toBe(401);
    expect(res.body.detail).toBe('Invalid credentials');
  });

  it('🔒 Falha: email não cadastrado retorna 401 e mensagem genérica', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'noone@nowhere.com', password: 'Whatever1A' });

    expect(res.status).toBe(401);
    expect(res.body.detail).toBe('Invalid credentials');
  });

  it('🔒 Falha: senha inválida retorna 401 e mensagem genérica', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'WrongPass1A' });

    expect(res.status).toBe(401);
    expect(res.body.detail).toBe('Invalid credentials');
  });

  it('⚠️ Payload inválido: e-mail mal formado', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email', password: '123456A' });

    expect(res.status).toBe(401);
    expect(res.body.detail).toBe('Invalid credentials');
  });

  it('⚠️ Payload inválido: senha muito curta', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: '123' });

    expect(res.status).toBe(401);
    expect(res.body.detail).toBe('Invalid credentials');
  });

  it('🔍 Ignora campos extras no payload e autentica', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword, extra: 'field' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(testEmail);
  });

  it('🛡️ Resiste a tentativa de SQL Injection', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: "' OR 1=1;--", password: "' OR 1=1;--" });

    expect(res.status).toBe(401);
    expect(res.body.detail).toBe('Invalid credentials');
  });

  it('🔄 E-mail case-insensitive: autentica mesmo com uppercase', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail.toUpperCase(), password: testPassword });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(testEmail);
  });
});
