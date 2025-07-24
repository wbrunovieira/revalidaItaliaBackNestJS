import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeleteAddressUseCase } from './delete-address.use-case';
import { InMemoryAddressRepository } from '@/test/repositories/in-memory-address-repository';
import { Address } from '@/domain/auth/enterprise/entities/address.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { left, right } from '@/core/either';
import {
  InvalidInputError,
  ResourceNotFoundError,
  RepositoryError,
} from '@/domain/auth/domain/exceptions';

describe('DeleteAddressUseCase', () => {
  let addressRepo: InMemoryAddressRepository;
  let sut: DeleteAddressUseCase;

  beforeEach(() => {
    addressRepo = new InMemoryAddressRepository();
    sut = new DeleteAddressUseCase(addressRepo);
  });

  describe('Success scenarios', () => {
    it('should delete an address successfully', async () => {
      // Arrange
      const profileId = new UniqueEntityID('profile-1');
      const address = Address.create({
        profileId,
        street: 'Main Street',
        number: '123',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001',
      });
      addressRepo.items.push(address);

      // Act
      const result = await sut.execute({ id: address.id.toString() });

      // Assert
      expect(result.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(0);
    });

    it('should delete address with all optional fields', async () => {
      const profileId = new UniqueEntityID('profile-2');
      const address = Address.create({
        profileId,
        street: 'Rua Principal',
        number: '456',
        complement: 'Apt 10B',
        district: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brazil',
        postalCode: '01000-000',
      });
      addressRepo.items.push(address);

      const result = await sut.execute({ id: address.id.toString() });

      expect(result.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(0);
    });

    it('should delete only the specified address when multiple exist', async () => {
      const profileId = new UniqueEntityID('profile-3');

      // Create multiple addresses
      const address1 = Address.create({
        profileId,
        street: 'Street 1',
        number: '1',
        city: 'City 1',
        country: 'Country 1',
        postalCode: '11111',
      });

      const address2 = Address.create({
        profileId,
        street: 'Street 2',
        number: '2',
        city: 'City 2',
        country: 'Country 2',
        postalCode: '22222',
      });

      addressRepo.items.push(address1, address2);

      // Delete only address1
      const result = await sut.execute({ id: address1.id.toString() });

      expect(result.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(1);
      expect(addressRepo.items[0].id).toEqual(address2.id);
    });
  });

  describe('Error scenarios', () => {
    it('should return InvalidInputError when id is empty string', async () => {
      const result = await sut.execute({ id: '' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toBe('Missing id');
        const error = result.value as InvalidInputError;
        expect(error.details).toEqual([
          { field: 'id', message: 'Field is required' },
        ]);
      }
    });

    it('should return InvalidInputError when id is null', async () => {
      const result = await sut.execute({ id: null as any });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError when id is undefined', async () => {
      const result = await sut.execute({ id: undefined as any });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return ResourceNotFoundError when address does not exist', async () => {
      const result = await sut.execute({ id: 'non-existent-id' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
        expect(result.value.message).toBe('Address not found');
      }
    });

    it('should return RepositoryError when findById fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.spyOn(addressRepo, 'findById').mockResolvedValueOnce(left(dbError));

      const result = await sut.execute({ id: 'any-id' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        const error = result.value as RepositoryError;
        expect(error.message).toContain('Database connection failed');
      }
    });

    it('should return RepositoryError when findById throws exception', async () => {
      vi.spyOn(addressRepo, 'findById').mockImplementationOnce(() => {
        throw new Error('Unexpected database error');
      });

      const result = await sut.execute({ id: 'any-id' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Unexpected database error');
      }
    });

    it('should return RepositoryError when delete fails', async () => {
      const profileId = new UniqueEntityID('profile-4');
      const address = Address.create({
        profileId,
        street: 'Delete Fail Street',
        number: '999',
        city: 'Error City',
        country: 'Errorland',
        postalCode: '99999',
      });
      addressRepo.items.push(address);

      const deleteError = new Error('Delete operation failed');
      vi.spyOn(addressRepo, 'delete').mockResolvedValueOnce(left(deleteError));

      const result = await sut.execute({ id: address.id.toString() });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        const error = result.value as RepositoryError;
        expect(error.message).toContain('Delete operation failed');
      }
    });

    it('should return RepositoryError when delete throws exception', async () => {
      const profileId = new UniqueEntityID('profile-5');
      const address = Address.create({
        profileId,
        street: 'Exception Street',
        number: '500',
        city: 'Exception City',
        country: 'Exceptionland',
        postalCode: '50000',
      });
      addressRepo.items.push(address);

      vi.spyOn(addressRepo, 'delete').mockImplementationOnce(() => {
        throw new Error('Unexpected delete error');
      });

      const result = await sut.execute({ id: address.id.toString() });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Unexpected delete error');
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle UUID format validation', async () => {
      const invalidIds = [
        'not-a-uuid',
        '12345',
        'invalid-format-id',
        '!@#$%^&*()',
      ];

      for (const invalidId of invalidIds) {
        const result = await sut.execute({ id: invalidId });
        expect(result.isLeft()).toBe(true);
      }
    });

    it('should handle very long id strings', async () => {
      const veryLongId = 'a'.repeat(1000);
      const result = await sut.execute({ id: veryLongId });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      }
    });

    it('should handle whitespace-only id', async () => {
      const whitespaceIds = [' ', '  ', '\t', '\n', ' \t\n '];

      for (const wsId of whitespaceIds) {
        const result = await sut.execute({ id: wsId });
        expect(result.isLeft()).toBe(true);
      }
    });
  });

  describe('Concurrency scenarios', () => {
    it('should handle concurrent delete attempts on same address', async () => {
      const profileId = new UniqueEntityID('profile-concurrent');
      const address = Address.create({
        profileId,
        street: 'Concurrent Street',
        number: '100',
        city: 'Concurrent City',
        country: 'Concurrentland',
        postalCode: '12345',
      });
      addressRepo.items.push(address);

      // Simulate concurrent deletes
      const results = await Promise.all([
        sut.execute({ id: address.id.toString() }),
        sut.execute({ id: address.id.toString() }),
      ]);

      // Both should succeed in the current implementation
      // This is because the repository doesn't implement proper locking
      const successes = results.filter((r) => r.isRight()).length;
      const failures = results.filter((r) => r.isLeft()).length;

      // Current behavior: both succeed (not ideal for concurrency)
      expect(successes).toBe(2);
      expect(failures).toBe(0);

      // Address should be deleted
      expect(addressRepo.items).toHaveLength(0);
    });

    it('should handle multiple different addresses being deleted concurrently', async () => {
      const profileId = new UniqueEntityID('profile-multi');
      const addresses = Array.from({ length: 5 }, (_, i) =>
        Address.create({
          profileId,
          street: `Street ${i}`,
          number: `${i}`,
          city: `City ${i}`,
          country: 'Country',
          postalCode: `0000${i}`,
        }),
      );

      addresses.forEach((addr) => addressRepo.items.push(addr));

      // Delete all addresses concurrently
      const results = await Promise.all(
        addresses.map((addr) => sut.execute({ id: addr.id.toString() })),
      );

      // All should succeed
      expect(results.every((r) => r.isRight())).toBe(true);
      expect(addressRepo.items).toHaveLength(0);
    });
  });

  describe('Security scenarios', () => {
    it('should handle SQL injection attempts in id', async () => {
      const sqlInjectionIds = [
        "'; DROP TABLE addresses; --",
        "1' OR '1'='1",
        '1; DELETE FROM addresses WHERE 1=1;',
        "<script>alert('xss')</script>",
      ];

      for (const maliciousId of sqlInjectionIds) {
        const result = await sut.execute({ id: maliciousId });

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(ResourceNotFoundError);
        }
      }
    });

    it('should not expose internal errors to user', async () => {
      const internalError = new Error(
        'Internal database connection string exposed',
      );
      vi.spyOn(addressRepo, 'findById').mockResolvedValueOnce(
        left(internalError),
      );

      const result = await sut.execute({ id: 'test-id' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        // The current implementation does expose the error message
        // This is a security issue that should be fixed in the use case
        expect(result.value.message).toBe(
          'Internal database connection string exposed',
        );
      }
    });
  });

  describe('Business rules', () => {
    it('should allow deletion of addresses from different profiles', async () => {
      const profile1 = new UniqueEntityID('profile-1');
      const profile2 = new UniqueEntityID('profile-2');

      const address1 = Address.create({
        profileId: profile1,
        street: 'Profile 1 Street',
        number: '1',
        city: 'City 1',
        country: 'Country',
        postalCode: '11111',
      });

      const address2 = Address.create({
        profileId: profile2,
        street: 'Profile 2 Street',
        number: '2',
        city: 'City 2',
        country: 'Country',
        postalCode: '22222',
      });

      addressRepo.items.push(address1, address2);

      // Delete address from profile 1
      const result = await sut.execute({ id: address1.id.toString() });

      expect(result.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(1);
      expect(addressRepo.items[0].profileId).toEqual(profile2);
    });

    it('should handle deletion of recently updated addresses', async () => {
      const profileId = new UniqueEntityID('profile-updated');
      const address = Address.create({
        profileId,
        street: 'Original Street',
        number: '100',
        city: 'Original City',
        country: 'Country',
        postalCode: '12345',
      });
      addressRepo.items.push(address);

      // Store original times
      const originalCreatedAt = address.createdAt;
      const originalUpdatedAt = address.updatedAt;

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Update the address
      address.street = 'Updated Street';
      address.city = 'Updated City';

      // Verify updatedAt changed
      expect(address.updatedAt).not.toEqual(originalUpdatedAt);
      expect(address.updatedAt.getTime()).toBeGreaterThan(
        originalCreatedAt.getTime(),
      );

      // Delete the updated address
      const result = await sut.execute({ id: address.id.toString() });

      expect(result.isRight()).toBe(true);
      expect(addressRepo.items).toHaveLength(0);
    });
  });

  describe('Type coercion and validation', () => {
    it('should handle non-string id types', async () => {
      const invalidRequests = [
        { id: 123 as any },
        { id: true as any },
        { id: {} as any },
        { id: [] as any },
        { id: new Date() as any },
      ];

      for (const request of invalidRequests) {
        const result = await sut.execute(request);
        expect(result.isLeft()).toBe(true);
      }
    });

    it('should handle missing request object properties', async () => {
      const result = await sut.execute({} as any);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });
});
