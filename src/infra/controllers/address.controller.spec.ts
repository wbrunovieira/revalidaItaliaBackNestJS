// src/infra/controllers/address.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { vi } from 'vitest'

import { AddressController } from './address.controller'
import { CreateAddressUseCase } from '@/domain/auth/application/use-cases/create-address.use-case'
import { CreateAddressRequest } from '@/domain/auth/application/dtos/create-address-request.dto'
import { InvalidInputError } from '@/domain/auth/application/use-cases/errors/invalid-input-error'
import { Either, right, left } from '@/core/either'

describe('AddressController (e2e)', () => {
  let app: INestApplication
  let createAddress: CreateAddressUseCase

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AddressController],
      providers: [
        {
          provide: CreateAddressUseCase,
          useValue: { execute: vi.fn() },
        },
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    )
    createAddress = moduleFixture.get(CreateAddressUseCase)
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

  it('POST /addresses → 400 when missing required', async () => {
    vi.spyOn(createAddress, 'execute')
      .mockResolvedValueOnce(left(new InvalidInputError('Missing required fields', ['street'])))

    const res = await request(app.getHttpServer())
      .post('/addresses')
      .send({ ...validDto, street: '' })
      .expect(HttpStatus.BAD_REQUEST)

    expect(res.body).toHaveProperty('message', 'Missing required fields')
    expect(res.body.errors).toEqual({ details: ['street'] })
  })

  it('POST /addresses → 500 on unexpected error', async () => {
    vi.spyOn(createAddress, 'execute')
      .mockResolvedValueOnce(left(new Error('Something went wrong')))

    const res = await request(app.getHttpServer())
      .post('/addresses')
      .send(validDto)
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)

    expect(res.body).toHaveProperty('message', 'Something went wrong')
  })

    it('POST /addresses → 500 on unexpected error returned as Left', async () => {
    vi.spyOn(createAddress, 'execute')
      .mockResolvedValueOnce(left(new Error('Something went wrong')))

    const res = await request(app.getHttpServer())
      .post('/addresses')
      .send(validDto)
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)

    expect(res.body).toHaveProperty('message', 'Something went wrong')
  })


  it('POST /addresses → 400 when extra (non‐whitelisted) fields present', async () => {

    const res = await request(app.getHttpServer())
      .post('/addresses')
      .send({ ...validDto, foo: 'bar' })
      .expect(HttpStatus.BAD_REQUEST)


    expect(res.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('property foo should not exist')]),
    )
  })

  it('POST /addresses → 500 when useCase.execute throws an exception', async () => {
    vi.spyOn(createAddress, 'execute').mockImplementationOnce(() => {
      throw new Error('Unexpected failure')
    })

    const res = await request(app.getHttpServer())
      .post('/addresses')
      .send(validDto)
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)

    expect(res.body).toHaveProperty('message', 'Unexpected failure')
  })
})