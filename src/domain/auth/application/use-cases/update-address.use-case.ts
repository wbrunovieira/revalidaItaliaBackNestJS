// src/domain/auth/application/use-cases/update-address.use-case.ts

import { Either, left, right } from '@/core/either';
import { InvalidInputError } from './errors/invalid-input-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { IAddressRepository } from '../repositories/i-address-repository';
import { Address } from '../../enterprise/entities/address.entity';
import { Inject } from '@nestjs/common';

export interface UpdateAddressRequest {
  id: string;
  street?: string;
  number?: string;
  complement?: string | null;
  district?: string | null;
  city?: string;
  state?: string | null;
  country?: string;
  postalCode?: string;
}

type UpdateAddressResponse = Either<
  InvalidInputError | ResourceNotFoundError | Error,
  Address
>;

export class UpdateAddressUseCase {
  constructor(
    @Inject(IAddressRepository)
    private readonly addressRepo: IAddressRepository) {}

  async execute(
    request: UpdateAddressRequest
  ): Promise<UpdateAddressResponse> {
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


    if (!id) {
      return left(new InvalidInputError('Missing id', []));
    }


    const hasAnyField =
      street !== undefined ||
      number !== undefined ||
      complement !== undefined ||
      district !== undefined ||
      city !== undefined ||
      state !== undefined ||
      country !== undefined ||
      postalCode !== undefined;

    if (!hasAnyField) {
      return left(
        new InvalidInputError('At least one field to update must be provided', [])
      );
    }

    // 2) Buscar o endereço existente
    let foundAddr: Address | undefined;
    try {
      const findResult = await this.addressRepo.findById(id);
      if (findResult.isLeft()) {
        return left(findResult.value);
      }
      foundAddr = findResult.value;
    } catch (err: any) {
      return left(new Error(err.message));
    }

    // 3) Se não encontrou, retorna ResourceNotFoundError
    if (!foundAddr) {
      return left(new ResourceNotFoundError('Address not found'));
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
        return left(updateResult.value);
      }
 
      return right(foundAddr);
    } catch (err: any) {
      return left(new Error(err.message));
    }
  }
}