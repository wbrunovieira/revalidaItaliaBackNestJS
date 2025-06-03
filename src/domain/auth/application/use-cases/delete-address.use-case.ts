// src/domain/auth/application/use-cases/delete-address.use-case.ts
import { Either, left, right } from '@/core/either';
import { InvalidInputError }   from './errors/invalid-input-error';
import { IAddressRepository }  from '../repositories/i-address-repository';
import { NotFoundError }       from 'rxjs/internal/util/NotFoundError';

export interface DeleteAddressRequest {
  id: string;
}

type DeleteAddressUseCaseResponse = Either<
  InvalidInputError | NotFoundError | Error,
  void
>;

export class DeleteAddressUseCase {
  constructor(private readonly addressRepo: IAddressRepository) {}

  async execute(request: DeleteAddressRequest): Promise<DeleteAddressUseCaseResponse> {
    const { id } = request;


    if (!id) {
      return left(new InvalidInputError('Missing id', []));
    }


    let foundAddr;
    try {
      const findResult = await this.addressRepo.findById(id);
      if (findResult.isLeft()) {

        return left(findResult.value);
      }
      foundAddr = findResult.value;
    } catch (err: any) {
      return left(new Error(err.message));
    }


    if (!foundAddr) {
      return left(new NotFoundError('Address not found'));
    }


    try {
      const deleteResult = await this.addressRepo.delete(id);
      if (deleteResult.isLeft()) {

        return left(deleteResult.value);
      }
    } catch (err: any) {
      return left(new Error(err.message));
    }

    return right(undefined);
  }
}