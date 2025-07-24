// src/domain/auth/application/dtos/find-address-by-profile-response.dto.ts
export interface FindAddressByProfileResponseDto {
  addresses: {
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
  }[];
}
