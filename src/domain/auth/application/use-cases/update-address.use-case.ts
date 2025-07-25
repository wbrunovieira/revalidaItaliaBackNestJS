// src/domain/auth/application/use-cases/update-address.use-case.ts

import { Either, left, right } from '@/core/either';
import {
  ResourceNotFoundError,
  RepositoryError,
} from '@/domain/auth/domain/exceptions';
import { IAddressRepository } from '../repositories/i-address-repository';
import { UpdateAddressRequestDto } from '../dtos/update-address-request.dto';
import { UpdateAddressResponseDto } from '../dtos/update-address-response.dto';
import { Address } from '../../enterprise/entities/address.entity';
import { Injectable, Inject } from '@nestjs/common';
import { InvalidInputError } from './errors/invalid-input-error';

export type UpdateAddressUseCaseResponse = Either<
  InvalidInputError | ResourceNotFoundError | RepositoryError,
  UpdateAddressResponseDto
>;

@Injectable()
export class UpdateAddressUseCase {
  constructor(
    @Inject(IAddressRepository)
    private readonly addressRepo: IAddressRepository,
  ) {}

  async execute(
    request: UpdateAddressRequestDto,
  ): Promise<UpdateAddressUseCaseResponse> {
    const {
      id,
      street,
      number,
      complement,
      district,
      city,
      state,
      country,
      postalCode,
    } = request;

    // Validação: pelo menos um campo deve ser fornecido para atualização
    const updateFields = [street, number, complement, district, city, state, country, postalCode];
    const hasFieldsToUpdate = updateFields.some(field => field !== undefined);
    
    if (!hasFieldsToUpdate) {
      return left(
        new InvalidInputError(
          'At least one field must be provided for update',
          { fields: 'No fields provided for update' }
        )
      );
    }

    // 2) Buscar o endereço existente
    let foundAddr: Address | undefined;
    try {
      const findResult = await this.addressRepo.findById(id);
      if (findResult.isLeft()) {
        return left(
          new RepositoryError(
            findResult.value.message,
            'findById',
            findResult.value,
          ),
        );
      }
      foundAddr = findResult.value;
    } catch (err: any) {
      return left(new RepositoryError(err.message, 'findById', err));
    }

    // 3) Se não encontrou, retorna ResourceNotFoundError
    if (!foundAddr) {
      return left(new ResourceNotFoundError('Address', { id }));
    }

    if (street !== undefined) foundAddr.street = street;
    if (number !== undefined) foundAddr.number = number;
    if (complement !== undefined) foundAddr.complement = complement;
    if (district !== undefined) foundAddr.district = district;
    if (city !== undefined) foundAddr.city = city;
    if (state !== undefined) foundAddr.state = state;
    if (country !== undefined) foundAddr.country = country;
    if (postalCode !== undefined) foundAddr.postalCode = postalCode;

    try {
      const updateResult = await this.addressRepo.update(foundAddr);
      if (updateResult.isLeft()) {
        return left(
          new RepositoryError(
            updateResult.value.message,
            'update',
            updateResult.value,
          ),
        );
      }

      return right({
        id: foundAddr.id.toString(),
        street: foundAddr.street,
        number: foundAddr.number,
        complement: foundAddr.complement,
        district: foundAddr.district,
        city: foundAddr.city,
        state: foundAddr.state,
        country: foundAddr.country,
        postalCode: foundAddr.postalCode,
        createdAt: foundAddr.createdAt,
        updatedAt: foundAddr.updatedAt,
      });
    } catch (err: any) {
      return left(new RepositoryError(err.message, 'update', err));
    }
  }
}
