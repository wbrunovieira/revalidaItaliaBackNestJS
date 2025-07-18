// test/e2e/addresses.e2e.spec.ts
import { execSync } from 'child_process';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { E2ETestModule } from './test-helpers/e2e-test-module';

describe('Create Address (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testEmails = ['addr-user1@example.com', 'addr-user2@example.com'];

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });

    const { app: testApp } = await E2ETestModule.create([AppModule]);
    app = testApp;
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (prisma) {
      const users = await prisma.user.findMany({
        where: { email: { in: testEmails } },
        select: { id: true },
      });
      const ids = users.map((u) => u.id);
      await prisma.address.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
    }
    if (app) {
      await app.close();
    }
  });

  it('[POST] /addresses – Success', async () => {
    const userRes = await request(app.getHttpServer()).post('/students').send({
      name: 'Addr User1',
      email: testEmails[0],
      password: 'Aa11@@aa',
      cpf: '90090090090',
      role: 'student',
    });
    expect(userRes.status).toBe(201);
    const userId = userRes.body.user.id;

    const addrRes = await request(app.getHttpServer()).post('/addresses').send({
      userId,
      street: '100 Elm St',
      number: '10B',
      complement: 'Suite 5',
      district: 'Downtown',
      city: 'Cityville',
      state: 'Stateburg',
      country: 'Countryland',
      postalCode: '00011-223',
    });
    expect(addrRes.status).toBe(201);

    const addr = await prisma.address.findFirst({ where: { userId } });
    expect(addr).toBeTruthy();
    if (addr) {
      expect(addr.street).toBe('100 Elm St');
      expect(addr.postalCode).toBe('00011-223');
    }
  });

  it('[POST] /addresses – Missing required field', async () => {
    const userRes = await request(app.getHttpServer()).post('/students').send({
      name: 'Addr User2',
      email: testEmails[1],
      password: 'Bb22##bb',
      cpf: '80880880880',
      role: 'student',
    });
    expect(userRes.status).toBe(201);
    const userId = userRes.body.user.id;

    const res = await request(app.getHttpServer())
      .post('/addresses')
      .send({
        userId,

        city: 'Cityville',
        country: 'Countryland',
        postalCode: '11122-334',
      })
      .expect(400);

    expect(typeof res.body.message).toBe('string');
    expect(res.body.message.toLowerCase()).toMatch(
      /street|number|district|city/,
    );
  });

  it('[POST] /addresses – User not found (FK violation)', async () => {
    const res = await request(app.getHttpServer())
      .post('/addresses')
      .send({
        userId: '550e8400-e29b-41d4-a716-446655440099',
        street: '999 Fake St',
        number: '1A',
        complement: 'none',
        district: 'Unknown',
        city: 'FakeCity',
        state: 'Nowhere',
        country: 'Neverland',
        postalCode: '99999',
      })
      .expect(500); // Currently returns 500 due to FK constraint error

    expect(res.body.message).toMatch(/database error|user not found/i);
  });

  it('[GET] /addresses?userId= – Success', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/students')
      .send({
        name: 'Get Addr User',
        email: 'get-addr@example.com',
        password: 'Cc33$$cc',
        cpf: '70770770770',
        role: 'student',
      });
    const userId = userRes.body.user.id;

    await request(app.getHttpServer())
      .post('/addresses')
      .send({
        userId,
        street: '200 Main St',
        number: '20',
        complement: '',
        district: 'Midtown',
        city: 'Townsville',
        state: 'Stateland',
        country: 'Countryland',
        postalCode: '22233-445',
      });

    const res = await request(app.getHttpServer())
      .get(`/addresses?userId=${userId}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].street).toBe('200 Main St');

    await prisma.address.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it('[GET] /addresses – Missing userId', async () => {
    const res = await request(app.getHttpServer())
      .get('/addresses')
      .expect(400);

    expect(res.body.message).toMatch(/userId/i);
  });

  it('[PATCH] /addresses/:id – Success', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/students')
      .send({
        name: 'Patch Addr User',
        email: 'patch-addr@example.com',
        password: 'Dd44%%dd',
        cpf: '60660660660',
        role: 'student',
      });
    const userId = userRes.body.user.id;

    const createRes = await request(app.getHttpServer())
      .post('/addresses')
      .send({
        userId,
        street: '300 Oak St',
        number: '30',
        complement: 'Apt 1',
        district: 'Uptown',
        city: 'Cityplace',
        state: 'Statezone',
        country: 'Countryland',
        postalCode: '33344-556',
      })
      .expect(201);
    const addressId = createRes.body.addressId;

    const patchRes = await request(app.getHttpServer())
      .patch(`/addresses/${addressId}`)
      .send({
        street: '301 Oak St',
        number: '31',
      })
      .expect(200);

    expect(patchRes.body.street).toBe('301 Oak St');
    expect(patchRes.body.number).toBe('31');

    await prisma.address.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it('[PATCH] /addresses/:id – Missing Fields', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/addresses/550e8400-e29b-41d4-a716-446655440099`)
      .send({})
      .expect(400);

    expect(res.body.message).toMatch(/at least one field/i);
  });

  it('[PATCH] /addresses/:id – Not Found', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/addresses/550e8400-e29b-41d4-a716-446655440099`)
      .send({
        street: 'New Street',
      })
      .expect(404);

    expect(res.body.message).toMatch(/not found/i);
  });
});