// src/domain/auth/application/use-cases/find-address-by-profile.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FindAddressByProfileUseCase } from './find-address-by-profile.use-case';
import { InMemoryAddressRepository } from '@/test/repositories/in-memory-address-repository';
import { FindAddressByProfileRequestDto } from '../dtos/find-address-by-profile-request.dto';
import { Address } from '@/domain/auth/enterprise/entities/address.entity';
import { RepositoryError } from '@/domain/auth/domain/exceptions';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left } from '@/core/either';

describe('FindAddressByProfileUseCase', () => {
  let addressRepo: InMemoryAddressRepository;
  let sut: FindAddressByProfileUseCase;

  const profileId = 'profile-123';
  const now = new Date();

  beforeEach(() => {
    addressRepo = new InMemoryAddressRepository();
    sut = new FindAddressByProfileUseCase(addressRepo);
  });

  const createTestAddress = (overrides = {}) => {
    return Address.create({
      profileId: new UniqueEntityID(profileId),
      street: 'Via Roma',
      number: '123',
      complement: 'Apt 4B',
      district: 'Centro',
      city: 'Milano',
      state: 'Lombardia',
      country: 'Italia',
      postalCode: '20121',
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
  };

  // Success Cases
  describe('Success Cases', () => {
    it('should find addresses successfully when profile has addresses', async () => {
      const address1 = createTestAddress({ street: 'Via Roma' });
      const address2 = createTestAddress({ street: 'Via Milano' });
      addressRepo.items.push(address1, address2);

      const request: FindAddressByProfileRequestDto = { profileId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toHaveLength(2);

        expect(result.value.addresses[0]).toEqual({
          id: address1.id.toString(),
          street: 'Via Roma',
          number: '123',
          complement: 'Apt 4B',
          district: 'Centro',
          city: 'Milano',
          state: 'Lombardia',
          country: 'Italia',
          postalCode: '20121',
          createdAt: address1.createdAt,
          updatedAt: address1.updatedAt,
        });

        expect(result.value.addresses[1]).toEqual({
          id: address2.id.toString(),
          street: 'Via Milano',
          number: '123',
          complement: 'Apt 4B',
          district: 'Centro',
          city: 'Milano',
          state: 'Lombardia',
          country: 'Italia',
          postalCode: '20121',
          createdAt: address2.createdAt,
          updatedAt: address2.updatedAt,
        });
      }
    });

    it('should return empty array when profile has no addresses', async () => {
      const request: FindAddressByProfileRequestDto = { profileId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toEqual([]);
        expect(result.value.addresses).toHaveLength(0);
      }
    });

    it('should return only addresses for the specified profile', async () => {
      const targetProfileAddress = createTestAddress({
        profileId: new UniqueEntityID(profileId),
        street: 'Target Street',
      });
      const otherProfileAddress = createTestAddress({
        profileId: new UniqueEntityID('other-profile'),
        street: 'Other Street',
      });

      addressRepo.items.push(targetProfileAddress, otherProfileAddress);

      const request: FindAddressByProfileRequestDto = { profileId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toHaveLength(1);
        expect(result.value.addresses[0].street).toBe('Target Street');
        expect(result.value.addresses[0].id).toBe(
          targetProfileAddress.id.toString(),
        );
      }
    });

    it('should handle addresses with null optional fields correctly', async () => {
      const addressWithNulls = createTestAddress({
        complement: null,
        district: null,
        state: null,
      });
      addressRepo.items.push(addressWithNulls);

      const request: FindAddressByProfileRequestDto = { profileId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toHaveLength(1);
        expect(result.value.addresses[0].complement).toBeNull();
        expect(result.value.addresses[0].district).toBeNull();
        expect(result.value.addresses[0].state).toBeNull();
      }
    });

    it('should preserve address order as returned by repository', async () => {
      const address1 = createTestAddress({ street: 'First Street' });
      const address2 = createTestAddress({ street: 'Second Street' });
      const address3 = createTestAddress({ street: 'Third Street' });

      addressRepo.items.push(address1, address2, address3);

      const request: FindAddressByProfileRequestDto = { profileId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toHaveLength(3);
        expect(result.value.addresses[0].street).toBe('First Street');
        expect(result.value.addresses[1].street).toBe('Second Street');
        expect(result.value.addresses[2].street).toBe('Third Street');
      }
    });
  });

  // Error Cases
  describe('Error Cases', () => {
    describe('Repository Errors', () => {
      it('should fail when repository findByProfileId returns left', async () => {
        const repositoryError = new Error('Database connection failed');
        vi.spyOn(addressRepo, 'findByProfileId').mockResolvedValueOnce(
          left(repositoryError),
        );

        const request: FindAddressByProfileRequestDto = { profileId };
        const result = await sut.execute(request);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(RepositoryError);
          expect(result.value.message).toBe(repositoryError.message);
        }
      });

      it('should fail when repository findByProfileId throws exception', async () => {
        const error = new Error('Unexpected database error');
        vi.spyOn(addressRepo, 'findByProfileId').mockRejectedValueOnce(error);

        const request: FindAddressByProfileRequestDto = { profileId };
        const result = await sut.execute(request);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(RepositoryError);
          expect(result.value.message).toBe(error.message);
        }
      });

      it('should handle repository timeout errors', async () => {
        const timeoutError = new Error('Query timeout');
        vi.spyOn(addressRepo, 'findByProfileId').mockRejectedValueOnce(
          timeoutError,
        );

        const request: FindAddressByProfileRequestDto = { profileId };
        const result = await sut.execute(request);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(RepositoryError);
          expect(result.value.message).toBe('Query timeout');
        }
      });

      it('should handle repository network errors', async () => {
        const networkError = new Error('Network connection lost');
        vi.spyOn(addressRepo, 'findByProfileId').mockResolvedValueOnce(
          left(networkError),
        );

        const request: FindAddressByProfileRequestDto = { profileId };
        const result = await sut.execute(request);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(RepositoryError);
          expect(result.value.message).toBe('Network connection lost');
        }
      });
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle profile ID with special characters', async () => {
      const specialProfileId = 'profile-123-abc_def@domain.com';
      const address = createTestAddress({
        profileId: new UniqueEntityID(specialProfileId),
      });
      addressRepo.items.push(address);

      const request: FindAddressByProfileRequestDto = {
        profileId: specialProfileId,
      };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toHaveLength(1);
      }
    });

    it('should handle UUID format profile IDs', async () => {
      const uuidProfileId = '550e8400-e29b-41d4-a716-446655440000';
      const address = createTestAddress({
        profileId: new UniqueEntityID(uuidProfileId),
      });
      addressRepo.items.push(address);

      const request: FindAddressByProfileRequestDto = {
        profileId: uuidProfileId,
      };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toHaveLength(1);
      }
    });

    it('should handle very long profile IDs', async () => {
      const longProfileId = 'a'.repeat(255);
      const address = createTestAddress({
        profileId: new UniqueEntityID(longProfileId),
      });
      addressRepo.items.push(address);

      const request: FindAddressByProfileRequestDto = {
        profileId: longProfileId,
      };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toHaveLength(1);
      }
    });

    it('should handle addresses with very long field values', async () => {
      const addressWithLongFields = createTestAddress({
        street: 'A'.repeat(255),
        complement: 'B'.repeat(255),
        district: 'C'.repeat(255),
        city: 'D'.repeat(100),
        state: 'E'.repeat(100),
        country: 'F'.repeat(100),
        postalCode: 'G'.repeat(20),
      });
      addressRepo.items.push(addressWithLongFields);

      const request: FindAddressByProfileRequestDto = { profileId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toHaveLength(1);
        expect(result.value.addresses[0].street).toBe('A'.repeat(255));
        expect(result.value.addresses[0].complement).toBe('B'.repeat(255));
      }
    });

    it('should handle addresses with special characters in all fields', async () => {
      const addressWithSpecialChars = createTestAddress({
        street: 'Rua São José & Cia. #123',
        number: '123-A/B',
        complement: 'Bloco C - Apt° 45 (Térreo)',
        district: 'Bairro São João & Maria',
        city: 'São Paulo',
        state: 'São Paulo (SP)',
        country: 'Brasil',
        postalCode: '01234-567',
      });
      addressRepo.items.push(addressWithSpecialChars);

      const request: FindAddressByProfileRequestDto = { profileId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toHaveLength(1);
        expect(result.value.addresses[0].street).toBe(
          'Rua São José & Cia. #123',
        );
        expect(result.value.addresses[0].postalCode).toBe('01234-567');
      }
    });
  });

  // Business Rules
  describe('Business Rules', () => {
    it('should return all addresses for a profile regardless of count', async () => {
      // Create many addresses for the same profile
      for (let i = 0; i < 10; i++) {
        const address = createTestAddress({
          street: `Street ${i}`,
          number: `${i + 1}`,
        });
        addressRepo.items.push(address);
      }

      const request: FindAddressByProfileRequestDto = { profileId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toHaveLength(10);

        // Verify all addresses are for the correct profile
        result.value.addresses.forEach((address, index) => {
          expect(address.street).toBe(`Street ${index}`);
          expect(address.number).toBe(`${index + 1}`);
        });
      }
    });

    it('should maintain address data integrity', async () => {
      const originalAddress = createTestAddress();
      addressRepo.items.push(originalAddress);

      const request: FindAddressByProfileRequestDto = { profileId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const returnedAddress = result.value.addresses[0];

        // Verify all fields are correctly mapped
        expect(returnedAddress.id).toBe(originalAddress.id.toString());
        expect(returnedAddress.street).toBe(originalAddress.street);
        expect(returnedAddress.number).toBe(originalAddress.number);
        expect(returnedAddress.complement).toBe(originalAddress.complement);
        expect(returnedAddress.district).toBe(originalAddress.district);
        expect(returnedAddress.city).toBe(originalAddress.city);
        expect(returnedAddress.state).toBe(originalAddress.state);
        expect(returnedAddress.country).toBe(originalAddress.country);
        expect(returnedAddress.postalCode).toBe(originalAddress.postalCode);
        expect(returnedAddress.createdAt).toBe(originalAddress.createdAt);
        expect(returnedAddress.updatedAt).toBe(originalAddress.updatedAt);
      }
    });

    it('should not modify repository data during read operation', async () => {
      const address = createTestAddress();
      addressRepo.items.push(address);
      const originalItemsLength = addressRepo.items.length;

      const request: FindAddressByProfileRequestDto = { profileId };
      await sut.execute(request);

      expect(addressRepo.items).toHaveLength(originalItemsLength);
      expect(addressRepo.items[0]).toBe(address); // Same reference
    });

    it('should handle case-sensitive profile ID matching', async () => {
      const address1 = createTestAddress({
        profileId: new UniqueEntityID('Profile-123'),
      });
      const address2 = createTestAddress({
        profileId: new UniqueEntityID('profile-123'),
      });
      addressRepo.items.push(address1, address2);

      // Search for exact case match
      const request: FindAddressByProfileRequestDto = {
        profileId: 'Profile-123',
      };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toHaveLength(1);
      }
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    it('should handle large number of addresses efficiently', async () => {
      // Create 100 addresses for the profile
      const addresses = Array.from({ length: 100 }, (_, index) =>
        createTestAddress({
          street: `Street ${index}`,
          number: `${index + 1}`,
        }),
      );
      addressRepo.items.push(...addresses);

      const start = Date.now();
      const request: FindAddressByProfileRequestDto = { profileId };
      const result = await sut.execute(request);
      const duration = Date.now() - start;

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toHaveLength(100);
      }
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle concurrent requests efficiently', async () => {
      const address = createTestAddress();
      addressRepo.items.push(address);

      const requests = Array(10)
        .fill(null)
        .map(() => ({ profileId }));
      const promises = requests.map((request) => sut.execute(request));

      const start = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - start;

      results.forEach((result) => {
        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value.addresses).toHaveLength(1);
        }
      });

      expect(duration).toBeLessThan(200); // All requests should complete within 200ms
    });
  });

  // Integration Tests
  describe('Integration Tests', () => {
    it('should work end-to-end with repository operations', async () => {
      const address = createTestAddress();

      // Simulate address creation through repository
      await addressRepo.create(address);

      // Now find it
      const request: FindAddressByProfileRequestDto = { profileId };
      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toHaveLength(1);
        expect(result.value.addresses[0].id).toBe(address.id.toString());
      }
    });

    it('should maintain consistency with repository state changes', async () => {
      const request: FindAddressByProfileRequestDto = { profileId };

      // Initially no addresses
      let result = await sut.execute(request);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toHaveLength(0);
      }

      // Add address
      const address = createTestAddress();
      addressRepo.items.push(address);

      // Should now find the address
      result = await sut.execute(request);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toHaveLength(1);
      }

      // Remove address
      addressRepo.items = [];

      // Should be empty again
      result = await sut.execute(request);
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.addresses).toHaveLength(0);
      }
    });
  });
});
