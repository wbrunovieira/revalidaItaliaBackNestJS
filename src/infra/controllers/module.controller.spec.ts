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
import { GetModulesUseCase } from '@/domain/course-catalog/application/use-cases/get-modules.use-case';

class MockCreateUseCase {
  execute = vi.fn();
}

class MockGetUseCase {
  execute = vi.fn();
}

describe('ModuleController', () => {
  let controller: ModuleController;
  let createUseCase: MockCreateUseCase;
  let getUseCase: MockGetUseCase;

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

  beforeEach(() => {
    createUseCase = new MockCreateUseCase();
    getUseCase = new MockGetUseCase();
    controller = new ModuleController(
      createUseCase as any,
      getUseCase as any
    );
  });

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
    createUseCase.execute.mockResolvedValueOnce(right(payload));

    const response = await controller.create(courseId, validDto);
    expect(response).toEqual(payload.module);

    expect(createUseCase.execute).toHaveBeenCalledWith({
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

  it('should throw BadRequestException on InvalidInputError during create', async () => {
    const details = [{ path: ['translations'], message: 'Falta pt' }];
    createUseCase.execute.mockResolvedValueOnce(left(new InvalidInputError('Validação falhou', details)));

    await expect(controller.create(courseId, validDto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw NotFoundException on CourseNotFoundError during create', async () => {
    createUseCase.execute.mockResolvedValueOnce(left(new CourseNotFoundError()));

    await expect(controller.create(courseId, validDto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw ConflictException on DuplicateModuleOrderError during create', async () => {
    createUseCase.execute.mockResolvedValueOnce(left(new DuplicateModuleOrderError()));

    await expect(controller.create(courseId, validDto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('should throw InternalServerErrorException on generic Error during create', async () => {
    createUseCase.execute.mockResolvedValueOnce(left(new Error('Unexpected')));

    await expect(controller.create(courseId, validDto)).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should return modules list on successful findAll', async () => {
    const modulesPayload = [
      { id: 'm1', slug: 'mod1', order: 1, translations: [] },
      { id: 'm2', slug: 'mod2', order: 2, translations: [] },
    ];
    getUseCase.execute.mockResolvedValueOnce(right({ modules: modulesPayload }));

    const response = await controller.findAll(courseId);
    expect(response).toEqual(modulesPayload);
    expect(getUseCase.execute).toHaveBeenCalledWith({ courseId });
  });

  it('should throw BadRequestException on InvalidInputError during findAll', async () => {
    const details = [{ path: ['courseId'], message: 'Invalid UUID' }];
    getUseCase.execute.mockResolvedValueOnce(left(new InvalidInputError('Validation failed', details)));

    await expect(controller.findAll(courseId)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw InternalServerErrorException on generic Error during findAll', async () => {
    getUseCase.execute.mockResolvedValueOnce(left(new Error('DB error')));

    await expect(controller.findAll(courseId)).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});