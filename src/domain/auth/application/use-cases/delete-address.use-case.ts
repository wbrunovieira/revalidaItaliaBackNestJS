// src/domain/auth/application/use-cases/delete-address.use-case.ts
import { Either, left, right } from '@/core/either';
import { InvalidInputError, ResourceNotFoundError, RepositoryError } from '@/domain/auth/domain/exceptions';
import { IAddressRepository } from '../repositories/i-address-repository';
import { Inject, Injectable } from '@nestjs/common';

export interface DeleteAddressRequest {
  id: string;
}

type DeleteAddressUseCaseResponse = Either<
  InvalidInputError | ResourceNotFoundError | RepositoryError,
  void
>;
@Injectable()
export class DeleteAddressUseCase {
  constructor(
    @Inject(IAddressRepository)
    private readonly addressRepo: IAddressRepository,
  ) {}

  async execute(
    request: DeleteAddressRequest,
  ): Promise<DeleteAddressUseCaseResponse> {
    const { id } = request;

    if (!id) {
      return left(new InvalidInputError('Missing id', [{ field: 'id', message: 'Field is required' }]));
    }

    let foundAddr;
    try {
      const findResult = await this.addressRepo.findById(id);
      if (findResult.isLeft()) {
        return left(new RepositoryError(findResult.value.message, 'findById', findResult.value));
      }
      foundAddr = findResult.value;
    } catch (err: any) {
      return left(new RepositoryError(err.message, 'findById', err));
    }

    if (!foundAddr) {
      return left(new ResourceNotFoundError('Address', { id }));
    }

    try {
      const deleteResult = await this.addressRepo.delete(id);
      if (deleteResult.isLeft()) {
        return left(new RepositoryError(deleteResult.value.message, 'delete', deleteResult.value));
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message, 'delete', err));
    }

    return right(undefined);
  }
}
