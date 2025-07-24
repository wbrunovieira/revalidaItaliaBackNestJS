// src/domain/auth/application/use-cases/update-address.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateAddressUseCase } from './update-address.use-case';
import { InMemoryAddressRepository } from '@/test/repositories/in-memory-address-repository';
import { UpdateAddressRequestDto } from '../dtos/update-address-request.dto';
import { Address } from '@/domain/auth/enterprise/entities/address.entity';
import {
  ResourceNotFoundError,
  RepositoryError,
} from '@/domain/auth/domain/exceptions';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left } from '@/core/either';

describe('UpdateAddressUseCase', () => {
  let addressRepo: InMemoryAddressRepository;
  let sut: UpdateAddressUseCase;

  const profileId = new UniqueEntityID('profile-123');
  const now = new Date();

  beforeEach(() => {
    addressRepo = new InMemoryAddressRepository();
    sut = new UpdateAddressUseCase(addressRepo);
  });

  const createTestAddress = (overrides = {}) => {
    return Address.create({
      profileId,
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
    it('should update address successfully with all fields', async () => {
      const address = createTestAddress();
      addressRepo.items.push(address);

      const request: UpdateAddressRequestDto = {
        id: address.id.toString(),
        street: 'Via Milano',
        number: '456',
        complement: 'Apt 2A',
        district: 'Navigli',
        city: 'Roma',
        state: 'Lazio',
        country: 'Francia',
        postalCode: '00100',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.id).toBe(address.id.toString());
        expect(result.value.street).toBe('Via Milano');
        expect(result.value.number).toBe('456');
        expect(result.value.complement).toBe('Apt 2A');
        expect(result.value.district).toBe('Navigli');
        expect(result.value.city).toBe('Roma');
        expect(result.value.state).toBe('Lazio');
        expect(result.value.country).toBe('Francia');
        expect(result.value.postalCode).toBe('00100');
        expect(result.value.createdAt).toBe(address.createdAt);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }

      // Verify the address was actually updated in the repository
      const updatedAddress = addressRepo.items[0];
      expect(updatedAddress.street).toBe('Via Milano');
      expect(updatedAddress.number).toBe('456');
      expect(updatedAddress.city).toBe('Roma');
    });

    it('should update address with only some fields', async () => {
      const address = createTestAddress();
      addressRepo.items.push(address);

      const request: UpdateAddressRequestDto = {
        id: address.id.toString(),
        street: 'Via Torino',
        city: 'Napoli',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.street).toBe('Via Torino');
        expect(result.value.city).toBe('Napoli');
        // Other fields should remain unchanged
        expect(result.value.number).toBe('123');
        expect(result.value.complement).toBe('Apt 4B');
        expect(result.value.district).toBe('Centro');
        expect(result.value.state).toBe('Lombardia');
        expect(result.value.country).toBe('Italia');
        expect(result.value.postalCode).toBe('20121');
      }
    });

    it('should update address with null values for optional fields', async () => {
      const address = createTestAddress();
      addressRepo.items.push(address);

      const request: UpdateAddressRequestDto = {
        id: address.id.toString(),
        complement: null,
        district: null,
        state: null,
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.complement).toBeNull();
        expect(result.value.district).toBeNull();
        expect(result.value.state).toBeNull();
        // Other fields should remain unchanged
        expect(result.value.street).toBe('Via Roma');
        expect(result.value.city).toBe('Milano');
      }

      // Verify in repository
      const updatedAddress = addressRepo.items[0];
      expect(updatedAddress.complement).toBeNull();
      expect(updatedAddress.district).toBeNull();
      expect(updatedAddress.state).toBeNull();
    });

    it('should update updatedAt timestamp when address is modified', async () => {
      const address = createTestAddress();
      const originalUpdatedAt = address.updatedAt;
      addressRepo.items.push(address);

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 1));

      const request: UpdateAddressRequestDto = {
        id: address.id.toString(),
        street: 'Updated Street',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      }
    });

    it('should preserve createdAt timestamp when updating', async () => {
      const address = createTestAddress();
      const originalCreatedAt = address.createdAt;
      addressRepo.items.push(address);

      const request: UpdateAddressRequestDto = {
        id: address.id.toString(),
        street: 'Updated Street',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.createdAt).toBe(originalCreatedAt);
      }
    });
  });

  // Error Cases
  describe('Error Cases', () => {
    describe('Resource Not Found Errors', () => {
      it('should fail when address does not exist', async () => {
        const request: UpdateAddressRequestDto = {
          id: 'non-existent-id',
          street: 'New Street',
        };

        const result = await sut.execute(request);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(ResourceNotFoundError);
          expect(result.value.message).toBe('Address not found');
        }
      });

      it('should fail when findById returns undefined', async () => {
        vi.spyOn(addressRepo, 'findById').mockResolvedValueOnce({
          isLeft: () => false,
          isRight: () => true,
          value: undefined,
        } as any);

        const request: UpdateAddressRequestDto = {
          id: 'some-id',
          street: 'New Street',
        };

        const result = await sut.execute(request);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(ResourceNotFoundError);
        }
      });
    });

    describe('Repository Errors', () => {
      it('should fail when repository findById returns left', async () => {
        const repositoryError = new Error('Database connection failed');
        vi.spyOn(addressRepo, 'findById').mockResolvedValueOnce(
          left(repositoryError),
        );

        const request: UpdateAddressRequestDto = {
          id: 'some-id',
          street: 'New Street',
        };

        const result = await sut.execute(request);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(RepositoryError);
          expect(result.value.message).toBe(repositoryError.message);
        }
      });

      it('should fail when repository findById throws exception', async () => {
        const error = new Error('Unexpected database error');
        vi.spyOn(addressRepo, 'findById').mockRejectedValueOnce(error);

        const request: UpdateAddressRequestDto = {
          id: 'some-id',
          street: 'New Street',
        };

        const result = await sut.execute(request);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(RepositoryError);
          expect(result.value.message).toBe(error.message);
        }
      });

      it('should fail when repository update returns left', async () => {
        const address = createTestAddress();
        addressRepo.items.push(address);

        const updateError = new Error('Update failed');
        vi.spyOn(addressRepo, 'update').mockResolvedValueOnce(
          left(updateError),
        );

        const request: UpdateAddressRequestDto = {
          id: address.id.toString(),
          street: 'New Street',
        };

        const result = await sut.execute(request);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(RepositoryError);
          expect(result.value.message).toBe(updateError.message);
        }
      });

      it('should fail when repository update throws exception', async () => {
        const address = createTestAddress();
        addressRepo.items.push(address);

        const error = new Error('Database constraint violation');
        vi.spyOn(addressRepo, 'update').mockRejectedValueOnce(error);

        const request: UpdateAddressRequestDto = {
          id: address.id.toString(),
          street: 'New Street',
        };

        const result = await sut.execute(request);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(RepositoryError);
          expect(result.value.message).toBe(error.message);
        }
      });
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle very long field values', async () => {
      const address = createTestAddress();
      addressRepo.items.push(address);

      const longStreet = 'A'.repeat(255);
      const longComplement = 'B'.repeat(255);

      const request: UpdateAddressRequestDto = {
        id: address.id.toString(),
        street: longStreet,
        complement: longComplement,
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.street).toBe(longStreet);
        expect(result.value.complement).toBe(longComplement);
      }
    });

    it('should handle special characters in address fields', async () => {
      const address = createTestAddress();
      addressRepo.items.push(address);

      const request: UpdateAddressRequestDto = {
        id: address.id.toString(),
        street: 'Rua São José & Cia. #123',
        complement: 'Bloco C - Apt° 45 (Térreo)',
        district: 'Bairro São João & Maria',
        city: 'São Paulo',
        state: 'São Paulo (SP)',
        postalCode: '01234-567',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.street).toBe('Rua São José & Cia. #123');
        expect(result.value.complement).toBe('Bloco C - Apt° 45 (Térreo)');
        expect(result.value.postalCode).toBe('01234-567');
      }
    });

    it('should handle empty strings for optional fields', async () => {
      const address = createTestAddress();
      addressRepo.items.push(address);

      const request: UpdateAddressRequestDto = {
        id: address.id.toString(),
        country: '',
        postalCode: '',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.country).toBe('');
        expect(result.value.postalCode).toBe('');
      }
    });

    it('should handle UUID format address IDs', async () => {
      const address = createTestAddress();
      addressRepo.items.push(address);

      const request: UpdateAddressRequestDto = {
        id: address.id.toString(),
        street: 'Updated Street',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.id).toBe(address.id.toString());
        expect(result.value.street).toBe('Updated Street');
      }
    });

    it('should handle whitespace in address fields', async () => {
      const address = createTestAddress();
      addressRepo.items.push(address);

      const request: UpdateAddressRequestDto = {
        id: address.id.toString(),
        street: '  Via Roma  ',
        number: '  123  ',
        city: '  Milano  ',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Values are stored as-is (trimming would be handled at controller/DTO level)
        expect(result.value.street).toBe('  Via Roma  ');
        expect(result.value.number).toBe('  123  ');
        expect(result.value.city).toBe('  Milano  ');
      }
    });
  });

  // Business Rules
  describe('Business Rules', () => {
    it('should only update the specified address', async () => {
      const address1 = createTestAddress({ street: 'Street 1' });
      const address2 = createTestAddress({ street: 'Street 2' });

      addressRepo.items.push(address1, address2);

      const request: UpdateAddressRequestDto = {
        id: address1.id.toString(),
        street: 'Updated Street 1',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);

      // Verify only the first address was updated
      expect(addressRepo.items[0].street).toBe('Updated Street 1');
      expect(addressRepo.items[1].street).toBe('Street 2'); // Unchanged
    });

    it('should maintain data integrity during partial updates', async () => {
      const address = createTestAddress();
      const originalStreet = address.street;
      const originalNumber = address.number;

      addressRepo.items.push(address);

      const request: UpdateAddressRequestDto = {
        id: address.id.toString(),
        city: 'New City',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Updated field
        expect(result.value.city).toBe('New City');
        // Unchanged fields
        expect(result.value.street).toBe(originalStreet);
        expect(result.value.number).toBe(originalNumber);
      }
    });

    it('should handle concurrent update attempts gracefully', async () => {
      const address = createTestAddress();
      addressRepo.items.push(address);

      const request1: UpdateAddressRequestDto = {
        id: address.id.toString(),
        street: 'Updated by Request 1',
      };

      const request2: UpdateAddressRequestDto = {
        id: address.id.toString(),
        street: 'Updated by Request 2',
      };

      // Execute both requests concurrently
      const [result1, result2] = await Promise.all([
        sut.execute(request1),
        sut.execute(request2),
      ]);

      expect(result1.isRight()).toBe(true);
      expect(result2.isRight()).toBe(true);

      // One of the updates should have succeeded
      const finalAddress = addressRepo.items[0];
      expect(['Updated by Request 1', 'Updated by Request 2']).toContain(
        finalAddress.street,
      );
    });

    it('should not allow updating non-existent fields', async () => {
      const address = createTestAddress();
      addressRepo.items.push(address);

      const requestWithInvalidField = {
        id: address.id.toString(),
        street: 'New Street',
        invalidField: 'Should be ignored',
      } as any;

      const result = await sut.execute(requestWithInvalidField);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.street).toBe('New Street');
        expect(result.value).not.toHaveProperty('invalidField');
      }
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    it('should complete update operation within reasonable time', async () => {
      const address = createTestAddress();
      addressRepo.items.push(address);

      const start = Date.now();

      const request: UpdateAddressRequestDto = {
        id: address.id.toString(),
        street: 'Performance Test Street',
      };

      const result = await sut.execute(request);
      const duration = Date.now() - start;

      expect(result.isRight()).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle multiple sequential updates efficiently', async () => {
      const address = createTestAddress();
      addressRepo.items.push(address);

      const updates = [
        { street: 'Update 1' },
        { city: 'Update 2' },
        { number: 'Update 3' },
        { postalCode: 'Update 4' },
        { state: 'Update 5' },
      ];

      const start = Date.now();

      for (let i = 0; i < updates.length; i++) {
        const request: UpdateAddressRequestDto = {
          id: address.id.toString(),
          ...updates[i],
        };

        const result = await sut.execute(request);
        expect(result.isRight()).toBe(true);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500); // All updates should complete within 500ms
    });
  });

  // Integration Tests
  describe('Integration Tests', () => {
    it('should work end-to-end with repository operations', async () => {
      const address = createTestAddress();

      // Add to repository
      await addressRepo.create(address);

      // Update through use case
      const request: UpdateAddressRequestDto = {
        id: address.id.toString(),
        street: 'Integration Test Street',
        city: 'Integration Test City',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.street).toBe('Integration Test Street');
        expect(result.value.city).toBe('Integration Test City');
      }

      // Verify through repository
      const findResult = await addressRepo.findById(address.id.toString());
      expect(findResult.isRight()).toBe(true);
      if (findResult.isRight() && findResult.value) {
        expect(findResult.value.street).toBe('Integration Test Street');
        expect(findResult.value.city).toBe('Integration Test City');
      }
    });

    it('should maintain repository consistency after updates', async () => {
      const address = createTestAddress();
      addressRepo.items.push(address);
      const originalLength = addressRepo.items.length;

      const request: UpdateAddressRequestDto = {
        id: address.id.toString(),
        street: 'Consistency Test Street',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(originalLength); // No new items added
      expect(addressRepo.items[0].id).toBe(address.id); // Same address updated
    });

    it('should handle DTO to entity mapping correctly', async () => {
      const address = createTestAddress();
      addressRepo.items.push(address);

      const request: UpdateAddressRequestDto = {
        id: address.id.toString(),
        street: 'DTO Mapping Test',
        complement: 'Suite 100',
        district: 'Business District',
      };

      const result = await sut.execute(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Verify all DTO fields are properly mapped to response
        expect(result.value).toHaveProperty('id');
        expect(result.value).toHaveProperty('street');
        expect(result.value).toHaveProperty('number');
        expect(result.value).toHaveProperty('complement');
        expect(result.value).toHaveProperty('district');
        expect(result.value).toHaveProperty('city');
        expect(result.value).toHaveProperty('state');
        expect(result.value).toHaveProperty('country');
        expect(result.value).toHaveProperty('postalCode');
        expect(result.value).toHaveProperty('createdAt');
        expect(result.value).toHaveProperty('updatedAt');

        expect(result.value.street).toBe('DTO Mapping Test');
        expect(result.value.complement).toBe('Suite 100');
        expect(result.value.district).toBe('Business District');
      }
    });
  });
});
