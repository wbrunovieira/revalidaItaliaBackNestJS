// src/infra/controllers/address.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { vi } from 'vitest'

import { AddressController } from './address.controller'
import { CreateAddressUseCase } from '@/domain/auth/application/use-cases/create-address.use-case'
import { FindAddressByUserUseCase } from '@/domain/auth/application/use-cases/find-address-by-user.use-case'
import { UpdateAddressUseCase } from '@/domain/auth/application/use-cases/update-address.use-case'
import { DeleteAddressUseCase } from '@/domain/auth/application/use-cases/delete-address.use-case'
import { CreateAddressRequest } from '@/domain/auth/application/dtos/create-address-request.dto'
import { InvalidInputError } from '@/domain/auth/application/use-cases/errors/invalid-input-error'
import { ResourceNotFoundError } from '@/domain/auth/application/use-cases/errors/resource-not-found-error'
import { Either, right, left } from '@/core/either'
import { Address } from '@/domain/auth/enterprise/entities/address.entity'
import { UniqueEntityID } from '@/core/unique-entity-id'

describe('AddressController', () => {
  let app: INestApplication
  let createAddress: CreateAddressUseCase
  let findAddressByUser: FindAddressByUserUseCase
  let updateAddress: UpdateAddressUseCase
  let deleteAddress: DeleteAddressUseCase

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AddressController],
      providers: [
        { provide: CreateAddressUseCase, useValue: { execute: vi.fn() } },
        { provide: FindAddressByUserUseCase, useValue: { execute: vi.fn() } },
        { provide: UpdateAddressUseCase, useValue: { execute: vi.fn() } },
        { provide: DeleteAddressUseCase, useValue: { execute: vi.fn() } },
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    )
    createAddress = moduleFixture.get(CreateAddressUseCase)
    findAddressByUser = moduleFixture.get(FindAddressByUserUseCase)
    updateAddress = moduleFixture.get(UpdateAddressUseCase)
    deleteAddress = moduleFixture.get(DeleteAddressUseCase)
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

  describe('POST /addresses', () => {
    it('should return 201 { addressId }', async () => {
      vi.spyOn(createAddress, 'execute')
        .mockResolvedValueOnce(right({ addressId: 'addr-123' }))

      const res = await request(app.getHttpServer())
        .post('/addresses')
        .send(validDto)
        .expect(HttpStatus.CREATED)

      expect(res.body).toEqual({ addressId: 'addr-123' })
    })

    it('should return 400 on InvalidInputError', async () => {
      const details = ['street is required']
      vi.spyOn(createAddress, 'execute')
        .mockResolvedValueOnce(left(new InvalidInputError('Invalid input', details)))

      const res = await request(app.getHttpServer())
        .post('/addresses')
        .send(validDto)
        .expect(HttpStatus.BAD_REQUEST)

      expect(res.body).toHaveProperty('message', 'Invalid input')
      expect(res.body.errors).toEqual({ details })
    })

    it('should return 500 on other Left error', async () => {
      vi.spyOn(createAddress, 'execute')
        .mockResolvedValueOnce(left(new Error('DB down')))

      const res = await request(app.getHttpServer())
        .post('/addresses')
        .send(validDto)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(res.body).toHaveProperty('message', 'DB down')
    })

    it('should return 500 on thrown exception', async () => {
      vi.spyOn(createAddress, 'execute').mockImplementationOnce(() => {
        throw new Error('Unexpected')
      })

      const res = await request(app.getHttpServer())
        .post('/addresses')
        .send(validDto)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(res.body).toHaveProperty('message', 'Unexpected')
    })
  })

  describe('GET /addresses', () => {
    it('should return 200 [addr1, addr2]', async () => {
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

      vi.spyOn(findAddressByUser, 'execute')
        .mockResolvedValueOnce(right([addr1, addr2]))

      const res = await request(app.getHttpServer())
        .get('/addresses')
        .query({ userId: userId.toString() })
        .expect(HttpStatus.OK)

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

    it('should return 400 when missing userId', async () => {
      vi.spyOn(findAddressByUser, 'execute')
        .mockResolvedValueOnce(left(new InvalidInputError('Missing userId', [])))

      const res = await request(app.getHttpServer())
        .get('/addresses')
        .expect(HttpStatus.BAD_REQUEST)

      expect(res.body).toHaveProperty('message', 'Missing userId')
      expect(res.body.errors).toEqual({ details: [] })
    })

    it('should return 500 on repository error', async () => {
      vi.spyOn(findAddressByUser, 'execute')
        .mockResolvedValueOnce(left(new Error('DB down')))

      const res = await request(app.getHttpServer())
        .get('/addresses')
        .query({ userId: 'user-1' })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(res.body).toHaveProperty('message', 'DB down')
    })

    it('should return 500 on exception thrown', async () => {
      vi.spyOn(findAddressByUser, 'execute')
        .mockImplementationOnce(() => { throw new Error('Thrown') })

      const res = await request(app.getHttpServer())
        .get('/addresses')
        .query({ userId: 'user-1' })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(res.body).toHaveProperty('message', 'Thrown')
    })
  })

  describe('PATCH /addresses/:id', () => {
    const paramId = 'addr-99'
    const updateDto = {
      street:     'New St',
      number:     '99B',
      complement: 'Suite 100',
      district:   'New District',
      city:       'New City',
      state:      'New State',
      country:    'New Country',
      postalCode: '99999-999',
    }

    it('should return 200 with updated address on success', async () => {
      const userId = new UniqueEntityID('user-1')
      const existing = Address.create({
        userId,
        street: 'Old St',
        number: '1',
        city: 'Old City',
        country: 'Old Country',
        postalCode: '00000-000',
      })
      // apply updates manually to simulate returned entity
      existing.street = updateDto.street
      existing.number = updateDto.number
      existing.complement = updateDto.complement
      existing.district = updateDto.district
      existing.city = updateDto.city
      existing.state = updateDto.state
      existing.country = updateDto.country
      existing.postalCode = updateDto.postalCode

      vi.spyOn(updateAddress, 'execute')
        .mockResolvedValueOnce(right(existing))

      const res = await request(app.getHttpServer())
        .patch(`/addresses/${paramId}`)
        .send(updateDto)
        .expect(HttpStatus.OK)

      const responseObj = existing.toResponseObject()
      const { createdAt, updatedAt, ...rest } = responseObj
      const expected = {
        ...rest,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      }
      expect(res.body).toEqual(expected)
      // verify that the use-case was called with param id, not dto.id
      expect(updateAddress.execute).toHaveBeenCalledWith({
        id: paramId,
        ...updateDto,
      })
    })

    it('should return 400 on InvalidInputError', async () => {
      const details = ['At least one field must be provided']
      vi.spyOn(updateAddress, 'execute')
        .mockResolvedValueOnce(left(new InvalidInputError('Validation failed', details)))

      const res = await request(app.getHttpServer())
        .patch(`/addresses/${paramId}`)
        .send(updateDto)
        .expect(HttpStatus.BAD_REQUEST)

      expect(res.body).toHaveProperty('message', 'Validation failed')
      expect(res.body.errors).toEqual({ details })
    })

    it('should return 500 on other Left error', async () => {
      vi.spyOn(updateAddress, 'execute')
        .mockResolvedValueOnce(left(new Error('update failed')))

      const res = await request(app.getHttpServer())
        .patch(`/addresses/${paramId}`)
        .send(updateDto)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(res.body).toHaveProperty('message', 'update failed')
    })

    it('should return 500 on exception thrown', async () => {
      vi.spyOn(updateAddress, 'execute').mockImplementationOnce(() => {
        throw new Error('exploded')
      })

      const res = await request(app.getHttpServer())
        .patch(`/addresses/${paramId}`)
        .send(updateDto)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(res.body).toHaveProperty('message', 'exploded')
    })
  })

  describe('DELETE /addresses/:id', () => {
    const paramId = 'addr-77'

    it('should return 204 on success', async () => {
      vi.spyOn(deleteAddress, 'execute')
        .mockResolvedValueOnce(right(undefined))

      await request(app.getHttpServer())
        .delete(`/addresses/${paramId}`)
        .expect(HttpStatus.NO_CONTENT)

      expect(deleteAddress.execute).toHaveBeenCalledWith({ id: paramId })
    })

    it('should return 404 on ResourceNotFoundError', async () => {
      vi.spyOn(deleteAddress, 'execute')
        .mockResolvedValueOnce(left(new ResourceNotFoundError('Address not found')))

      const res = await request(app.getHttpServer())
        .delete(`/addresses/${paramId}`)
        .expect(HttpStatus.NOT_FOUND)

      expect(res.body).toHaveProperty('message', 'Address not found')
    })

    it('should return 500 on other Left error', async () => {
      vi.spyOn(deleteAddress, 'execute')
        .mockResolvedValueOnce(left(new Error('delete failed')))

      const res = await request(app.getHttpServer())
        .delete(`/addresses/${paramId}`)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(res.body).toHaveProperty('message', 'delete failed')
    })

    it('should return 500 on exception thrown', async () => {
      vi.spyOn(deleteAddress, 'execute').mockImplementationOnce(() => {
        throw new Error('exploded')
      })

      const res = await request(app.getHttpServer())
        .delete(`/addresses/${paramId}`)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)

      expect(res.body).toHaveProperty('message', 'exploded')
    })
  })
})