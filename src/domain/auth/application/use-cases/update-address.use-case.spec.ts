// src/domain/auth/application/use-cases/update-address.use-case.spec.ts
import { vi } from "vitest"
import { left, right } from "@/core/either"
import { UpdateAddressUseCase, UpdateAddressRequest } from "./update-address.use-case"
import { InvalidInputError } from "./errors/invalid-input-error"

import { InMemoryAddressRepository } from "@/test/repositories/in-memory-address-repository"
import { Address } from "@/domain/auth/enterprise/entities/address.entity"
import { UniqueEntityID } from "@/core/unique-entity-id"
import { NotFoundError } from "rxjs/internal/util/NotFoundError"

describe("UpdateAddressUseCase", () => {
  let repo: InMemoryAddressRepository
  let sut: UpdateAddressUseCase

  beforeEach(() => {
    repo = new InMemoryAddressRepository()
    sut = new UpdateAddressUseCase(repo)
  })

  it("updates an address successfully", async () => {
    const userId = new UniqueEntityID("user-1")
    const address = Address.create({ userId, street: "Old", number: "1", city: "C", country: "X", postalCode: "000" })
    repo.items.push(address)

    const dto: UpdateAddressRequest = { id: address.id.toString(), street: "New", city: "City2" }
    const result = await sut.execute(dto)

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.street).toBe("New")
      expect(result.value.city).toBe("City2")
      // persisted in repo
      expect(repo.items[0].street).toBe("New")
    }
  })

  it("rejects missing id", async () => {
    const result = await sut.execute({ id: "", street: "A" })
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError)
      expect(result.value.message).toBe("Missing id")
    }
  })

  it("rejects when no fields provided", async () => {
    const result = await sut.execute({ id: "some-id" })
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError)
      expect(result.value.message).toBe("At least one field to update must be provided")
    }
  })

  it("returns NotFoundError if address not found", async () => {
    vi.spyOn(repo, "findById").mockResolvedValueOnce(right(undefined))
    const result = await sut.execute({ id: "missing", street: "A" })
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotFoundError)
      expect(result.value.message).toBe("Address not found")
    }
  })

  it("bubbles up repository Left errors", async () => {
    const dbErr = new Error("DB down")
    vi.spyOn(repo, "findById").mockResolvedValueOnce(left(dbErr))
    const result = await sut.execute({ id: "id", street: "A" })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) expect(result.value).toBe(dbErr)
  })

  it("bubbles up repository exceptions", async () => {
    vi.spyOn(repo, "findById").mockImplementationOnce(() => { throw new Error("Boom") })
    const result = await sut.execute({ id: "id", street: "A" })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) expect(result.value).toBeInstanceOf(Error)
  })
})