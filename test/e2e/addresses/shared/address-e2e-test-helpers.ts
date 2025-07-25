// test/e2e/addresses/shared/address-e2e-test-helpers.ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response } from 'supertest';

export class AddressE2ETestHelpers {
  static readonly adminToken = 'test-jwt-token';
  static readonly studentToken = 'test-jwt-student-token';
  static readonly invalidToken = 'invalid-token';

  static async createAddress(
    app: INestApplication,
    addressData: {
      profileId: string;
      street: string;
      number: string;
      complement?: string;
      district?: string;
      city: string;
      state?: string;
      country: string;
      postalCode: string;
    },
    token: string = this.adminToken,
  ): Promise<Response> {
    return request(app.getHttpServer())
      .post('/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(addressData);
  }

  static async getAddressesByProfileId(
    app: INestApplication,
    profileId: string,
    token: string = this.adminToken,
  ): Promise<Response> {
    return request(app.getHttpServer())
      .get(`/addresses?profileId=${profileId}`)
      .set('Authorization', `Bearer ${token}`);
  }

  static async updateAddress(
    app: INestApplication,
    addressId: string,
    updateData: Partial<{
      street: string;
      number: string;
      complement: string;
      district: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    }>,
    token: string = this.adminToken,
  ): Promise<Response> {
    return request(app.getHttpServer())
      .patch(`/addresses/${addressId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);
  }

  static async deleteAddress(
    app: INestApplication,
    addressId: string,
    token: string = this.adminToken,
  ): Promise<Response> {
    return request(app.getHttpServer())
      .delete(`/addresses/${addressId}`)
      .set('Authorization', `Bearer ${token}`);
  }
}