// src/domain/auth/application/use-cases/create-address.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { z } from 'zod';
import { IAddressRepository } from '../repositories/i-address-repository';
import { InvalidInputError } from './errors/invalid-input-error';
import { CreateAddressRequest } from '../dtos/create-address-request.dto';
import { randomUUID } from 'crypto';
import { Address } from '@/domain/auth/enterprise/entities/address.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

const createAddressSchema = z.object({
  userId: z.string().nonempty({ message: 'Missing required fields' }),
  street: z.string().nonempty({ message: 'Missing required fields' }),
  number: z.string().nonempty({ message: 'Missing required fields' }),
  district: z.string().optional(),
  city: z.string().nonempty({ message: 'Missing required fields' }),

  complement: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
});

type CreateAddressUseCaseResponse = Either<
  InvalidInputError | Error,
  { addressId: string }
>;

@Injectable()
export class CreateAddressUseCase {
  constructor(
    @Inject(IAddressRepository)
    private readonly addressRepo: IAddressRepository,
  ) {}

  async execute(
    raw: CreateAddressRequest,
  ): Promise<CreateAddressUseCaseResponse> {
    const parsed = createAddressSchema.safeParse(raw);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => {
        const detail: any = {
          code: issue.code,
          message: issue.message,
          path: issue.path,
        };

        return detail;
      });
      return left(new InvalidInputError('Missing required fields', details));
    }

    const dto = parsed.data;
    const newId = randomUUID();
    const addressEntity = Address.create(
      {
        userId: new UniqueEntityID(dto.userId),
        street: dto.street,
        number: dto.number,
        complement: dto.complement ?? null,
        district: dto.district,
        city: dto.city,
        state: dto.state ?? null,

        country: dto.country ?? '',
        postalCode: dto.postalCode ?? '',
      },
      new UniqueEntityID(newId),
    );

    try {
      const result = await this.addressRepo.create(addressEntity);
      if (result.isLeft()) {
        return left(result.value);
      }
    } catch (err: any) {
      return left(new Error(err.message));
    }

    return right({ addressId: newId });
  }
}
