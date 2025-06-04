// src/domain/course-catalog/application/use-cases/create-course.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest"
import { CreateCourseUseCase } from "@/domain/course-catalog/application/use-cases/create-course.use-case"
import { InMemoryCourseRepository } from "@/test/repositories/in-memory-course-repository"
import { CreateCourseRequest } from "@/domain/course-catalog/application/dtos/create-course-request.dto"
import { DuplicateCourseError } from "@/domain/course-catalog/application/use-cases/errors/duplicate-course-error"
import { InvalidInputError } from "@/domain/course-catalog/application/use-cases/errors/invalid-input-error"
import { RepositoryError } from "@/domain/course-catalog/application/use-cases/errors/repository-error"
import { left } from "@/core/either"

let repo: InMemoryCourseRepository
let sut: CreateCourseUseCase
let validRequest: CreateCourseRequest

describe("CreateCourseUseCase", () => {
  beforeEach(() => {
    repo = new InMemoryCourseRepository()
    sut = new CreateCourseUseCase(repo)
    validRequest = {
      title: "Advanced Mathematics",
      description: "A deep dive into advanced math topics.",
      modules: [
        { title: "Calculus I", order: 1 },
        { title: "Linear Algebra", order: 2 },
      ],
    }
  })

  it("should create a course successfully when modules are provided", async () => {
    const result = await sut.execute(validRequest)
    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      const { course } = result.value
      expect(course.id).toMatch(/[0-9a-fA-F\-]{36}/) 
      expect(course.title).toBe(validRequest.title)
      expect(course.description).toBe(validRequest.description)
      expect(course.modules).toHaveLength(2)


      expect(course.modules[0].title).toBe("Calculus I")
      expect(course.modules[0].order).toBe(1)
      expect(course.modules[1].title).toBe("Linear Algebra")
      expect(course.modules[1].order).toBe(2)


      expect(repo.items).toHaveLength(1)
    }
  })

  it("should create a course successfully when no modules are provided", async () => {
    const request: CreateCourseRequest = {
      title: "History 101",
      description: "Introduction to world history.",
    }
    const result = await sut.execute(request)
    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      const { course } = result.value
      expect(course.title).toBe(request.title)
      expect(course.description).toBe(request.description)
      expect(course.modules).toEqual([])
      expect(repo.items[0].title).toBe(request.title)
    }
  })

  it("should allow title and description at minimum length", async () => {
    const request: CreateCourseRequest = {
      title: "Abc",              
      description: "12345",       
      modules: [],
    }
    const result = await sut.execute(request)
    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      const { course } = result.value
      expect(course.title).toBe("Abc")
      expect(course.description).toBe("12345")
    }
  })

  it("should reject title shorter than minimum length", async () => {
    const request: CreateCourseRequest = {
      title: "Hi",
      description: "Valid description",
    }
    const result = await sut.execute(request as any)
    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError)
      expect((result.value as InvalidInputError).details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["title"],
            message: "Course title must be at least 3 characters long",
          }),
        ])
      )
    }
  })

  it("should reject description shorter than minimum length", async () => {
    const request: CreateCourseRequest = {
      title: "Valid Title",
      description: "Desc",
    }
    const result = await sut.execute(request as any)
    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError)
      expect((result.value as InvalidInputError).details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["description"],
            message: "Course description must be at least 5 characters long",
          }),
        ])
      )
    }
  })

  it("should reject module with empty title", async () => {
    const request: CreateCourseRequest = {
      title: "Valid Title",
      description: "Valid description",
      modules: [{ title: "", order: 1 }],
    }
    const result = await sut.execute(request as any)
    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError)
      expect((result.value as InvalidInputError).details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["modules", 0, "title"],
            message: "Module title cannot be empty",
          }),
        ])
      )
    }
  })

  it("should reject module with non-positive order", async () => {
    const request: CreateCourseRequest = {
      title: "Valid Title",
      description: "Valid description",
      modules: [{ title: "Intro", order: 0 }],
    }
    const result = await sut.execute(request as any)
    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError)
      expect((result.value as InvalidInputError).details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["modules", 0, "order"],
            message: "Order must be a positive number",
          }),
        ])
      )
    }
  })

  it("should reject duplicate title", async () => {
    await sut.execute(validRequest)
    const result = await sut.execute(validRequest)
    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DuplicateCourseError)
    }
  })

  it("should handle repository error on findByTitle", async () => {
    vi.spyOn(repo, "findByTitle").mockRejectedValueOnce(new Error("DB down"))
    const result = await sut.execute(validRequest)
    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError)
      expect(result.value.message).toBe("DB down")
    }
  })

  it("should handle repository returning Left on create", async () => {
    vi.spyOn(repo, "create").mockResolvedValueOnce(left(new Error("Insert failed")) as any)
    const result = await sut.execute(validRequest)
    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError)
      expect(result.value.message).toBe("Insert failed")
    }
  })

  it("should handle repository throwing on create", async () => {
    vi.spyOn(repo, "create").mockImplementationOnce(() => {
      throw new Error("Create exception")
    })
    const result = await sut.execute(validRequest)
    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError)
      expect(result.value.message).toBe("Create exception")
    }
  })
})