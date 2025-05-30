import { Injectable } from "@nestjs/common";
import { Either, left, right } from "@/core/either";
import { IAddressRepository } from "../repositories/i-address-repository";
import { CreateAddressRequest } from "../dtos/create-address-request.dto";
import { Address } from "@/domain/auth/enterprise/entities/address.entity";
import { InvalidInputError } from "./errors/invalid-input-error";
import { UniqueEntityID } from "@/core/unique-entity-id";

export type CreateAddressResponse = Either<InvalidInputError | Error, { addressId: string }>;

@Injectable()
export class CreateAddressUseCase {
  constructor(private repo: IAddressRepository) {}

  async execute(req: CreateAddressRequest): Promise<CreateAddressResponse> {
    const {
      userId,
      street,
      number,
      city,
      country,
      postalCode,
      complement,
      district,
      state,
    } = req;

    if (!userId || !street || !number || !city || !country || !postalCode) {
      return left(new InvalidInputError("Missing required fields", []));
    }

    const address = Address.create(
      {
        userId: new UniqueEntityID(userId),
        street,
        number,
        complement: complement ?? null,
        district: district ?? null,
        city,
        state: state ?? null,
        country,
        postalCode,
      }
    );

    try {
      const result = await this.repo.create(address);
      if (result.isLeft()) {
        return left(result.value);
      }
    } catch (err: any) {
      return left(err);
    }

    return right({ addressId: address.id.toString() });
  }
}