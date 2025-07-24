// src/domain/auth/application/dtos/update-address-response.dto.ts
export interface UpdateAddressResponseDto {
  id: string;
  street: string;
  number: string;
  complement?: string | null;
  district?: string | null;
  city: string;
  state?: string | null;
  country: string;
  postalCode: string;
  createdAt: Date;
  updatedAt: Date;
}
