// src/infra/controllers/tests/profile/shared/profile-controller-test-setup.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ProfileController } from '@/infra/controllers/profile.controller';
import { UpdateOwnProfileUseCase } from '@/domain/auth/application/use-cases/profile/update-own-profile.use-case';
import { IUserAggregatedViewRepository } from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { JwtAuthGuard } from '@/infra/auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { createUserPayload } from './profile-controller-test-data';
import { vi } from 'vitest';

export async function createProfileControllerTestSetup() {
  const mockUpdateOwnProfileUseCase = {
    execute: vi.fn(),
  };

  const mockUserAggregatedViewRepository = {
    findByIdentityId: vi.fn(),
    findByEmail: vi.fn(),
    findByNationalId: vi.fn(),
    findByCriteria: vi.fn(),
    countByCriteria: vi.fn(),
    findForListing: vi.fn(),
  };

  const mockJwtService = {
    sign: () => 'mock-jwt-token',
    verify: () => createUserPayload(),
  };

  const module: TestingModule = await Test.createTestingModule({
    controllers: [ProfileController],
    providers: [
      {
        provide: UpdateOwnProfileUseCase,
        useValue: mockUpdateOwnProfileUseCase,
      },
      {
        provide: IUserAggregatedViewRepository,
        useValue: mockUserAggregatedViewRepository,
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
    mockUpdateUserProfileUseCase: mockUpdateOwnProfileUseCase,
    mockUserAggregatedViewRepository,
  };
}
