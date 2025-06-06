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
import { ListCoursesUseCase } from '@/domain/course-catalog/application/use-cases/list-courses.use-case'

class MockCreateUseCase {
  execute = vi.fn()
}

class MockListUseCase {
  execute = vi.fn()
}

describe('CourseController', () => {
  let controller: CourseController
  let createUseCase: MockCreateUseCase
  let listUseCase: MockListUseCase

  beforeEach(() => {
    createUseCase = new MockCreateUseCase()
    listUseCase = new MockListUseCase()
    controller = new CourseController(createUseCase as any, listUseCase as any)
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

  describe('create()', () => {
    it('should return created course payload on success', async () => {
      const payload = {
        course: {
          id: 'uuid-1234',
          slug: 'curso-teste',
          title: 'Curso Teste',
          description: 'Descrição válida do curso.',
        },
      }
      createUseCase.execute.mockResolvedValueOnce(right(payload))

      const response = await controller.create(validDto)
      expect(response).toEqual(payload.course)

      expect(createUseCase.execute).toHaveBeenCalledWith({
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
      createUseCase.execute.mockResolvedValueOnce(left(new InvalidInputError('Validação falhou', details)))

      await expect(controller.create(validDto)).rejects.toBeInstanceOf(BadRequestException)
    })

    it('should throw ConflictException on DuplicateCourseError', async () => {
      createUseCase.execute.mockResolvedValueOnce(left(new DuplicateCourseError()))

      await expect(controller.create(validDto)).rejects.toBeInstanceOf(ConflictException)
    })

    it('should throw InternalServerErrorException on RepositoryError', async () => {
      createUseCase.execute.mockResolvedValueOnce(left(new RepositoryError('DB down')))

      await expect(controller.create(validDto)).rejects.toBeInstanceOf(InternalServerErrorException)
    })

    it('should throw InternalServerErrorException on generic Error', async () => {
      createUseCase.execute.mockResolvedValueOnce(left(new Error('Unexpected')))

      await expect(controller.create(validDto)).rejects.toBeInstanceOf(InternalServerErrorException)
    })
  })

  describe('list()', () => {
    it('should return list of courses on success', async () => {
      const coursesArray = [
        { id: 'id1', slug: 'c1', title: 'Curso 1', description: 'Desc 1' },
        { id: 'id2', slug: 'c2', title: 'Curso 2', description: 'Desc 2' },
      ]
      listUseCase.execute.mockResolvedValueOnce(right({ courses: coursesArray }))

      const response = await controller.list()
      expect(response).toEqual(coursesArray)
      expect(listUseCase.execute).toHaveBeenCalled()
    })

    it('should throw InternalServerErrorException on Left', async () => {
      const repoErr = new RepositoryError('DB fail')
      listUseCase.execute.mockResolvedValueOnce(left(repoErr))

      await expect(controller.list()).rejects.toBeInstanceOf(InternalServerErrorException)
    })
  })
})