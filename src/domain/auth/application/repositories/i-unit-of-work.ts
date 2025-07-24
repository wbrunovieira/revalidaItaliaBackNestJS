import { IUnitOfWork } from '@/core/domain/unit-of-work';
import { IUserIdentityRepository } from './i-user-identity-repository';
import { IUserProfileRepository } from './i-user-profile-repository';
import { IUserAuthorizationRepository } from './i-user-authorization-repository';

export const IAuthUnitOfWork = Symbol('IAuthUnitOfWork');

export interface IAuthUnitOfWork extends IUnitOfWork {
  get identityRepository(): IUserIdentityRepository;
  get profileRepository(): IUserProfileRepository;
  get authorizationRepository(): IUserAuthorizationRepository;
}

export abstract class AuthUnitOfWork implements IAuthUnitOfWork {
  abstract get identityRepository(): IUserIdentityRepository;
  abstract get profileRepository(): IUserProfileRepository;
  abstract get authorizationRepository(): IUserAuthorizationRepository;
  
  abstract start(): Promise<void>;
  abstract commit(): Promise<void>;
  abstract rollback(): Promise<void>;
  
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