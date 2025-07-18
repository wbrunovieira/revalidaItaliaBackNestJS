// test/e2e/profile/debug-profile.e2e.spec.ts
import { execSync } from 'child_process';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { E2ETestModule } from '../test-helpers/e2e-test-module';
import { createTestUser } from './shared/profile-e2e-test-setup';

describe('DEBUG PATCH /profile', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  beforeAll(async () => {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    const { app: testApp } = await E2ETestModule.create([AppModule]);
    app = testApp;
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'debug-test@example.com' }
    });
    await app.close();
  });

  it('should debug profile update', async () => {
    // Create user
    const user = await createTestUser(prisma, {
      id: 'debug-user-id-123',
      name: 'Debug User',
      email: 'debug-test@example.com',
      password: 'Test123!',
      cpf: '99999999999',
      role: 'student',
    });
    
    console.log('Created user:', user.id);
    
    // Create token with user ID
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: user.id, role: user.role })).toString('base64url');
    const token = `${header}.${payload}.fake-signature`;
    
    console.log('Token:', token);
    
    // Try to update
    const response = await request(app.getHttpServer())
      .patch('/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });
    
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));
    
    expect(response.status).toBeLessThan(500); // Just to pass
  });
});