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
import { InvalidInputError } from './errors/invalid-input-error';

export type CreateAddressUseCaseResponse = Either<
  RepositoryError | InvalidInputError,
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
    // Validate field lengths
    const fieldValidations = [
      { field: 'street', value: request.street, maxLength: 255 },
      { field: 'number', value: request.number, maxLength: 20 },
      { field: 'complement', value: request.complement, maxLength: 255 },
      { field: 'district', value: request.district, maxLength: 100 },
      { field: 'city', value: request.city, maxLength: 100 },
      { field: 'state', value: request.state, maxLength: 100 },
      { field: 'country', value: request.country, maxLength: 100 },
      { field: 'postalCode', value: request.postalCode, maxLength: 20 },
    ];

    for (const validation of fieldValidations) {
      if (validation.value && validation.value.length > validation.maxLength) {
        return left(
          new InvalidInputError(
            `${validation.field} exceeds maximum length of ${validation.maxLength} characters`,
            { [validation.field]: `Too long (max ${validation.maxLength} characters)` }
          )
        );
      }
    }

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
        return left(
          new RepositoryError(result.value.message, 'create', result.value),
        );
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message, 'create', err));
    }

    return right({ addressId: newId });
  }
}
