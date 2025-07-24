// src/infra/controllers/user.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';

import { UserController } from './user.controller';
import { CreateUserUseCase } from '@/domain/auth/application/use-cases/profile/create-user.use-case';
import { UpdateUserUseCase } from '@/domain/auth/application/use-cases/profile/update-user.use-case';
import { ListUsersUseCase } from '@/domain/auth/application/use-cases/profile/list-users.use-case';
import { FindUsersUseCase } from '@/domain/auth/application/use-cases/profile/find-users.use-case';
import { GetUserByIdUseCase } from '@/domain/auth/application/use-cases/profile/get-user-by-id.use-case';
import { DeleteUserUseCase } from '@/domain/auth/application/use-cases/profile/delete-user.use-case';

// Error types
import {
  InvalidInputError,
  DuplicateEmailError,
  DuplicateNationalIdError,
  ResourceNotFoundError,
  RepositoryError,
  UnauthorizedError,
} from '@/domain/auth/domain/exceptions';

import { right, left } from '@/core/either';

// Guards
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

// Mock the use cases
vi.mock('@/domain/auth/application/use-cases/profile/create-user.use-case');
vi.mock('@/domain/auth/application/use-cases/profile/update-user.use-case');
vi.mock('@/domain/auth/application/use-cases/profile/list-users.use-case');
vi.mock('@/domain/auth/application/use-cases/profile/find-users.use-case');
vi.mock('@/domain/auth/application/use-cases/profile/get-user-by-id.use-case');
vi.mock('@/domain/auth/application/use-cases/profile/delete-user.use-case');

describe('UserController', () => {
  let controller: UserController;
  let createUserUseCase: CreateUserUseCase;
  let updateUserUseCase: UpdateUserUseCase;
  let listUsersUseCase: ListUsersUseCase;
  let findUsersUseCase: FindUsersUseCase;
  let getUserByIdUseCase: GetUserByIdUseCase;
  let deleteUserUseCase: DeleteUserUseCase;

  const mockUserId = 'user-123-uuid';
  const mockDate = new Date('2024-01-01T00:00:00Z');

  const mockCreateUserDto = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123!',
    nationalId: '12345678901',
    role: 'student' as const,
    source: 'admin',
  };

  const mockUpdateUserDto = {
    name: 'John Updated',
    email: 'john.updated@example.com',
    nationalId: '10987654321',
    role: 'tutor' as const,
  };

  const mockListUsersDto = {
    page: 1,
    pageSize: 20,
  };

  const mockFindUsersDto = {
    email: 'search@example.com',
    name: 'Search User',
    role: 'student',
    page: 1,
    limit: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: CreateUserUseCase,
          useValue: {
            execute: vi.fn(),
          },
        },
        {
          provide: UpdateUserUseCase,
          useValue: {
            execute: vi.fn(),
          },
        },
        {
          provide: ListUsersUseCase,
          useValue: {
            execute: vi.fn(),
          },
        },
        {
          provide: FindUsersUseCase,
          useValue: {
            execute: vi.fn(),
          },
        },
        {
          provide: GetUserByIdUseCase,
          useValue: {
            execute: vi.fn(),
          },
        },
        {
          provide: DeleteUserUseCase,
          useValue: {
            execute: vi.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    createUserUseCase = module.get<CreateUserUseCase>(CreateUserUseCase);
    updateUserUseCase = module.get<UpdateUserUseCase>(UpdateUserUseCase);
    listUsersUseCase = module.get<ListUsersUseCase>(ListUsersUseCase);
    findUsersUseCase = module.get<FindUsersUseCase>(FindUsersUseCase);
    getUserByIdUseCase = module.get<GetUserByIdUseCase>(GetUserByIdUseCase);
    deleteUserUseCase = module.get<DeleteUserUseCase>(DeleteUserUseCase);
  });

  describe('create()', () => {
    const mockCreateUserResponse = {
      identityId: mockUserId,
      profileId: 'profile-123',
      authorizationId: 'auth-123',
      email: 'john@example.com',
      fullName: 'John Doe',
      role: 'student',
    };

    it('should create a new user successfully', async () => {
      vi.mocked(createUserUseCase.execute).mockResolvedValueOnce(
        right(mockCreateUserResponse),
      );

      const result = await controller.create(mockCreateUserDto);

      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        email: mockCreateUserDto.email,
        password: mockCreateUserDto.password,
        fullName: mockCreateUserDto.name,
        nationalId: mockCreateUserDto.nationalId,
        role: mockCreateUserDto.role,
        source: mockCreateUserDto.source,
      });
      expect(result).toEqual(mockCreateUserResponse);
    });

    it('should create user with default source when not provided', async () => {
      const { source, ...dtoWithoutSource } = mockCreateUserDto;

      vi.mocked(createUserUseCase.execute).mockResolvedValueOnce(
        right(mockCreateUserResponse),
      );

      await controller.create(dtoWithoutSource);

      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        email: dtoWithoutSource.email,
        password: dtoWithoutSource.password,
        fullName: dtoWithoutSource.name,
        nationalId: dtoWithoutSource.nationalId,
        role: dtoWithoutSource.role,
        source: 'admin', // Default source
      });
    });

    it('should throw InvalidInputError when validation fails', async () => {
      const invalidInputError = new InvalidInputError(
        'Invalid input data',
        [{ field: 'email', message: 'Invalid email format' }],
      );

      vi.mocked(createUserUseCase.execute).mockResolvedValueOnce(
        left(invalidInputError),
      );

      await expect(controller.create(mockCreateUserDto)).rejects.toThrow(
        invalidInputError,
      );
    });

    it('should throw DuplicateEmailError when email already exists', async () => {
      const duplicateEmailError = new DuplicateEmailError('john@example.com');

      vi.mocked(createUserUseCase.execute).mockResolvedValueOnce(
        left(duplicateEmailError),
      );

      await expect(controller.create(mockCreateUserDto)).rejects.toThrow(
        duplicateEmailError,
      );
    });

    it('should throw DuplicateNationalIdError when national ID already exists', async () => {
      const duplicateNationalIdError = new DuplicateNationalIdError('12345678901');

      vi.mocked(createUserUseCase.execute).mockResolvedValueOnce(
        left(duplicateNationalIdError),
      );

      await expect(controller.create(mockCreateUserDto)).rejects.toThrow(
        duplicateNationalIdError,
      );
    });

    it('should handle different user roles correctly', async () => {
      const roles = ['admin', 'tutor', 'student'] as const;

      for (const role of roles) {
        const dtoWithRole = { ...mockCreateUserDto, role };
        const responseWithRole = { ...mockCreateUserResponse, role };

        vi.mocked(createUserUseCase.execute).mockResolvedValueOnce(
          right(responseWithRole),
        );

        const result = await controller.create(dtoWithRole);

        expect(createUserUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ role }),
        );
        expect(result.role).toBe(role);
      }
    });
  });

  describe('update()', () => {
    const mockUpdateUserResponse = {
      identity: {
        id: mockUserId,
        email: 'john.updated@example.com',
      },
      profile: {
        fullName: 'John Updated',
        nationalId: '10987654321',
      },
      authorization: {
        role: 'tutor',
      },
    };

    it('should update user successfully', async () => {
      vi.mocked(updateUserUseCase.execute).mockResolvedValueOnce(
        right(mockUpdateUserResponse),
      );

      const result = await controller.update(mockUserId, mockUpdateUserDto);

      expect(updateUserUseCase.execute).toHaveBeenCalledWith({
        id: mockUserId,
        ...mockUpdateUserDto,
      });
      expect(result).toEqual(mockUpdateUserResponse);
    });

    it('should handle partial updates', async () => {
      const partialUpdateDto = {
        name: 'John Partial Update',
      };

      vi.mocked(updateUserUseCase.execute).mockResolvedValueOnce(
        right({
          ...mockUpdateUserResponse,
          profile: {
            ...mockUpdateUserResponse.profile,
            fullName: partialUpdateDto.name,
          },
        }),
      );

      const result = await controller.update(mockUserId, partialUpdateDto);

      expect(updateUserUseCase.execute).toHaveBeenCalledWith({
        id: mockUserId,
        ...partialUpdateDto,
      });
      expect(result.profile.fullName).toBe(partialUpdateDto.name);
    });

    it('should throw InvalidInputError when no fields provided for update', async () => {
      const invalidInputError = new InvalidInputError(
        'At least one field must be provided for update',
        [],
      );

      vi.mocked(updateUserUseCase.execute).mockResolvedValueOnce(
        left(invalidInputError),
      );

      await expect(
        controller.update(mockUserId, {}),
      ).rejects.toThrow(invalidInputError);
    });

    it('should throw ResourceNotFoundError when user not found', async () => {
      const resourceNotFoundError = new ResourceNotFoundError('User', { id: mockUserId });

      vi.mocked(updateUserUseCase.execute).mockResolvedValueOnce(
        left(resourceNotFoundError),
      );

      await expect(
        controller.update(mockUserId, mockUpdateUserDto),
      ).rejects.toThrow(resourceNotFoundError);
    });

    it('should throw DuplicateEmailError when updated email already exists', async () => {
      const duplicateEmailError = new DuplicateEmailError('john.updated@example.com');

      vi.mocked(updateUserUseCase.execute).mockResolvedValueOnce(
        left(duplicateEmailError),
      );

      await expect(
        controller.update(mockUserId, mockUpdateUserDto),
      ).rejects.toThrow(duplicateEmailError);
    });

    it('should throw DuplicateNationalIdError when updated national ID already exists', async () => {
      const duplicateNationalIdError = new DuplicateNationalIdError('10987654321');

      vi.mocked(updateUserUseCase.execute).mockResolvedValueOnce(
        left(duplicateNationalIdError),
      );

      await expect(
        controller.update(mockUserId, mockUpdateUserDto),
      ).rejects.toThrow(duplicateNationalIdError);
    });

    it('should throw RepositoryError on database failure', async () => {
      const repositoryError = new RepositoryError('Database connection failed');

      vi.mocked(updateUserUseCase.execute).mockResolvedValueOnce(
        left(repositoryError),
      );

      await expect(
        controller.update(mockUserId, mockUpdateUserDto),
      ).rejects.toThrow(repositoryError);
    });
  });

  describe('list()', () => {
    const mockUserListItem = {
      identityId: mockUserId,
      email: 'john@example.com',
      emailVerified: true,
      fullName: 'John Doe',
      nationalId: '12345678901',
      phone: '+5511999999999',
      profileImageUrl: 'https://example.com/avatar.jpg',
      bio: 'Software developer',
      profession: 'Developer',
      specialization: 'Frontend',
      role: 'student',
      isActive: true,
      lastLogin: mockDate,
      createdAt: mockDate,
    };

    const mockListUsersResponse = {
      items: [mockUserListItem],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    it('should list users successfully with default pagination', async () => {
      vi.mocked(listUsersUseCase.execute).mockResolvedValueOnce(
        right(mockListUsersResponse),
      );

      const result = await controller.list(mockListUsersDto);

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        page: mockListUsersDto.page,
        limit: mockListUsersDto.pageSize,
      });
      expect(result).toEqual(mockListUsersResponse);
    });

    it('should handle custom pagination parameters', async () => {
      const customPaginationDto = { page: 2, pageSize: 10 };
      const customResponse = {
        ...mockListUsersResponse,
        page: 2,
        limit: 10,
      };

      vi.mocked(listUsersUseCase.execute).mockResolvedValueOnce(
        right(customResponse),
      );

      const result = await controller.list(customPaginationDto);

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('should handle empty user list', async () => {
      const emptyResponse = {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      vi.mocked(listUsersUseCase.execute).mockResolvedValueOnce(
        right(emptyResponse),
      );

      const result = await controller.list(mockListUsersDto);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should throw InvalidInputError on invalid pagination parameters', async () => {
      const invalidInputError = new InvalidInputError(
        'Invalid pagination parameters',
        [{ field: 'page', message: 'Page must be greater than 0' }],
      );

      vi.mocked(listUsersUseCase.execute).mockResolvedValueOnce(
        left(invalidInputError),
      );

      await expect(controller.list(mockListUsersDto)).rejects.toThrow(
        invalidInputError,
      );
    });

    it('should throw RepositoryError on database failure', async () => {
      const repositoryError = new RepositoryError('Database query failed');

      vi.mocked(listUsersUseCase.execute).mockResolvedValueOnce(
        left(repositoryError),
      );

      await expect(controller.list(mockListUsersDto)).rejects.toThrow(
        repositoryError,
      );
    });

    it('should handle large pagination correctly', async () => {
      const largePaginationDto = { page: 10, pageSize: 100 };
      const largeResponse = {
        ...mockListUsersResponse,
        page: 10,
        limit: 100,
        total: 950,
        totalPages: 10,
      };

      vi.mocked(listUsersUseCase.execute).mockResolvedValueOnce(
        right(largeResponse),
      );

      const result = await controller.list(largePaginationDto);

      expect(result.page).toBe(10);
      expect(result.limit).toBe(100);
      expect(result.totalPages).toBe(10);
    });
  });

  describe('find()', () => {
    const mockUserResponseDto = {
      id: mockUserId,
      name: 'John Doe',
      email: 'john@example.com',
      nationalId: '12345678901',
      role: 'student',
      phone: '+5511999999999',
      birthDate: mockDate,
      profileImageUrl: 'https://example.com/avatar.jpg',
      lastLogin: mockDate,
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    const mockFindUsersResponse = {
      users: [mockUserResponseDto],
      pagination: {
        page: 1,
        limit: 10,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      },
    };

    it('should find users successfully', async () => {
      vi.mocked(findUsersUseCase.execute).mockResolvedValueOnce(
        right(mockFindUsersResponse),
      );

      const result = await controller.find(mockFindUsersDto);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(mockFindUsersDto);
      expect(result).toEqual(mockFindUsersResponse);
    });

    it('should handle search by email only', async () => {
      const emailOnlyDto = { email: 'search@example.com' };

      vi.mocked(findUsersUseCase.execute).mockResolvedValueOnce(
        right(mockFindUsersResponse),
      );

      const result = await controller.find(emailOnlyDto);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(emailOnlyDto);
      expect(result.users).toHaveLength(1);
    });

    it('should handle search by name only', async () => {
      const nameOnlyDto = { name: 'John' };

      vi.mocked(findUsersUseCase.execute).mockResolvedValueOnce(
        right(mockFindUsersResponse),
      );

      const result = await controller.find(nameOnlyDto);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(nameOnlyDto);
      expect(result.users).toHaveLength(1);
    });

    it('should handle search by role only', async () => {
      const roleOnlyDto = { role: 'student' } as any;

      vi.mocked(findUsersUseCase.execute).mockResolvedValueOnce(
        right(mockFindUsersResponse),
      );

      const result = await controller.find(roleOnlyDto);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(roleOnlyDto);
      expect(result.users).toHaveLength(1);
    });

    it('should handle empty search results', async () => {
      const emptyResponse = {
        users: [],
        pagination: {
          page: 1,
          limit: 10,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        },
      };

      vi.mocked(findUsersUseCase.execute).mockResolvedValueOnce(
        right(emptyResponse),
      );

      const result = await controller.find(mockFindUsersDto);

      expect(result.users).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should throw RepositoryError on database failure', async () => {
      const repositoryError = new RepositoryError('Search query failed');

      vi.mocked(findUsersUseCase.execute).mockResolvedValueOnce(
        left(repositoryError),
      );

      await expect(controller.find(mockFindUsersDto)).rejects.toThrow(
        repositoryError,
      );
    });

    it('should handle complex search criteria', async () => {
      const complexSearchDto = {
        email: 'complex@example.com',
        name: 'Complex User',
        role: 'tutor',
        page: 2,
        limit: 5,
      };

      const complexResponse = {
        users: [
          {
            ...mockUserResponseDto,
            email: 'complex@example.com',
            name: 'Complex User',
            role: 'tutor',
          },
        ],
        pagination: {
          page: 2,
          limit: 5,
          pageSize: 5,
          total: 8,
          totalPages: 2,
        },
      };

      vi.mocked(findUsersUseCase.execute).mockResolvedValueOnce(
        right(complexResponse),
      );

      const result = await controller.find(complexSearchDto);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(complexSearchDto);
      expect(result.users[0].role).toBe('tutor');
      expect(result.pagination.page).toBe(2);
    });
  });

  describe('findById()', () => {
    const mockGetUserResponse = {
      user: {
        id: mockUserId,
        name: 'John Doe',
        email: 'john@example.com',
        nationalId: '12345678901',
        role: 'student',
        phone: '+5511999999999',
        birthDate: mockDate,
        profileImageUrl: 'https://example.com/avatar.jpg',
        lastLogin: mockDate,
        createdAt: mockDate,
        updatedAt: mockDate,
      },
    };

    it('should get user by ID successfully', async () => {
      vi.mocked(getUserByIdUseCase.execute).mockResolvedValueOnce(
        right(mockGetUserResponse),
      );

      const result = await controller.findById(mockUserId);

      expect(getUserByIdUseCase.execute).toHaveBeenCalledWith({
        id: mockUserId,
      });
      expect(result).toEqual(mockGetUserResponse);
    });

    it('should throw InvalidInputError for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';
      const invalidInputError = new InvalidInputError(
        'Invalid UUID format',
        [{ field: 'id', message: 'Must be a valid UUID' }],
      );

      vi.mocked(getUserByIdUseCase.execute).mockResolvedValueOnce(
        left(invalidInputError),
      );

      await expect(controller.findById(invalidId)).rejects.toThrow(
        invalidInputError,
      );
    });

    it('should throw ResourceNotFoundError when user not found', async () => {
      const nonExistentId = 'non-existent-uuid';
      const resourceNotFoundError = new ResourceNotFoundError('User', { id: nonExistentId });

      vi.mocked(getUserByIdUseCase.execute).mockResolvedValueOnce(
        left(resourceNotFoundError),
      );

      await expect(controller.findById(nonExistentId)).rejects.toThrow(
        resourceNotFoundError,
      );
    });

    it('should throw RepositoryError on database failure', async () => {
      const repositoryError = new RepositoryError('Database connection failed');

      vi.mocked(getUserByIdUseCase.execute).mockResolvedValueOnce(
        left(repositoryError),
      );

      await expect(controller.findById(mockUserId)).rejects.toThrow(
        repositoryError,
      );
    });

    it('should handle different user roles correctly', async () => {
      const roles = ['admin', 'tutor', 'student'] as const;

      for (const role of roles) {
        const responseWithRole = {
          user: {
            ...mockGetUserResponse.user,
            role,
          },
        };

        vi.mocked(getUserByIdUseCase.execute).mockResolvedValueOnce(
          right(responseWithRole),
        );

        const result = await controller.findById(mockUserId);

        expect(result.user.role).toBe(role);
      }
    });

    it('should handle user with minimal data', async () => {
      const minimalUserResponse = {
        user: {
          id: mockUserId,
          name: 'Minimal User',
          email: 'minimal@example.com',
          nationalId: '00000000000',
          role: 'student',
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      };

      vi.mocked(getUserByIdUseCase.execute).mockResolvedValueOnce(
        right(minimalUserResponse),
      );

      const result = await controller.findById(mockUserId);

      expect(result.user.phone).toBeUndefined();
      expect(result.user.birthDate).toBeUndefined();
      expect(result.user.profileImageUrl).toBeUndefined();
    });
  });

  describe('delete()', () => {
    const mockDeleteUserResponse = {
      message: 'User deleted successfully',
    };

    it('should delete user successfully', async () => {
      vi.mocked(deleteUserUseCase.execute).mockResolvedValueOnce(
        right(mockDeleteUserResponse),
      );

      const result = await controller.delete(mockUserId);

      expect(deleteUserUseCase.execute).toHaveBeenCalledWith({
        id: mockUserId,
      });
      expect(result).toEqual(mockDeleteUserResponse);
    });

    it('should throw ResourceNotFoundError when user not found', async () => {
      const nonExistentId = 'non-existent-uuid';
      const resourceNotFoundError = new ResourceNotFoundError('User', { id: nonExistentId });

      vi.mocked(deleteUserUseCase.execute).mockResolvedValueOnce(
        left(resourceNotFoundError),
      );

      await expect(controller.delete(nonExistentId)).rejects.toThrow(
        resourceNotFoundError,
      );
    });

    it('should throw UnauthorizedError when insufficient permissions', async () => {
      const unauthorizedError = new UnauthorizedError(
        'Insufficient permissions to delete user',
      );

      vi.mocked(deleteUserUseCase.execute).mockResolvedValueOnce(
        left(unauthorizedError),
      );

      await expect(controller.delete(mockUserId)).rejects.toThrow(
        unauthorizedError,
      );
    });

    it('should throw RepositoryError on database failure', async () => {
      const repositoryError = new RepositoryError('Database deletion failed');

      vi.mocked(deleteUserUseCase.execute).mockResolvedValueOnce(
        left(repositoryError),
      );

      await expect(controller.delete(mockUserId)).rejects.toThrow(
        repositoryError,
      );
    });

    it('should handle deletion of different user types', async () => {
      const userIds = ['admin-user-id', 'tutor-user-id', 'student-user-id'];

      for (const userId of userIds) {
        const responseForUser = {
          message: `User ${userId} deleted successfully`,
        };

        vi.mocked(deleteUserUseCase.execute).mockResolvedValueOnce(
          right(responseForUser),
        );

        const result = await controller.delete(userId);

        expect(deleteUserUseCase.execute).toHaveBeenCalledWith({ id: userId });
        expect(result.message).toContain(userId);
      }
    });
  });

  describe('Edge Cases and Integration Scenarios', () => {
    it('should handle multiple sequential operations correctly', async () => {
      // Test 1: Get user by ID
      vi.mocked(getUserByIdUseCase.execute).mockResolvedValueOnce(
        right({
          user: {
            id: mockUserId,
            name: 'Sequential User',
            email: 'sequential@example.com',
            nationalId: '11111111111',
            role: 'student',
            createdAt: mockDate,
            updatedAt: mockDate,
          },
        }),
      );

      const userResult = await controller.findById(mockUserId);
      expect((userResult as any).user.name).toBe('Sequential User');

      // Test 2: List users
      vi.mocked(listUsersUseCase.execute).mockResolvedValueOnce(
        right({
          items: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        }),
      );

      const listResult = await controller.list({ page: 1, pageSize: 10 });
      expect(listResult.items).toHaveLength(0);
      expect(listResult.total).toBe(0);
    });

    it('should handle malformed input data gracefully', async () => {
      const malformedData = {
        name: null,
        email: '',
        password: undefined,
        nationalId: 123, // Should be string
        role: 'invalid_role',
      };

      const invalidInputError = new InvalidInputError(
        'Malformed input data',
        [
          { field: 'name', message: 'Name cannot be null' },
          { field: 'email', message: 'Email cannot be empty' },
          { field: 'password', message: 'Password is required' },
          { field: 'nationalId', message: 'National ID must be a string' },
          { field: 'role', message: 'Invalid role value' },
        ],
      );

      vi.mocked(createUserUseCase.execute).mockResolvedValueOnce(
        left(invalidInputError),
      );

      await expect(controller.create(malformedData as any)).rejects.toThrow(
        invalidInputError,
      );
    });

    it('should maintain data consistency across operations', async () => {
      const userData = {
        name: 'Consistency Test',
        email: 'consistency@example.com',
        password: 'TestPass123!',
        nationalId: '99999999999',
        role: 'student' as const,
      };

      // Create user
      const createResponse = {
        identityId: 'consistency-user-id',
        profileId: 'consistency-profile-id',
        authorizationId: 'consistency-auth-id',
        email: userData.email,
        fullName: userData.name,
        role: userData.role,
      };

      vi.mocked(createUserUseCase.execute).mockResolvedValueOnce(
        right(createResponse),
      );

      const createdUser = await controller.create(userData);

      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.fullName).toBe(userData.name);
      expect(createdUser.role).toBe(userData.role);

      // Get created user
      const getUserResponse = {
        user: {
          id: createdUser.identityId,
          name: userData.name,
          email: userData.email,
          nationalId: userData.nationalId,
          role: userData.role,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      };

      vi.mocked(getUserByIdUseCase.execute).mockResolvedValueOnce(
        right(getUserResponse),
      );

      const fetchedUser = await controller.findById(createdUser.identityId);

      expect(fetchedUser.user.email).toBe(createdUser.email);
      expect(fetchedUser.user.name).toBe(createdUser.fullName);
    });

    it('should handle system errors gracefully', async () => {
      const systemErrors = [
        new Error('Unexpected system error'),
        new TypeError('Type error occurred'),
        new ReferenceError('Reference error occurred'),
      ];

      for (const error of systemErrors) {
        vi.mocked(createUserUseCase.execute).mockRejectedValueOnce(error);

        await expect(controller.create(mockCreateUserDto)).rejects.toThrow(
          error,
        );
      }
    });
  });

  describe('Performance and Stress Testing Scenarios', () => {
    it('should handle batch operations efficiently', async () => {
      const batchSize = 10;
      const batchPromises: Promise<any>[] = [];

      for (let i = 0; i < batchSize; i++) {
        const userData = {
          ...mockCreateUserDto,
          email: `batch${i}@example.com`,
          name: `Batch User ${i}`,
        };

        const response = {
          identityId: `batch-user-${i}`,
          profileId: `batch-profile-${i}`,
          authorizationId: `batch-auth-${i}`,
          email: userData.email,
          fullName: userData.name,
          role: userData.role,
        };

        vi.mocked(createUserUseCase.execute).mockResolvedValueOnce(
          right(response),
        );

        batchPromises.push(controller.create(userData));
      }

      const results = await Promise.all(batchPromises);

      expect(results).toHaveLength(batchSize);
      results.forEach((result: any, index: number) => {
        expect(result.email).toBe(`batch${index}@example.com`);
      });
    });

    it('should handle large pagination requests', async () => {
      const largePaginationRequest = { page: 1, pageSize: 100 };
      const largeUserList = Array.from({ length: 100 }, (_, index) => ({
        identityId: `user-${index}`,
        email: `user${index}@example.com`,
        emailVerified: true,
        fullName: `User ${index}`,
        nationalId: `${index.toString().padStart(11, '0')}`,
        role: 'student',
        isActive: true,
        createdAt: mockDate,
      }));

      const largeResponse = {
        items: largeUserList,
        total: 100,
        page: 1,
        limit: 100,
        totalPages: 1,
      };

      vi.mocked(listUsersUseCase.execute).mockResolvedValueOnce(
        right(largeResponse),
      );

      const result = await controller.list(largePaginationRequest);

      expect(result.items).toHaveLength(100);
      expect(result.total).toBe(100);
    });
  });
});