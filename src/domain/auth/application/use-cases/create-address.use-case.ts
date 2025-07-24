// src/domain/auth/application/use-cases/create-address.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IAddressRepository } from '../repositories/i-address-repository';
import { RepositoryError } from '@/domain/auth/domain/exceptions';
import { CreateAddressRequestDto } from '../dtos/create-address-request.dto';
import { CreateAddressResponseDto } from '../dtos/create-address-response.dto';
import { randomUUID } from 'crypto';
import { Address } from '@/domain/auth/enterprise/entities/address.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

export type CreateAddressUseCaseResponse = Either<
  RepositoryError,
  CreateAddressResponseDto
>;

@Injectable()
export class CreateAddressUseCase {
  constructor(
    @Inject(IAddressRepository)
    private readonly addressRepo: IAddressRepository,
  ) {}

  async execute(
    request: CreateAddressRequestDto,
  ): Promise<CreateAddressUseCaseResponse> {
    const newId = randomUUID();
    const addressEntity = Address.create(
      {
        profileId: new UniqueEntityID(request.profileId),
        street: request.street,
        number: request.number,
        complement: request.complement ?? null,
        district: request.district,
        city: request.city,
        state: request.state ?? null,
        country: request.country ?? '',
        postalCode: request.postalCode ?? '',
      },
      new UniqueEntityID(newId),
    );

    try {
      const result = await this.addressRepo.create(addressEntity);
      if (result.isLeft()) {
        return left(new RepositoryError(result.value.message, 'create', result.value));
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message, 'create', err));
    }

    return right({ addressId: newId });
  }
}
