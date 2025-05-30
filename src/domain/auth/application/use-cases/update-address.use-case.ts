// src/domain/auth/application/use-cases/update-address.use-case.ts
import { Injectable } from "@nestjs/common"
import { Either, left, right } from "@/core/either"
import { IAddressRepository } from "../repositories/i-address-repository"
import { InvalidInputError } from "./errors/invalid-input-error"

import { Address } from "@/domain/auth/enterprise/entities/address.entity"
import { NotFoundError } from "rxjs/internal/util/NotFoundError"

export interface UpdateAddressRequest {
  id: string
  street?: string
  number?: string
  complement?: string | null
  district?: string | null
  city?: string
  state?: string | null
  country?: string
  postalCode?: string
}

export type UpdateAddressResponse =
  Either<InvalidInputError | NotFoundError | Error, Address>

@Injectable()
export class UpdateAddressUseCase {
  constructor(private readonly repo: IAddressRepository) {}

  async execute(req: UpdateAddressRequest): Promise<UpdateAddressResponse> {
    const { id, street, number, complement, district, city, state, country, postalCode } = req

    if (!id) {
      return left(new InvalidInputError("Missing id", []))
    }

    if (
      street === undefined &&
      number === undefined &&
      complement === undefined &&
      district === undefined &&
      city === undefined &&
      state === undefined &&
      country === undefined &&
      postalCode === undefined
    ) {
      return left(new InvalidInputError("At least one field must be provided", []))
    }

    try {
      const foundOrError = await this.repo.findById(id)
      if (foundOrError.isLeft()) {
        return left(foundOrError.value)
      }

      const address = foundOrError.value
      if (!address) {
        return left(new NotFoundError("Address not found"))
      }

      if (street !== undefined)     address.street = street
      if (number !== undefined)     address.number = number
      if (complement !== undefined) address.complement = complement
      if (district !== undefined)   address.district = district
      if (city !== undefined)       address.city = city
      if (state !== undefined)      address.state = state
      if (country !== undefined)    address.country = country
      if (postalCode !== undefined) address.postalCode = postalCode

      const saveResult = await this.repo.update(address)
      if (saveResult.isLeft()) {
        return left(saveResult.value)
      }

      return right(address)
    } catch (err: any) {
      return left(err)
    }
  }
}