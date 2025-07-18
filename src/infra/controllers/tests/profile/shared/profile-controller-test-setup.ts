// src/infra/controllers/tests/profile/shared/profile-controller-test-setup.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ProfileController } from '@/infra/controllers/profile.controller';
import { UpdateUserProfileUseCase } from '@/domain/auth/application/use-cases/update-user-profile.use-case';
import { IAccountRepository } from '@/domain/auth/application/repositories/i-account-repository';
import { JwtAuthGuard } from '@/infra/auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { createUserPayload } from './profile-controller-test-data';
import { vi } from 'vitest';

export async function createProfileControllerTestSetup() {
  const mockUpdateUserProfileUseCase = {
    execute: vi.fn(),
  };

  const mockAccountRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByCpf: vi.fn(),
    save: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const mockJwtService = {
    sign: () => 'mock-jwt-token',
    verify: () => createUserPayload(),
  };

  const module: TestingModule = await Test.createTestingModule({
    controllers: [ProfileController],
    providers: [
      {
        provide: UpdateUserProfileUseCase,
        useValue: mockUpdateUserProfileUseCase,
      },
      {
        provide: IAccountRepository,
        useValue: mockAccountRepository,
      },
      {
        provide: JwtService,
        useValue: mockJwtService,
      },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (context: any) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          throw new UnauthorizedException('Unauthorized');
        }
        
        // Mock user for testing
        request.user = createUserPayload();
        return true;
      },
    })
    .compile();

  const controller = module.get<ProfileController>(ProfileController);

  return {
    testingModule: module,
    controller,
    mockUpdateUserProfileUseCase,
    mockAccountRepository,
  };
}
