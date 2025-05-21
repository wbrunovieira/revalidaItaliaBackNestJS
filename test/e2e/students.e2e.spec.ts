// test/e2e/students.e2e.spec.ts
import 'dotenv/config'          
import { execSync } from 'child_process'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../src/prisma/prisma.service'

describe('Create Account (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService

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

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'bruno@example.com',
            'duplicate@example.com',
            'alice@example.com',
            'bob@example.com',
            'conflictcpf@example.com',
          ],
        },
      },
    })
    await app.close()
  })

  it('[POST] /students  - Success', async () => {
    const res = await request(app.getHttpServer())
      .post('/students')
      .send({
        name: 'Bruno Vieira',
        email: 'bruno@example.com',
        password: '12345@aA',
        cpf: '12345678909',
        role: 'student',
      })

    expect(res.status).toBe(201)
    const user = await prisma.user.findUnique({
      where: { email: 'bruno@example.com' },
    })
    expect(user).toBeTruthy()
  })

  it('[POST] /students - Missing Name', async () => {
    const res = await request(app.getHttpServer())
      .post('/students')
      .send({
        email: 'missingname@example.com',
        password: '12345@aA',
        cpf: '11122233344',
        role: 'student',
      })

    expect(res.status).toBe(400)
    expect(res.body.errors.details).toContainEqual({
      code: 'invalid_type',
      expected: 'string',
      message: 'Required',
      path: ['name'],
      received: 'undefined',
    })
  })

  it('[POST] /students - Missing CPF', async () => {
    const res = await request(app.getHttpServer())
      .post('/students')
      .send({
        name: 'Alice',
        email: 'alice@example.com',
        password: '12345@aA',
        role: 'student',
      })

    expect(res.status).toBe(400)
    expect(res.body.errors.details).toContainEqual({
      code: 'invalid_type',
      expected: 'string',
      message: 'Required',
      path: ['cpf'],
      received: 'undefined',
    })
  })

  it('[POST] /students - Missing Role', async () => {
    const res = await request(app.getHttpServer())
      .post('/students')
      .send({
        name: 'Bob',
        email: 'bob@example.com',
        password: '12345@aA',
        cpf: '55566677788',
      })

    expect(res.status).toBe(400)
    expect(res.body.errors.details).toContainEqual({
      code: 'invalid_type',
      expected: 'string',
      message: 'Required',
      path: ['role'],
      received: 'undefined',
    })
  })

  it('[POST] /students - Invalid Email', async () => {
    const res = await request(app.getHttpServer())
      .post('/students')
      .send({
        name: 'Invalid Email',
        email: 'invalid-email',
        password: '12345@aA',
        cpf: '22233344455',
        role: 'student',
      })

    expect(res.status).toBe(400)
    expect(res.body.errors.details).toContainEqual({
      code: 'invalid_string',
      validation: 'email',
      message: 'Invalid email',
      path: ['email'],
    })
  })

  it('[POST] /students - Invalid CPF', async () => {
    const res = await request(app.getHttpServer())
      .post('/students')
      .send({
        name: 'Invalid CPF',
        email: 'cpf@example.com',
        password: '12345@aA',
        cpf: 'abc123',
        role: 'student',
      })

    expect(res.status).toBe(400)
    expect(res.body.errors.details).toContainEqual({
      code: 'invalid_string',
      validation: 'regex',
      message: 'Invalid CPF',
      path: ['cpf'],
    })
  })

  it('[POST] /students - Weak Password', async () => {
    const res = await request(app.getHttpServer())
      .post('/students')
      .send({
        name: 'Weak Password',
        email: 'weak@example.com',
        password: 'weak',
        cpf: '77788899900',
        role: 'student',
      })

    expect(res.status).toBe(400)
    // password <6 chars
    expect(res.body.errors.details).toContainEqual(
      expect.objectContaining({
        code: 'too_small',
        minimum: 6,
        path: ['password'],
      })
    )
    // sem letra maiúscula
    expect(res.body.errors.details).toContainEqual(
      expect.objectContaining({
        code: 'invalid_string',
        message: 'Password must contain at least one uppercase letter',
        validation: 'regex',
        path: ['password'],
      })
    )
  })

  it('[POST] /students - Email Conflict', async () => {
    const payload = {
      name: 'Duplicate User',
      email: 'duplicate@example.com',
      password: '12345@aA',
      cpf: '33344455566',
      role: 'student',
    }

    await request(app.getHttpServer()).post('/students').send(payload)


    const res = await request(app.getHttpServer())
      .post('/students')
      .send({
        ...payload,
        cpf: '44455566677', 
      })

    expect(res.status).toBe(409)
    expect(res.body.message).toContain('already exists')
  })

  it('[POST] /students - CPF Conflict', async () => {
    const payload1 = {
      name: 'User A',
      email: 'conflictcpf@example.com',
      password: '12345@aA',
      cpf: '88899900011',
      role: 'student',
    }

    await request(app.getHttpServer()).post('/students').send(payload1)

    const res = await request(app.getHttpServer())
      .post('/students')
      .send({
        name: 'User B',
        email: 'another@example.com',
        password: '12345@aA',
        cpf: '88899900011',
        role: 'student',
      })

    expect(res.status).toBe(409)
    expect(res.body.message).toContain('already exists')
  })
})