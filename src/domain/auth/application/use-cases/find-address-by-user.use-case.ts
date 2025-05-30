// src/application/use-cases/find-address-by-user.use-case.ts
import { Injectable } from "@nestjs/common"
import { Either, left, right } from "@/core/either"
import { IAddressRepository } from "../repositories/i-address-repository"
import { InvalidInputError } from "./errors/invalid-input-error"
import { Address } from "@/domain/auth/enterprise/entities/address.entity"

export interface FindAddressRequest {
  userId: string
}

export type FindAddressResponse = Either<InvalidInputError | Error, Address[]>

@Injectable()
export class FindAddressByUserUseCase {
  constructor(private readonly repo: IAddressRepository) {}

  async execute(request: FindAddressRequest): Promise<FindAddressResponse> {
    const { userId } = request
    if (!userId) {
      return left(new InvalidInputError('Missing userId', []))
    }

    try {
      const result = await this.repo.findByUserId(userId)
      if (result.isLeft()) {
        return left(result.value)
      }
      return right(result.value)
    } catch (err: any) {
      return left(err)
    }
  }
}