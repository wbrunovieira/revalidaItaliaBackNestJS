import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { IAuthUnitOfWork } from '@/domain/auth/application/repositories/i-unit-of-work';
import { IUserIdentityRepository } from '@/domain/auth/application/repositories/i-user-identity-repository';
import { IUserProfileRepository } from '@/domain/auth/application/repositories/i-user-profile-repository';
import { IUserAuthorizationRepository } from '@/domain/auth/application/repositories/i-user-authorization-repository';
import { PrismaUserIdentityRepository } from '../repositories/prisma-user-identity-repository';
import { PrismaUserProfileRepository } from '../repositories/prisma-user-profile-repository';
import { PrismaUserAuthorizationRepository } from '../repositories/prisma-user-authorization-repository';

@Injectable()
export class PrismaAuthUnitOfWork implements IAuthUnitOfWork {
  private _identityRepository: PrismaUserIdentityRepository;
  private _profileRepository: PrismaUserProfileRepository;
  private _authorizationRepository: PrismaUserAuthorizationRepository;

  constructor(private prisma: PrismaService) {
    this._identityRepository = new PrismaUserIdentityRepository(prisma);
    this._profileRepository = new PrismaUserProfileRepository(prisma);
    this._authorizationRepository = new PrismaUserAuthorizationRepository(prisma);
  }

  get identityRepository(): IUserIdentityRepository {
    return this._identityRepository;
  }

  get profileRepository(): IUserProfileRepository {
    return this._profileRepository;
  }

  get authorizationRepository(): IUserAuthorizationRepository {
    return this._authorizationRepository;
  }

  async start(): Promise<void> {
    // Prisma handles transactions automatically
    // This method exists for interface compliance
  }

  async commit(): Promise<void> {
    // Prisma handles transactions automatically
    // This method exists for interface compliance
  }

  async rollback(): Promise<void> {
    // Prisma handles transactions automatically
    // This method exists for interface compliance
  }

  async execute<T>(work: () => Promise<T>): Promise<T> {
    // Use Prisma transaction for atomic operations
    return this.prisma.$transaction(async (tx) => {
      // Create transactional repositories that share the same transaction context
      const txService = tx as PrismaService;
      this._identityRepository = new PrismaUserIdentityRepository(txService);
      this._profileRepository = new PrismaUserProfileRepository(txService);
      this._authorizationRepository = new PrismaUserAuthorizationRepository(txService);

      try {
        const result = await work();
        return result;
      } finally {
        // Restore original repositories after transaction
        this._identityRepository = new PrismaUserIdentityRepository(this.prisma);
        this._profileRepository = new PrismaUserProfileRepository(this.prisma);
        this._authorizationRepository = new PrismaUserAuthorizationRepository(this.prisma);
      }
    }, {
      // Set transaction timeout to 10 seconds
      timeout: 10000,
    });
  }
}