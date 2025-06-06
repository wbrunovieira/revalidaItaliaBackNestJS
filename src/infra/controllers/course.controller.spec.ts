// src/infra/course-catalog/controllers/course.controller.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common'
import { left, right } from '@/core/either'
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error'
import { DuplicateCourseError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-course-error'
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error'
import { CourseController } from './course.controller'
import { CreateCourseDto } from '@/domain/course-catalog/application/dtos/create-course.dto'


class MockUseCase {
  execute = vi.fn()
}

describe('CourseController', () => {
  let controller: CourseController
  let useCase: MockUseCase

  beforeEach(() => {
    useCase = new MockUseCase()
    controller = new CourseController(useCase as any)
  })

  const validDto: CreateCourseDto = {
    slug: 'curso-teste',
    translations: [
      {
        locale: 'pt',
        title: 'Curso Teste',
        description: 'Descrição válida do curso.',
      },
      {
        locale: 'it',
        title: 'Corso Test',
        description: 'Descrizione valida del corso.',
      },
      {
        locale: 'es',
        title: 'Curso Prueba',
        description: 'Descripción válida del curso.',
      },
    ],
  }

  it('should return created course payload on success', async () => {
    const payload = {
      course: {
        id: 'uuid-1234',
        slug: 'curso-teste',
        title: 'Curso Teste',
        description: 'Descrição válida do curso.',
      },
    }
    useCase.execute.mockResolvedValueOnce(right(payload))

    const response = await controller.create(validDto)
    expect(response).toEqual(payload.course)

    expect(useCase.execute).toHaveBeenCalledWith({
      slug: validDto.slug,
      translations: validDto.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        description: t.description,
      })),
    })
  })

  it('should throw BadRequestException on InvalidInputError', async () => {
    const details = [{ path: ['translations'], message: 'Falta pt' }]
    useCase.execute.mockResolvedValueOnce(left(new InvalidInputError('Validação falhou', details)))

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