import { left } from '@/core/either';
import { vi } from 'vitest';

import { CreateAddressUseCase } from './create-address.use-case';
import { InvalidInputError } from './errors/invalid-input-error';
import { CreateAddressRequest } from '../dtos/create-address-request.dto';
import { InMemoryAddressRepository } from '@/test/repositories/in-memory-address-repository';

let repo: InMemoryAddressRepository;
let sut: CreateAddressUseCase;
let defaultDto: CreateAddressRequest;

describe('CreateAddressUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryAddressRepository();
    sut = new CreateAddressUseCase(repo);
    defaultDto = {
      userId: 'user-1',
      street: '123 Main St',
      number: '42A',
      complement: 'Apt. 7',
      district: 'Central',
      city: 'Metropolis',
      state: 'Stateville',
      country: 'Freedonia',
      postalCode: '12345-678',
    };
  });

  it('should be able to create an address', async () => {
    const result = await sut.execute(defaultDto);
    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      expect(repo.items).toHaveLength(1);
      const stored = repo.items[0].toResponseObject();
      expect(result.value.addressId).toBe(stored.id);

      expect(stored).toMatchObject({
        street: defaultDto.street,
        number: defaultDto.number,
        complement: defaultDto.complement,
        district: defaultDto.district,
        city: defaultDto.city,
        state: defaultDto.state,
        country: defaultDto.country,
        postalCode: defaultDto.postalCode,
      });
    }
  });

  it('should reject when required fields are missing', async () => {
    const dto = { ...defaultDto, street: '' } as any;
    const result = await sut.execute(dto);
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
      expect(result.value.message).toBe('Missing required fields');
    }
  });

  it('should bubble up repository errors (returned Left)', async () => {
    vi.spyOn(repo, 'create').mockResolvedValueOnce(left(new Error('DB down')));
    const result = await sut.execute(defaultDto);
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(Error);
      expect(result.value.message).toBe('DB down');
    }
  });

  it('should bubble up repository exceptions', async () => {
    vi.spyOn(repo, 'create').mockImplementationOnce(() => {
      throw new Error('Thrown');
    });
    const result = await sut.execute(defaultDto);
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(Error);
      expect(result.value.message).toBe('Thrown');
    }
  });
});
