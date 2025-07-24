import { IAuthUnitOfWork } from '@/domain/auth/application/repositories/i-unit-of-work';
import { IUserIdentityRepository } from '@/domain/auth/application/repositories/i-user-identity-repository';
import { IUserProfileRepository } from '@/domain/auth/application/repositories/i-user-profile-repository';
import { IUserAuthorizationRepository } from '@/domain/auth/application/repositories/i-user-authorization-repository';
import { InMemoryUserIdentityRepository } from './in-memory-user-identity-repository';
import { InMemoryUserProfileRepository } from './in-memory-user-profile-repository';
import { InMemoryUserAuthorizationRepository } from './in-memory-user-authorization-repository';
import { UserIdentity } from '@/domain/auth/enterprise/entities/user-identity';
import { UserProfile } from '@/domain/auth/enterprise/entities/user-profile';
import { UserAuthorization } from '@/domain/auth/enterprise/entities/user-authorization';

export class InMemoryAuthUnitOfWork implements IAuthUnitOfWork {
  private _identityRepository: InMemoryUserIdentityRepository;
  private _profileRepository: InMemoryUserProfileRepository;
  private _authorizationRepository: InMemoryUserAuthorizationRepository;
  
  private transaction: {
    identities: UserIdentity[];
    profiles: UserProfile[];
    authorizations: UserAuthorization[];
  } | null = null;

  constructor(
    identityRepo: InMemoryUserIdentityRepository,
    profileRepo: InMemoryUserProfileRepository,
    authRepo: InMemoryUserAuthorizationRepository
  ) {
    this._identityRepository = identityRepo;
    this._profileRepository = profileRepo;
    this._authorizationRepository = authRepo;
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
    // Start a new transaction by creating a snapshot
    this.transaction = {
      identities: [...this._identityRepository.items],
      profiles: [...this._profileRepository.items],
      authorizations: [...this._authorizationRepository.items],
    };
  }

  async commit(): Promise<void> {
    // Transaction successful, clear the snapshot
    this.transaction = null;
  }

  async rollback(): Promise<void> {
    // Restore from snapshot
    if (this.transaction) {
      this._identityRepository.items = [...this.transaction.identities];
      this._profileRepository.items = [...this.transaction.profiles];
      this._authorizationRepository.items = [...this.transaction.authorizations];
      this.transaction = null;
    }
  }

  async execute<T>(work: () => Promise<T>): Promise<T> {
    await this.start();
    
    try {
      const result = await work();
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}