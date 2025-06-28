// test/e2e/students.e2e.spec.ts
import 'dotenv/config';
import { execSync } from 'child_process';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Students Controller (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    // Primeiro, criar o usuário admin se não existir
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });

    if (!existingAdmin) {
      // Criar admin user para os testes
      await request(app.getHttpServer()).post('/students').send({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin123!',
        cpf: '99999999999',
        role: 'admin',
      });
    }

    // Fazer login como admin para obter o token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin123!',
      })
      .expect(201);

    // Verificar se o login foi bem-sucedido e extrair o token
    expect(loginResponse.body).toHaveProperty('accessToken');
    adminToken = loginResponse.body.accessToken;

    // Verificar se o token foi obtido
    expect(adminToken).toBeDefined();
    expect(adminToken).not.toBe('');
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'bruno@example.com',
            'duplicate@example.com',
            'alice@example.com',
            'bob@example.com',
            'conflictcpf@example.com',
            'updater@example.com',
            'updated@example.com',
            'nofields@example.com',
            'emaila@example.com',
            'emailb@example.com',
            'cpfa@example.com',
            'cpfb@example.com',
            'student@test.com',
          ],
        },
      },
    });
    await app.close();
  });

  // ────────────────────────────────────────────────────────────
  // Create Account (E2E)
  // ────────────────────────────────────────────────────────────

  describe('Create Account', () => {
    it('[POST] /students - Success', async () => {
      const res = await request(app.getHttpServer()).post('/students').send({
        name: 'Bruno Vieira',
        email: 'bruno@example.com',
        password: '12345@aA',
        cpf: '12345678909',
        role: 'student',
      });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('bruno@example.com');
      expect(res.body.user.name).toBe('Bruno Vieira');

      const user = await prisma.user.findUnique({
        where: { email: 'bruno@example.com' },
      });
      expect(user).toBeTruthy();
    });

    it('[POST] /students - Missing Name', async () => {
      const res = await request(app.getHttpServer()).post('/students').send({
        email: 'missingname@example.com',
        password: '12345@aA',
        cpf: '11122233344',
        role: 'student',
      });

      expect(res.status).toBe(400);
      expect(res.body.errors.details).toContainEqual({
        code: 'invalid_type',
        expected: 'string',
        message: 'Required',
        path: ['name'],
        received: 'undefined',
      });
    });

    it('[POST] /students - Missing CPF', async () => {
      const res = await request(app.getHttpServer()).post('/students').send({
        name: 'Alice',
        email: 'alice@example.com',
        password: '12345@aA',
        role: 'student',
      });

      expect(res.status).toBe(400);
      expect(res.body.errors.details).toContainEqual({
        code: 'invalid_type',
        expected: 'string',
        message: 'Required',
        path: ['cpf'],
        received: 'undefined',
      });
    });

    it('[POST] /students - Missing Role', async () => {
      const res = await request(app.getHttpServer()).post('/students').send({
        name: 'Bob',
        email: 'bob@example.com',
        password: '12345@aA',
        cpf: '55566677788',
      });

      expect(res.status).toBe(400);
      expect(res.body.errors.details).toContainEqual({
        code: 'invalid_type',
        expected: 'string',
        message: 'Required',
        path: ['role'],
        received: 'undefined',
      });
    });

    it('[POST] /students - Invalid Email', async () => {
      const res = await request(app.getHttpServer()).post('/students').send({
        name: 'Invalid Email',
        email: 'invalid-email',
        password: '12345@aA',
        cpf: '22233344455',
        role: 'student',
      });

      expect(res.status).toBe(400);
      expect(res.body.errors.details).toContainEqual({
        code: 'invalid_string',
        validation: 'email',
        message: 'Invalid email',
        path: ['email'],
      });
    });

    it('[POST] /students - Invalid CPF', async () => {
      const res = await request(app.getHttpServer()).post('/students').send({
        name: 'Invalid CPF',
        email: 'cpf@example.com',
        password: '12345@aA',
        cpf: 'abc123',
        role: 'student',
      });

      expect(res.status).toBe(400);
      expect(res.body.errors.details).toContainEqual({
        code: 'invalid_string',
        validation: 'regex',
        message: 'Invalid CPF',
        path: ['cpf'],
      });
    });

    it('[POST] /students - Weak Password', async () => {
      const res = await request(app.getHttpServer()).post('/students').send({
        name: 'Weak Password',
        email: 'weak@example.com',
        password: 'weak',
        cpf: '77788899900',
        role: 'student',
      });

      expect(res.status).toBe(400);
      expect(res.body.errors.details).toContainEqual(
        expect.objectContaining({
          code: 'too_small',
          minimum: 6,
          path: ['password'],
        }),
      );
      expect(res.body.errors.details).toContainEqual(
        expect.objectContaining({
          code: 'invalid_string',
          message: 'Password must contain at least one uppercase letter',
          validation: 'regex',
          path: ['password'],
        }),
      );
    });

    it('[POST] /students - Email Conflict', async () => {
      const payload = {
        name: 'Duplicate User',
        email: 'duplicate@example.com',
        password: '12345@aA',
        cpf: '33344455566',
        role: 'student',
      };

      await request(app.getHttpServer()).post('/students').send(payload);

      const res = await request(app.getHttpServer())
        .post('/students')
        .send({
          ...payload,
          cpf: '44455566677',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });

    it('[POST] /students - CPF Conflict', async () => {
      const payload1 = {
        name: 'User A',
        email: 'conflictcpf@example.com',
        password: '12345@aA',
        cpf: '88899900011',
        role: 'student',
      };

      await request(app.getHttpServer()).post('/students').send(payload1);

      const res = await request(app.getHttpServer()).post('/students').send({
        name: 'User B',
        email: 'another@example.com',
        password: '12345@aA',
        cpf: '88899900011',
        role: 'student',
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Update Account (E2E)
  // ────────────────────────────────────────────────────────────

  describe('Update Account', () => {
    it('[PATCH] /students/:id - Success', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/students')
        .send({
          name: 'Updater',
          email: 'updater@example.com',
          password: 'Aa11@@aa',
          cpf: '10101010101',
          role: 'student',
        });
      expect(createRes.status).toBe(201);
      const { id } = createRes.body.user;

      const res = await request(app.getHttpServer())
        .patch(`/students/${id}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com',
        });
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Updated Name');
      expect(res.body.user.email).toBe('updated@example.com');

      const updated = await prisma.user.findUnique({ where: { id } });
      expect(updated).toBeTruthy();
      if (updated) {
        expect(updated.name).toBe('Updated Name');
        expect(updated.email).toBe('updated@example.com');
      }
    });

    it('[PATCH] /students/:id - Missing Fields', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/students')
        .send({
          name: 'NoFields',
          email: 'nofields@example.com',
          password: 'Bb22##bb',
          cpf: '20202020202',
          role: 'student',
        });
      const { id } = createRes.body.user;

      const res = await request(app.getHttpServer())
        .patch(`/students/${id}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        'At least one field to update must be provided',
      );
      expect(res.body.errors.details).toEqual([]);
    });

    it('[PATCH] /students/:id - Not Found', async () => {
      const res = await request(app.getHttpServer())
        .patch('/students/nonexistent-id')
        .send({ name: 'X' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User not found');
    });

    it('[PATCH] /students/:id - Email Conflict', async () => {
      const u1 = await request(app.getHttpServer()).post('/students').send({
        name: 'EmailA',
        email: 'emaila@example.com',
        password: 'Cc33$$cc',
        cpf: '30303030303',
        role: 'student',
      });
      const u2 = await request(app.getHttpServer()).post('/students').send({
        name: 'EmailB',
        email: 'emailb@example.com',
        password: 'Dd44%%dd',
        cpf: '40404040404',
        role: 'student',
      });
      const idA = u1.body.user.id;

      const res = await request(app.getHttpServer())
        .patch(`/students/${idA}`)
        .send({ email: 'emailb@example.com' });
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });

    it('[PATCH] /students/:id - CPF Conflict', async () => {
      const u1 = await request(app.getHttpServer()).post('/students').send({
        name: 'CpfA',
        email: 'cpfa@example.com',
        password: 'Ee55^^ee',
        cpf: '50505050505',
        role: 'student',
      });
      const u2 = await request(app.getHttpServer()).post('/students').send({
        name: 'CpfB',
        email: 'cpfb@example.com',
        password: 'Ff66&&ff',
        cpf: '60606060606',
        role: 'student',
      });
      const idA = u1.body.user.id;

      const res = await request(app.getHttpServer())
        .patch(`/students/${idA}`)
        .send({ cpf: '60606060606' });
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });
  });

  // ────────────────────────────────────────────────────────────
  // List Users (E2E) - COM AUTENTICAÇÃO CORRETA
  // ────────────────────────────────────────────────────────────

  describe('List Users', () => {
    // Helper function para obter um novo token se necessário
    const getValidAdminToken = async (): Promise<string> => {
      if (!adminToken) {
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'admin@example.com',
            password: 'Admin123!',
          })
          .expect(201);

        return loginResponse.body.accessToken;
      }
      return adminToken;
    };

    it('[GET] /students - Success with admin token', async () => {
      const token = await getValidAdminToken();

      const res = await request(app.getHttpServer())
        .get('/students')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('pageSize');

      // Verificar estrutura do usuário
      if (res.body.users.length > 0) {
        const user = res.body.users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('cpf');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('updatedAt');
      }
    });

    it('[GET] /students - Success with pagination parameters', async () => {
      const token = await getValidAdminToken();

      const res = await request(app.getHttpServer())
        .get('/students?page=1&pageSize=5')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.pageSize).toBe(5);
    });

    it('[GET] /students - Unauthorized without token', async () => {
      const res = await request(app.getHttpServer())
        .get('/students')
        .expect(401);

      expect(res.body.message).toBe('Unauthorized');
      expect(res.body.statusCode).toBe(401);
    });

    it('[GET] /students - Unauthorized with invalid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/students')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body.message).toBe('Unauthorized');
      expect(res.body.statusCode).toBe(401);
    });

    it('[GET] /students - Forbidden for non-admin users', async () => {
      // Criar usuário estudante
      const createStudentRes = await request(app.getHttpServer())
        .post('/students')
        .send({
          name: 'Student User',
          email: 'student@test.com',
          password: 'Student123!',
          cpf: '12312312312',
          role: 'student',
        });

      expect(createStudentRes.status).toBe(201);

      // Login como estudante
      const studentLoginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'student@test.com',
          password: 'Student123!',
        })
        .expect(201);

      const studentToken = studentLoginRes.body.accessToken;

      // Tentar acessar endpoint protegido
      const res = await request(app.getHttpServer())
        .get('/students')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(res.body.message).toBe('Forbidden resource');
      expect(res.body.statusCode).toBe(403);
    });

    it('[GET] /students - Success with default pagination when no params provided', async () => {
      const token = await getValidAdminToken();

      const res = await request(app.getHttpServer())
        .get('/students')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('pageSize');

      // Valores padrão devem ser aplicados
      expect(typeof res.body.pagination.page).toBe('number');
      expect(typeof res.body.pagination.pageSize).toBe('number');
    });

    it('[GET] /students - Success with invalid pagination parameters (should use defaults)', async () => {
      const token = await getValidAdminToken();

      const res = await request(app.getHttpServer())
        .get('/students?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body).toHaveProperty('pagination');

      // Deve usar valores padrão para parâmetros inválidos
      expect(res.body.pagination.page).toBeGreaterThan(0);
      expect(res.body.pagination.pageSize).toBeGreaterThan(0);
    });
  });
});
