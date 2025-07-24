// src/domain/auth/application/use-cases/create-address.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateAddressUseCase } from './create-address.use-case';
import { InMemoryAddressRepository } from '@/test/repositories/in-memory-address-repository';
import { CreateAddressRequestDto } from '../dtos/create-address-request.dto';
import { RepositoryError } from '@/domain/auth/domain/exceptions';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left } from '@/core/either';

describe('CreateAddressUseCase', () => {
  let addressRepo: InMemoryAddressRepository;
  let sut: CreateAddressUseCase;

  const validRequest: CreateAddressRequestDto = {
    profileId: 'profile-123',
    street: 'Via Roma',
    number: '123',
    complement: 'Apt 4B',
    district: 'Centro',
    city: 'Milano',
    state: 'Lombardia',
    country: 'Italia',
    postalCode: '20121',
  };

  beforeEach(() => {
    addressRepo = new InMemoryAddressRepository();
    sut = new CreateAddressUseCase(addressRepo);
  });

  // Success Cases
  describe('Success Cases', () => {
    it('should create address successfully with all fields', async () => {
      const result = await sut.execute(validRequest);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addressId).toBeDefined();
        expect(typeof result.value.addressId).toBe('string');
      }

      // Verify address was saved to repository
      expect(addressRepo.items).toHaveLength(1);

      const savedAddress = addressRepo.items[0];
      expect(savedAddress.profileId.toString()).toBe(validRequest.profileId);
      expect(savedAddress.street).toBe(validRequest.street);
      expect(savedAddress.number).toBe(validRequest.number);
      expect(savedAddress.complement).toBe(validRequest.complement);
      expect(savedAddress.district).toBe(validRequest.district);
      expect(savedAddress.city).toBe(validRequest.city);
      expect(savedAddress.state).toBe(validRequest.state);
      expect(savedAddress.country).toBe(validRequest.country);
      expect(savedAddress.postalCode).toBe(validRequest.postalCode);
    });

    it('should create address with only required fields', async () => {
      const minimalRequest: CreateAddressRequestDto = {
        profileId: 'profile-456',
        street: 'Via Milano',
        number: '456',
        city: 'Roma',
      };

      const result = await sut.execute(minimalRequest);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addressId).toBeDefined();
      }

      expect(addressRepo.items).toHaveLength(1);

      const savedAddress = addressRepo.items[0];
      expect(savedAddress.profileId.toString()).toBe(minimalRequest.profileId);
      expect(savedAddress.street).toBe(minimalRequest.street);
      expect(savedAddress.number).toBe(minimalRequest.number);
      expect(savedAddress.city).toBe(minimalRequest.city);
      expect(savedAddress.complement).toBeNull();
      expect(savedAddress.district).toBeNull();
      expect(savedAddress.state).toBeNull();
      expect(savedAddress.country).toBe('');
      expect(savedAddress.postalCode).toBe('');
    });

    it('should create address with default values for optional fields', async () => {
      const requestWithUndefined: CreateAddressRequestDto = {
        profileId: 'profile-789',
        street: 'Via Torino',
        number: '789',
        city: 'Napoli',
        complement: undefined,
        district: undefined,
        state: undefined,
        country: undefined,
        postalCode: undefined,
      };

      const result = await sut.execute(requestWithUndefined);

      expect(result.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(1);

      const savedAddress = addressRepo.items[0];
      expect(savedAddress.complement).toBeNull();
      expect(savedAddress.district).toBeNull(); // Address entity converts undefined to null
      expect(savedAddress.state).toBeNull();
      expect(savedAddress.country).toBe('');
      expect(savedAddress.postalCode).toBe('');
    });

    it('should generate unique address IDs for multiple addresses', async () => {
      const request1 = { ...validRequest, profileId: 'profile-1' };
      const request2 = { ...validRequest, profileId: 'profile-2' };

      const result1 = await sut.execute(request1);
      const result2 = await sut.execute(request2);

      expect(result1.isRight()).toBe(true);
      expect(result2.isRight()).toBe(true);

      if (result1.isRight() && result2.isRight()) {
        expect(result1.value.addressId).not.toBe(result2.value.addressId);
      }

      expect(addressRepo.items).toHaveLength(2);
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const before = new Date();
      const result = await sut.execute(validRequest);
      const after = new Date();

      expect(result.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(1);

      const savedAddress = addressRepo.items[0];
      expect(savedAddress.createdAt).toBeInstanceOf(Date);
      expect(savedAddress.updatedAt).toBeInstanceOf(Date);
      expect(savedAddress.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(savedAddress.createdAt.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
      expect(savedAddress.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(savedAddress.updatedAt.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });
  });

  // Error Cases
  describe('Error Cases', () => {
    describe('Repository Errors', () => {
      it('should fail when repository create method returns left', async () => {
        const repositoryError = new Error('Database connection failed');
        vi.spyOn(addressRepo, 'create').mockResolvedValueOnce(
          left(repositoryError),
        );

        const result = await sut.execute(validRequest);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(RepositoryError);
          expect(result.value.message).toBe(repositoryError.message);
        }
      });

      it('should fail when repository create method throws exception', async () => {
        const error = new Error('Unexpected database error');
        vi.spyOn(addressRepo, 'create').mockRejectedValueOnce(error);

        const result = await sut.execute(validRequest);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(RepositoryError);
          expect(result.value.message).toBe(error.message);
        }
      });

      it('should handle repository timeout errors', async () => {
        const timeoutError = new Error('Operation timed out');
        vi.spyOn(addressRepo, 'create').mockRejectedValueOnce(timeoutError);

        const result = await sut.execute(validRequest);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(RepositoryError);
          expect(result.value.message).toBe('Operation timed out');
        }
      });

      it('should handle repository constraint violation errors', async () => {
        const constraintError = new Error('Foreign key constraint violation');
        vi.spyOn(addressRepo, 'create').mockResolvedValueOnce(
          left(constraintError),
        );

        const result = await sut.execute(validRequest);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(RepositoryError);
          expect(result.value.message).toBe('Foreign key constraint violation');
        }
      });
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle very long street names', async () => {
      const longStreetRequest: CreateAddressRequestDto = {
        ...validRequest,
        street: 'A'.repeat(255), // Very long street name
      };

      const result = await sut.execute(longStreetRequest);

      expect(result.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(1);
      expect(addressRepo.items[0].street).toBe('A'.repeat(255));
    });

    it('should handle special characters in address fields', async () => {
      const specialCharsRequest: CreateAddressRequestDto = {
        profileId: 'profile-special',
        street: 'Rua São José & Cia.',
        number: '123-A',
        complement: 'Bloco C - Apt° 45',
        district: 'Bairro São João',
        city: 'São Paulo',
        state: 'São Paulo',
        country: 'Brasil',
        postalCode: '01234-567',
      };

      const result = await sut.execute(specialCharsRequest);

      expect(result.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(1);

      const savedAddress = addressRepo.items[0];
      expect(savedAddress.street).toBe('Rua São José & Cia.');
      expect(savedAddress.number).toBe('123-A');
      expect(savedAddress.complement).toBe('Bloco C - Apt° 45');
      expect(savedAddress.postalCode).toBe('01234-567');
    });

    it('should handle empty string values for optional fields', async () => {
      const emptyStringsRequest: CreateAddressRequestDto = {
        profileId: 'profile-empty',
        street: 'Test Street',
        number: '123',
        city: 'Test City',
        complement: '',
        district: '',
        state: '',
        country: '',
        postalCode: '',
      };

      const result = await sut.execute(emptyStringsRequest);

      expect(result.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(1);

      const savedAddress = addressRepo.items[0];
      expect(savedAddress.complement).toBeNull(); // Empty string becomes null
      expect(savedAddress.state).toBeNull(); // Empty string becomes null
      expect(savedAddress.country).toBe(''); // Country keeps empty string
      expect(savedAddress.postalCode).toBe(''); // PostalCode keeps empty string
    });

    it('should handle numeric strings in address fields', async () => {
      const numericRequest: CreateAddressRequestDto = {
        profileId: '12345',
        street: '123 Main Street',
        number: '456',
        city: '789 City',
        complement: 'Unit 101',
        postalCode: '12345',
      };

      const result = await sut.execute(numericRequest);

      expect(result.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(1);

      const savedAddress = addressRepo.items[0];
      expect(savedAddress.profileId.toString()).toBe('12345');
      expect(savedAddress.number).toBe('456');
      expect(savedAddress.postalCode).toBe('12345');
    });

    it('should handle whitespace in address fields', async () => {
      const whitespaceRequest: CreateAddressRequestDto = {
        profileId: 'profile-whitespace',
        street: '  Via Roma  ',
        number: '  123  ',
        city: '  Milano  ',
        complement: '  Apt 4B  ',
      };

      const result = await sut.execute(whitespaceRequest);

      expect(result.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(1);

      const savedAddress = addressRepo.items[0];
      // Values are stored as-is (trimming would be handled at controller/DTO level)
      expect(savedAddress.street).toBe('  Via Roma  ');
      expect(savedAddress.number).toBe('  123  ');
      expect(savedAddress.city).toBe('  Milano  ');
      expect(savedAddress.complement).toBe('  Apt 4B  ');
    });
  });

  // Business Rules
  describe('Business Rules', () => {
    it('should allow multiple addresses for the same profile', async () => {
      const address1 = { ...validRequest, street: 'Via Roma' };
      const address2 = { ...validRequest, street: 'Via Milano' };

      const result1 = await sut.execute(address1);
      const result2 = await sut.execute(address2);

      expect(result1.isRight()).toBe(true);
      expect(result2.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(2);

      expect(addressRepo.items[0].profileId.toString()).toBe(
        validRequest.profileId,
      );
      expect(addressRepo.items[1].profileId.toString()).toBe(
        validRequest.profileId,
      );
      expect(addressRepo.items[0].street).toBe('Via Roma');
      expect(addressRepo.items[1].street).toBe('Via Milano');
    });

    it('should allow identical addresses for different profiles', async () => {
      const address1 = { ...validRequest, profileId: 'profile-1' };
      const address2 = { ...validRequest, profileId: 'profile-2' };

      const result1 = await sut.execute(address1);
      const result2 = await sut.execute(address2);

      expect(result1.isRight()).toBe(true);
      expect(result2.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(2);

      expect(addressRepo.items[0].profileId.toString()).toBe('profile-1');
      expect(addressRepo.items[1].profileId.toString()).toBe('profile-2');
      expect(addressRepo.items[0].street).toBe(addressRepo.items[1].street);
    });

    it('should maintain data integrity across address creation', async () => {
      const originalRequest = { ...validRequest };

      await sut.execute(validRequest);

      // Modify the original request to ensure immutability
      validRequest.street = 'Modified Street';

      expect(addressRepo.items).toHaveLength(1);
      expect(addressRepo.items[0].street).toBe(originalRequest.street);
    });

    it('should create valid UniqueEntityID for profileId', async () => {
      const result = await sut.execute(validRequest);

      expect(result.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(1);

      const savedAddress = addressRepo.items[0];
      expect(savedAddress.profileId).toBeInstanceOf(UniqueEntityID);
      expect(savedAddress.profileId.toString()).toBe(validRequest.profileId);
    });
  });

  // Integration Tests
  describe('Integration Tests', () => {
    it('should work end-to-end with repository operations', async () => {
      // Create address
      const result = await sut.execute(validRequest);

      expect(result.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(1);

      if (result.isRight()) {
        const addressId = result.value.addressId;

        // Verify we can find the created address
        const findResult = await addressRepo.findById(addressId);
        expect(findResult.isRight()).toBe(true);

        if (findResult.isRight()) {
          expect(findResult.value).toBeDefined();
          expect(findResult.value?.id.toString()).toBe(addressId);
        }
      }
    });

    it('should handle concurrent address creation', async () => {
      const requests = Array(5)
        .fill(null)
        .map((_, index) => ({
          ...validRequest,
          profileId: `profile-${index}`,
          street: `Via Test ${index}`,
        }));

      const promises = requests.map((request) => sut.execute(request));
      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.isRight()).toBe(true);
      });

      expect(addressRepo.items).toHaveLength(5);

      // Verify all addresses have unique IDs
      const addressIds = results
        .map((result) => (result.isRight() ? result.value.addressId : null))
        .filter(Boolean);

      const uniqueIds = new Set(addressIds);
      expect(uniqueIds.size).toBe(5);
    });

    it('should maintain address entity properties correctly', async () => {
      const result = await sut.execute(validRequest);

      expect(result.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(1);

      const savedAddress = addressRepo.items[0];

      // Test all getters work correctly
      expect(savedAddress.profileId.toString()).toBe(validRequest.profileId);
      expect(savedAddress.street).toBe(validRequest.street);
      expect(savedAddress.number).toBe(validRequest.number);
      expect(savedAddress.complement).toBe(validRequest.complement);
      expect(savedAddress.district).toBe(validRequest.district);
      expect(savedAddress.city).toBe(validRequest.city);
      expect(savedAddress.state).toBe(validRequest.state);
      expect(savedAddress.country).toBe(validRequest.country);
      expect(savedAddress.postalCode).toBe(validRequest.postalCode);
      expect(savedAddress.createdAt).toBeInstanceOf(Date);
      expect(savedAddress.updatedAt).toBeInstanceOf(Date);

      // Test response object methods
      const responseObj = savedAddress.toResponseObject();
      expect(responseObj).toHaveProperty('id');
      expect(responseObj).toHaveProperty('street');
      expect(responseObj).toHaveProperty('city');
      expect(responseObj).not.toHaveProperty('profileId'); // Should be omitted
    });
  });
});
