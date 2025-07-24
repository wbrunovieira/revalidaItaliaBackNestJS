// src/domain/auth/application/use-cases/find-address-by-profile.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IAddressRepository } from '../repositories/i-address-repository';
import { RepositoryError } from '@/domain/auth/domain/exceptions';
import { FindAddressByProfileRequestDto } from '../dtos/find-address-by-profile-request.dto';
import { FindAddressByProfileResponseDto } from '../dtos/find-address-by-profile-response.dto';

export type FindAddressByProfileUseCaseResponse = Either<
  RepositoryError,
  FindAddressByProfileResponseDto
>;

@Injectable()
export class FindAddressByProfileUseCase {
  constructor(
    @Inject(IAddressRepository)
    private readonly repo: IAddressRepository
  ) {}

  async execute(
    request: FindAddressByProfileRequestDto
  ): Promise<FindAddressByProfileUseCaseResponse> {
    try {
      const result = await this.repo.findByProfileId(request.profileId);
      if (result.isLeft()) {
        return left(new RepositoryError(result.value.message, 'findByProfileId', result.value));
      }

      const addresses = result.value.map(address => ({
        id: address.id.toString(),
        street: address.street,
        number: address.number,
        complement: address.complement,
        district: address.district,
        city: address.city,
        state: address.state,
        country: address.country,
        postalCode: address.postalCode,
        createdAt: address.createdAt,
        updatedAt: address.updatedAt,
      }));

      return right({ addresses });
    } catch (err: any) {
      return left(new RepositoryError(err.message, 'findByProfileId', err));
    }
  }
}
