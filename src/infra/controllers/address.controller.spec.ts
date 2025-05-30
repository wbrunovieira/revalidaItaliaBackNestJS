// src/infra/controllers/address.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { vi } from 'vitest'

import { AddressController } from './address.controller'
import { CreateAddressUseCase } from '@/domain/auth/application/use-cases/create-address.use-case'
import { FindAddressByUserUseCase } from '@/domain/auth/application/use-cases/find-address-by-user.use-case'
import { CreateAddressRequest } from '@/domain/auth/application/dtos/create-address-request.dto'
import { InvalidInputError } from '@/domain/auth/application/use-cases/errors/invalid-input-error'
import { Either, right, left } from '@/core/either'
import { Address } from '@/domain/auth/enterprise/entities/address.entity'
import { UniqueEntityID } from '@/core/unique-entity-id'

describe('AddressController', () => {
  let app: INestApplication
  let createAddress: CreateAddressUseCase
  let findAddressByUser: FindAddressByUserUseCase

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AddressController],
      providers: [
        { provide: CreateAddressUseCase, useValue: { execute: vi.fn() } },
        { provide: FindAddressByUserUseCase, useValue: { execute: vi.fn() } },
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    )
    createAddress = moduleFixture.get(CreateAddressUseCase)
    findAddressByUser = moduleFixture.get(FindAddressByUserUseCase)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  const validDto: CreateAddressRequest = {
    userId:     'user-1',
    street:     '123 Main St',
    number:     '42A',
    complement: 'Apt. 7',
    district:   'Central',
    city:       'Metropolis',
    state:      'Stateville',
    country:    'Freedonia',
    postalCode: '12345-678',
  }

  it('POST /addresses → 201 { addressId }', async () => {
    vi.spyOn(createAddress, 'execute')
      .mockResolvedValueOnce(right({ addressId: 'addr-123' }))

    const res = await request(app.getHttpServer())
      .post('/addresses')
      .send(validDto)
      .expect(HttpStatus.CREATED)

    expect(res.body).toEqual({ addressId: 'addr-123' })
  })

  it('GET /addresses?userId= → 200 [addr1, addr2]', async () => {
    const userId = new UniqueEntityID('user-1')
    const addr1 = Address.create({
      userId,
      street: 'A',
      number: '1',
      city: 'C',
      country: 'X',
      postalCode: '000',
    })
    const addr2 = Address.create({
      userId,
      street: 'B',
      number: '2',
      city: 'D',
      country: 'Y',
      postalCode: '111',
    })

    // mock the use-case
    vi.spyOn(findAddressByUser, 'execute')
      .mockResolvedValueOnce(right([addr1, addr2]))

    const res = await request(app.getHttpServer())
      .get('/addresses')
      .query({ userId: userId.toString() })
      .expect(HttpStatus.OK)

    // we expect ISO strings for dates in the JSON response
    const expected = [addr1, addr2].map(a => {
      const { createdAt, updatedAt, ...rest } = a.toResponseObject()
      return {
        ...rest,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      }
    })
    expect(res.body).toEqual(expected)
  })

  it('GET /addresses → 400 when missing userId', async () => {
    vi.spyOn(findAddressByUser, 'execute')
      .mockResolvedValueOnce(left(new InvalidInputError('Missing userId', [])))

    const res = await request(app.getHttpServer())
      .get('/addresses')
      .expect(HttpStatus.BAD_REQUEST)

    expect(res.body).toHaveProperty('message', 'Missing userId')
    expect(res.body.errors).toEqual({ details: [] })
  })

  it('GET /addresses → 500 on repository error', async () => {
    vi.spyOn(findAddressByUser, 'execute')
      .mockResolvedValueOnce(left(new Error('DB down')))

    const res = await request(app.getHttpServer())
      .get('/addresses')
      .query({ userId: 'user-1' })
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)

    expect(res.body).toHaveProperty('message', 'DB down')
  })

  it('GET /addresses → 500 on exception thrown', async () => {
    vi.spyOn(findAddressByUser, 'execute')
      .mockImplementationOnce(() => { throw new Error('Thrown') })

    const res = await request(app.getHttpServer())
      .get('/addresses')
      .query({ userId: 'user-1' })
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)

    expect(res.body).toHaveProperty('message', 'Thrown')
  })
})