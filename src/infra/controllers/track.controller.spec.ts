// src/infra/course-catalog/controllers/track.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,

  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { left, right } from '@/core/either';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { DuplicateTrackError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-track-error';
import { TrackNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/track-not-found-error';
import { CreateTrackUseCase } from '@/domain/course-catalog/application/use-cases/create-track.use-case';
import { GetTrackUseCase } from '@/domain/course-catalog/application/use-cases/get-track.use-case';
import { TrackController } from './track.controller';
import { CreateTrackDto } from '@/domain/course-catalog/application/dtos/create-track.dto';
import { GetTrackDto } from '@/domain/course-catalog/application/dtos/get-track.dto';


class MockCreateTrackUseCase {
  execute = vi.fn();
}
class MockGetTrackUseCase {
  execute = vi.fn();
}
class MockListTracksUseCase { execute = vi.fn(); }

describe('TrackController', () => {
  let controller: TrackController;
  let createUseCase: MockCreateTrackUseCase;
  let getUseCase: MockGetTrackUseCase;
  let listUseCase: MockListTracksUseCase;

  beforeEach(() => {
    createUseCase = new MockCreateTrackUseCase();
    getUseCase = new MockGetTrackUseCase();
    listUseCase = new MockListTracksUseCase();
    controller = new TrackController(createUseCase as any, getUseCase as any, listUseCase as any);
  });

  const createDto: CreateTrackDto = {
    slug: 'minha-trilha',
    courseIds: ['uuid-1'],
    translations: [
      { locale: 'pt', title: 'PT', description: 'Desc PT' },
      { locale: 'it', title: 'IT', description: 'Desc IT' },
      { locale: 'es', title: 'ES', description: 'Desc ES' },
    ],
  };

  it('create() returns track on success', async () => {
    const payload = { track: { id: '1', slug: 'minha-trilha', courseIds: ['uuid-1'], title: 'PT', description: 'Desc PT' } };
    createUseCase.execute.mockResolvedValueOnce(right(payload));
    const res = await controller.create(createDto);
    expect(res).toEqual(payload.track);
  });

  it('getById() returns track on success', async () => {
    const payload = { track: { id: '1', slug: 'my-track', courseIds: ['uuid-1'], title: 'PT', description: 'Desc PT' } };
    getUseCase.execute.mockResolvedValueOnce(right(payload));
    const res = await controller.getById({ id: '1' } as GetTrackDto);
    expect(res).toEqual(payload.track);
    expect(getUseCase.execute).toHaveBeenCalledWith({ id: '1' });
  });

  it('getById() throws BadRequest on invalid input', async () => {
    getUseCase.execute.mockResolvedValueOnce(left(new InvalidInputError('fail', [])));
    await expect(controller.getById({ id: 'bad' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getById() throws NotFound on TrackNotFoundError', async () => {
    getUseCase.execute.mockResolvedValueOnce(left(new TrackNotFoundError()));
    await expect(controller.getById({ id: '1' } as GetTrackDto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getById() throws InternalServerError on generic error', async () => {
    getUseCase.execute.mockResolvedValueOnce(left(new Error('oops')));
    await expect(controller.getById({ id: '1' } as GetTrackDto)).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('create() returns track on success', async () => {
    const payload = { track: { id: '1', slug: 'minha-trilha', courseIds: ['uuid-1'], title: 'PT', description: 'Desc PT' } };
    createUseCase.execute.mockResolvedValueOnce(right(payload));
    expect(await controller.create(createDto)).toEqual(payload.track);
  });

  it('list() returns tracks on success', async () => {
    const tracks = [
      { id: '1', slug: 't1', courseIds: ['c1'], translations: [] },
      { id: '2', slug: 't2', courseIds: ['c2'], translations: [] },
    ];
    listUseCase.execute.mockResolvedValueOnce(right({ tracks }));
    expect(await controller.list()).toEqual(tracks);
    expect(listUseCase.execute).toHaveBeenCalled();
  });


  it('list() throws InternalServerError on error', async () => {
    listUseCase.execute.mockResolvedValueOnce(left(new Error('fail')));
    await expect(controller.list()).rejects.toBeInstanceOf(InternalServerErrorException);
  });


});