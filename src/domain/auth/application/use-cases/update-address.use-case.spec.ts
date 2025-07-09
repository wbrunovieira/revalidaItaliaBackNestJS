// src/domain/auth/application/use-cases/update-address.use-case.spec.ts

import { vi } from 'vitest';
import { left, right } from '@/core/either';
import {
  UpdateAddressUseCase,
  UpdateAddressRequest,
} from './update-address.use-case';
import { InvalidInputError } from './errors/invalid-input-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

import { InMemoryAddressRepository } from '@/test/repositories/in-memory-address-repository';
import { Address } from '@/domain/auth/enterprise/entities/address.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

describe('UpdateAddressUseCase', () => {
  let repo: InMemoryAddressRepository;
  let sut: UpdateAddressUseCase;

  beforeEach(() => {
    repo = new InMemoryAddressRepository();
    sut = new UpdateAddressUseCase(repo);
  });

  it('updates an address successfully', async () => {
    const userId = new UniqueEntityID('user-1');
    const address = Address.create({
      userId,
      street: 'Old',
      number: '1',
      city: 'C',
      country: 'X',
      postalCode: '000',
    });
    repo.items.push(address);

    const dto: UpdateAddressRequest = {
      id: address.id.toString(),
      street: 'New',
      city: 'City2',
    };
    const result = await sut.execute(dto);

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      // O use-case retorna o próprio Address atualizado
      expect(result.value.street).toBe('New');
      expect(result.value.city).toBe('City2');

      // Verifica que realmente foi persistido no repositório
      expect(repo.items[0].street).toBe('New');
      expect(repo.items[0].city).toBe('City2');
    }
  });

  it('rejects missing id', async () => {
    const result = await sut.execute({ id: '', street: 'A' });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
      expect(result.value.message).toBe('Missing id');
    }
  });

  it('rejects when no fields provided', async () => {
    const result = await sut.execute({ id: 'some-id' });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
      expect(result.value.message).toBe(
        'At least one field to update must be provided',
      );
    }
  });

  it('returns ResourceNotFoundError if address not found', async () => {
    // Simula findById retornando Right(undefined): “não achou no banco”
    vi.spyOn(repo, 'findById').mockResolvedValueOnce(right(undefined));

    const result = await sut.execute({ id: 'missing', street: 'A' });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      expect(result.value.message).toBe('Address not found');
    }
  });

  it('bubbles up repository Left errors', async () => {
    const dbErr = new Error('DB down');
    // findById devolve Left(new Error("DB down"))
    vi.spyOn(repo, 'findById').mockResolvedValueOnce(left(dbErr));

    const result = await sut.execute({ id: 'id', street: 'A' });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      // Se repository.findById retornar Left(error), deve voltar exatamente esse error
      expect(result.value).toBe(dbErr);
    }
  });

  it('bubbles up repository exceptions', async () => {
    // findById “lança” uma exceção
    vi.spyOn(repo, 'findById').mockImplementationOnce(() => {
      throw new Error('Boom');
    });
    const result = await sut.execute({ id: 'id', street: 'A' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      // Se findById lançar, devolve a própria exceção
      expect(result.value).toBeInstanceOf(Error);
      expect(result.value.message).toBe('Boom');
    }
  });
});
