// test/e2e/addresses.e2e.spec.ts
import 'dotenv/config'
import { execSync } from 'child_process'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../src/prisma/prisma.service'

describe('Create Address (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  const testEmails = [
    'addr-user1@example.com',
    'addr-user2@example.com',
  ]

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()

    prisma = app.get(PrismaService)
  })

  afterAll(async () => {
    // cleanup: remove addresses then users
    const users = await prisma.user.findMany({
      where: { email: { in: testEmails } },
      select: { id: true },
    })
    const ids = users.map(u => u.id)
    await prisma.address.deleteMany({ where: { userId: { in: ids } } })
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } })
    await app.close()
  })

  it('[POST] /addresses – Success', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/students')
      .send({
        name: 'Addr User1',
        email: testEmails[0],
        password: 'Aa11@@aa',
        cpf: '90090090090',
        role: 'student',
      })
    expect(userRes.status).toBe(201)
    const userId = userRes.body.user.id

    const addrRes = await request(app.getHttpServer())
      .post('/addresses')
      .send({
        userId,
        street: '100 Elm St',
        number: '10B',
        complement: 'Suite 5',
        district: 'Downtown',
        city: 'Cityville',
        state: 'Stateburg',
        country: 'Countryland',
        postalCode: '00011-223',
      })
    expect(addrRes.status).toBe(201)

    const addr = await prisma.address.findFirst({ where: { userId } })
    expect(addr).toBeTruthy()
    if (addr) {
      expect(addr.street).toBe('100 Elm St')
      expect(addr.postalCode).toBe('00011-223')
    }
  })

  it('[POST] /addresses – Missing required field', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/students')
      .send({
        name: 'Addr User2',
        email: testEmails[1],
        password: 'Bb22##bb',
        cpf: '80880880880',
        role: 'student',
      })
    expect(userRes.status).toBe(201)
    const userId = userRes.body.user.id

    const res = await request(app.getHttpServer())
      .post('/addresses')
      .send({
        userId,
        number: '10C',
        city: 'Cityville',
        country: 'Countryland',
        postalCode: '11122-334',
      })
    expect(res.status).toBe(400)
    // should return validation errors
    expect(res.body.errors).toBeDefined()
  })

  it('[POST] /addresses – User not found (FK violation)', async () => {
    const res = await request(app.getHttpServer())
      .post('/addresses')
      .send({
        userId: 'non-existent-id',
        street: '1 Ghost Rd',
        number: '1',
        city: 'Nowhere',
        country: 'Noland',
        postalCode: '99999-000',
      })
    expect(res.status).toBe(500)
    expect(res.body.message).toBe('Database error creating address')
  })
})