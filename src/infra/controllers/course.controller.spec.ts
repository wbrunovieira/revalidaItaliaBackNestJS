// src/infra/controllers/course.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CreateCourseController } from './course.controller'


import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common'
import { left, right } from '@/core/either'
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error'
import { DuplicateCourseError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-course-error'
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error'
import { CreateCourseDto } from '@/domain/course-catalog/application/dtos/create-course.dto'

class MockUseCase {
  execute = vi.fn()
}

describe('CreateCourseController', () => {
  let controller: CreateCourseController
  let useCase: MockUseCase

  const validDto: CreateCourseDto = {
    title: 'Test Course',
    description: 'Valid description',
    modules: [{ title: 'Mod 1', order: 1 }],
  }

  beforeEach(() => {
    useCase = new MockUseCase()
    controller = new CreateCourseController(useCase as any)
  })

  it('should return created course payload on success', async () => {
    const payload = {
      course: {
        id: 'uuid-1234',
        title: validDto.title,
        description: validDto.description,
        modules: [{ id: 'mod-1', title: 'Mod 1', order: 1 }],
      },
    }
    useCase.execute.mockResolvedValueOnce(right(payload))

    const response = await controller.create(validDto)
    expect(response).toEqual(payload.course)
    expect(useCase.execute).toHaveBeenCalledWith({
      title: 'Test Course',
      description: 'Valid description',
      modules: [{ title: 'Mod 1', order: 1 }],
    })
  })

  it('should throw BadRequestException on InvalidInputError', async () => {
    const details = [{ path: ['title'], message: 'Too short' }]
    useCase.execute.mockResolvedValueOnce(left(new InvalidInputError('Validation failed', details)))

    await expect(controller.create(validDto)).rejects.toBeInstanceOf(BadRequestException)
  })

  it('should throw ConflictException on DuplicateCourseError', async () => {
    useCase.execute.mockResolvedValueOnce(left(new DuplicateCourseError()))

    await expect(controller.create(validDto)).rejects.toBeInstanceOf(ConflictException)
  })

  it('should throw InternalServerErrorException on RepositoryError', async () => {
    useCase.execute.mockResolvedValueOnce(left(new RepositoryError('DB down')))

    await expect(controller.create(validDto)).rejects.toBeInstanceOf(InternalServerErrorException)
  })

  it('should throw InternalServerErrorException on generic Error', async () => {
    useCase.execute.mockResolvedValueOnce(left(new Error('Unexpected')))

    await expect(controller.create(validDto)).rejects.toBeInstanceOf(InternalServerErrorException)
  })
})