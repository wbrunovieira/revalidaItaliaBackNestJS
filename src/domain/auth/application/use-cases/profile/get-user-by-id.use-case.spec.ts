// src/domain/auth/application/use-cases/get-user-by-id.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetUserByIdUseCase } from './get-user-by-id.use-case';
import { IUserIdentityRepository } from '../../repositories/i-user-identity-repository';
import { IUserProfileRepository } from '../../repositories/i-user-profile-repository';
import { IUserAuthorizationRepository } from '../../repositories/i-user-authorization-repository';
// TODO: Update tests to use new separated entities (UserIdentity, UserProfile, UserAuthorization)
// import { User } from '../../enterprise/entities/user.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { InvalidInputError } from './errors/invalid-input-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { left, right } from '@/core/either';

describe('GetUserByIdUseCase', () => {
  let useCase: GetUserByIdUseCase;
  let mockIdentityRepo: IUserIdentityRepository;
  let mockProfileRepo: IUserProfileRepository;
  let mockAuthRepo: IUserAuthorizationRepository;

  // Use UUIDs válidos
  const validUserId = '550e8400-e29b-41d4-a716-446655440000';
  const validUserId2 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

  const mockUser = User.create(
    {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword123',
      cpf: '12345678900',
      phone: '11999999999',
      birthDate: new Date('1990-01-01'),
      profileImageUrl: 'https://example.com/avatar.jpg',
      role: 'student',
      lastLogin: new Date('2025-06-28T10:00:00Z'),
      createdAt: new Date('2025-01-01T10:00:00Z'),
      updatedAt: new Date('2025-06-28T10:00:00Z'),
    },
    new UniqueEntityID(validUserId),
  );

  beforeEach(() => {
    mockAccountRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByCpf: vi.fn(),
      findAll: vi.fn(),
      findUsers: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),

      updatePassword: vi.fn(),
    };

    useCase = new GetUserByIdUseCase(mockAccountRepo);
  });

  describe('Success cases', () => {
    it('should return user details when user exists', async () => {
      mockAccountRepo.findById = vi.fn().mockResolvedValue(right(mockUser));

      const result = await useCase.execute({ id: validUserId });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.user).toEqual({
          id: validUserId,
          name: 'John Doe',
          email: 'john@example.com',
          cpf: '12345678900',
          phone: '11999999999',
          birthDate: new Date('1990-01-01'),
          profileImageUrl: 'https://example.com/avatar.jpg',
          role: 'student',
          lastLogin: new Date('2025-06-28T10:00:00Z'),
          createdAt: new Date('2025-01-01T10:00:00Z'),
          updatedAt: new Date('2025-06-28T10:00:00Z'),
        });
      }

      expect(mockAccountRepo.findById).toHaveBeenCalledWith(validUserId);
      expect(mockAccountRepo.findById).toHaveBeenCalledTimes(1);
    });

    it('should return user without optional fields', async () => {
      const userWithoutOptionalFields = User.create(
        {
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'hashedPassword456',
          cpf: '87654321098', // CPF é obrigatório
          role: 'admin',
          createdAt: new Date('2025-01-01T10:00:00Z'),
          updatedAt: new Date('2025-06-28T10:00:00Z'),
          // Campos opcionais não incluídos: phone, birthDate, profileImageUrl, lastLogin
        },
        new UniqueEntityID(validUserId2),
      );

      mockAccountRepo.findById = vi
        .fn()
        .mockResolvedValue(right(userWithoutOptionalFields));

      const result = await useCase.execute({ id: validUserId2 });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.user).toEqual({
          id: validUserId2,
          name: 'Jane Doe',
          email: 'jane@example.com',
          cpf: '87654321098',
          phone: undefined,
          birthDate: undefined,
          profileImageUrl: undefined,
          role: 'admin',
          lastLogin: undefined,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          updatedAt: new Date('2025-06-28T10:00:00Z'),
        });
      }
    });
  });

  describe('Validation errors', () => {
    it('should return InvalidInputError when ID is not provided', async () => {
      const result = await useCase.execute({ id: '' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);

        // Type guard para acessar propriedades específicas de InvalidInputError
        if (result.value instanceof InvalidInputError) {
          expect(result.value.message).toBe('Validation failed');
          expect(result.value.details).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                message: expect.stringContaining('Invalid'),
                path: expect.arrayContaining(['id']),
              }),
            ]),
          );
        }
      }

      expect(mockAccountRepo.findById).not.toHaveBeenCalled();
    });

    it('should return InvalidInputError when ID is not a valid UUID', async () => {
      const result = await useCase.execute({ id: 'invalid-uuid' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);

        // Type guard para acessar propriedades específicas de InvalidInputError
        if (result.value instanceof InvalidInputError) {
          expect(result.value.message).toBe('Validation failed');
          expect(result.value.details).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                message: expect.stringContaining('Invalid'),
                path: expect.arrayContaining(['id']),
              }),
            ]),
          );
        }
      }

      expect(mockAccountRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe('Repository errors', () => {
    it('should return ResourceNotFoundError when user does not exist', async () => {
      mockAccountRepo.findById = vi
        .fn()
        .mockResolvedValue(left(new Error('User not found')));

      const result = await useCase.execute({
        id: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
        expect(result.value.message).toBe('User not found');
      }

      expect(mockAccountRepo.findById).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
      );
    });

    it('should return RepositoryError when repository fails with other error', async () => {
      mockAccountRepo.findById = vi
        .fn()
        .mockResolvedValue(left(new Error('Database connection failed')));

      const result = await useCase.execute({
        id: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Database connection failed');
      }
    });

    it('should return RepositoryError when repository throws exception', async () => {
      mockAccountRepo.findById = vi
        .fn()
        .mockRejectedValue(new Error('Unexpected error'));

      const result = await useCase.execute({
        id: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Unexpected error');
      }
    });

    it('should return ResourceNotFoundError when error contains "not found" in mixed case', async () => {
      mockAccountRepo.findById = vi
        .fn()
        .mockResolvedValue(left(new Error('USER NOT FOUND')));

      const result = await useCase.execute({
        id: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
        expect(result.value.message).toBe('User not found');
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle user with all fields populated', async () => {
      const fullUser = User.create(
        {
          name: 'Complete User',
          email: 'complete@example.com',
          password: 'hashedPassword789',
          cpf: '98765432100',
          phone: '+5511888888888',
          paymentToken: 'payment-token-123',
          birthDate: new Date('1985-05-15'),
          lastLogin: new Date('2025-06-28T15:30:00Z'),
          profileImageUrl: 'https://example.com/profile.png',
          role: 'tutor',
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2025-06-28T15:30:00Z'),
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000'),
      );

      mockAccountRepo.findById = vi.fn().mockResolvedValue(right(fullUser));

      const result = await useCase.execute({
        id: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.user.name).toBe('Complete User');
        expect(result.value.user.role).toBe('tutor');
        expect(result.value.user.phone).toBe('+5511888888888');
      }
    });
  });
});
