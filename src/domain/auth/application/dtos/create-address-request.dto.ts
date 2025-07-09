// src/domain/auth/application/dtos/create-address-request.dto.ts

export interface CreateAddressRequest {
  userId: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state?: string;
  country?: string;
  postalCode?: string;
}
