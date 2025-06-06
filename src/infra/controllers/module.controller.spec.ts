// src/infra/course-catalog/controllers/module.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { left, right } from '@/core/either';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { CourseNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/course-not-found-error';
import { DuplicateModuleOrderError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-module-order-error';
import { ModuleController } from './module.controller';
import { CreateModuleDto } from '@/domain/course-catalog/application/dtos/create-module.dto';


class MockUseCase {
  execute = vi.fn();
}

describe('ModuleController', () => {
  let controller: ModuleController;
  let useCase: MockUseCase;

  beforeEach(() => {
    useCase = new MockUseCase();
    controller = new ModuleController(useCase as any);
  });

  const validDto: CreateModuleDto = {
    slug: 'modulo-teste',
    translations: [
      { locale: 'pt', title: 'Módulo Teste', description: 'Descrição válida' },
      { locale: 'it', title: 'Modulo Test', description: 'Descrizione valida' },
      { locale: 'es', title: 'Módulo Prueba', description: 'Descripción válida' },
    ],
    order: 1,
  };
  const courseId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  it('should return created module payload on success', async () => {
    const payload = {
      module: {
        id: 'module-1234',
        slug: 'modulo-teste',
        order: 1,
        translations: [
          { locale: 'pt', title: 'Módulo Teste', description: 'Descrição válida' },
          { locale: 'it', title: 'Modulo Test', description: 'Descrizione valida' },
          { locale: 'es', title: 'Módulo Prueba', description: 'Descripción válida' },
        ],
      },
    };
    useCase.execute.mockResolvedValueOnce(right(payload));

    const response = await controller.create(courseId, validDto);
    expect(response).toEqual(payload.module);

    expect(useCase.execute).toHaveBeenCalledWith({
      courseId,
      slug: validDto.slug,
      translations: validDto.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        description: t.description,
      })),
      order: validDto.order,
    });
  });

  it('should throw BadRequestException on InvalidInputError', async () => {
    const details = [{ path: ['translations'], message: 'Falta pt' }];
    useCase.execute.mockResolvedValueOnce(left(new InvalidInputError('Validação falhou', details)));

    await expect(controller.create(courseId, validDto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw NotFoundException on CourseNotFoundError', async () => {
    useCase.execute.mockResolvedValueOnce(left(new CourseNotFoundError()));

    await expect(controller.create(courseId, validDto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw ConflictException on DuplicateModuleOrderError', async () => {
    useCase.execute.mockResolvedValueOnce(left(new DuplicateModuleOrderError()));

    await expect(controller.create(courseId, validDto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('should throw InternalServerErrorException on generic Error', async () => {
    useCase.execute.mockResolvedValueOnce(left(new Error('Unexpected')));

    await expect(controller.create(courseId, validDto)).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});