// src/domain/auth/application/dtos/update-address-request.dto.ts

export interface UpdateAddressRequest {
  id: string;
  street?: string;
  number?: string;
  complement?: string | null;
  district?: string | null;
  city?: string;
  state?: string | null;
  country?: string;
  postalCode?: string;
}
