// src/application/use-cases/find-address-by-profile.use-case.ts
import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IAddressRepository } from '../repositories/i-address-repository';
import { InvalidInputError, RepositoryError } from '@/domain/auth/domain/exceptions';
import { Address } from '@/domain/auth/enterprise/entities/address.entity';

export interface FindAddressRequest {
  profileId: string;
}

export type FindAddressResponse = Either<InvalidInputError | RepositoryError, Address[]>;

@Injectable()
export class FindAddressByProfileUseCase {
  constructor(private readonly repo: IAddressRepository) {}

  async execute(request: FindAddressRequest): Promise<FindAddressResponse> {
    const { profileId } = request;
    if (!profileId) {
      return left(new InvalidInputError('Missing profileId', [{ field: 'profileId', message: 'Field is required' }]));
    }

    try {
      const result = await this.repo.findByProfileId(profileId);
      if (result.isLeft()) {
        return left(new RepositoryError(result.value.message, 'findByProfileId', result.value));
      }
      return right(result.value);
    } catch (err: any) {
      return left(new RepositoryError(err.message, 'findByProfileId', err));
    }
  }
}
