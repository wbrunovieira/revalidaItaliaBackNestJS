// src/infra/http/controllers/students.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { CreateAccountUseCase } from '@/domain/auth/application/use-cases/create-account.use-case';
import { UpdateAccountUseCase } from '@/domain/auth/application/use-cases/update-account.use-case';
import { ListUsersUseCase } from '@/domain/auth/application/use-cases/list-users.use-case';
import { FindUsersUseCase } from '@/domain/auth/application/use-cases/find-users.use-case';
import { DeleteUserUseCase } from '@/domain/auth/application/use-cases/delete-user.use-case';
import { left, right } from '@/core/either';
import { InvalidInputError } from '@/domain/auth/application/use-cases/errors/invalid-input-error';
import { ResourceNotFoundError } from '@/domain/auth/application/use-cases/errors/resource-not-found-error';
import { DuplicateEmailError } from '@/domain/auth/application/use-cases/errors/duplicate-email-error';
import { RepositoryError } from '@/domain/auth/application/use-cases/errors/repository-error';
import { UnauthorizedError } from '@/domain/auth/application/use-cases/errors/unauthorized-error';
import { CreateAccountRequest } from '@/domain/auth/application/dtos/create-account-request.dto';
import { FindUsersRequestDto } from '@/domain/auth/application/dtos/find-users-request.dto';

// Mock classes
class MockCreateAccountUseCase {
  execute = vi.fn();
}

class MockUpdateAccountUseCase {
  execute = vi.fn();
}

class MockListUsersUseCase {
  execute = vi.fn();
}

class MockFindUsersUseCase {
  execute = vi.fn();
}

class MockDeleteUserUseCase {
  execute = vi.fn();
}

describe('StudentsController', () => {
  let controller: StudentsController;
  let createAccountUseCase: MockCreateAccountUseCase;
  let updateAccountUseCase: MockUpdateAccountUseCase;
  let listUsersUseCase: MockListUsersUseCase;
  let findUsersUseCase: MockFindUsersUseCase;
  let deleteUserUseCase: MockDeleteUserUseCase;

  // Mock data
  const mockUser = {
    id: 'user-id-123',
    name: 'John Doe',
    email: 'john@example.com',
    cpf: '12345678900',
    phone: null,
    profileImageUrl: null,
    role: 'student' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser2 = {
    id: 'user-id-456',
    name: 'Jane Doe',
    email: 'jane@example.com',
    cpf: '98765432100',
    phone: null,
    profileImageUrl: null,
    role: 'student' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Initialize mocks
    createAccountUseCase = new MockCreateAccountUseCase();
    updateAccountUseCase = new MockUpdateAccountUseCase();
    listUsersUseCase = new MockListUsersUseCase();
    findUsersUseCase = new MockFindUsersUseCase();
    deleteUserUseCase = new MockDeleteUserUseCase();

    // Create controller instance
    controller = new StudentsController(
      createAccountUseCase as any,
      updateAccountUseCase as any,
      listUsersUseCase as any,
      findUsersUseCase as any,
      deleteUserUseCase as any,
    );

    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  describe('POST /students - Create Account', () => {
    const createDto: CreateAccountRequest = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Secure1@',
      role: 'student',
      cpf: '12345678900',
    };

    it('should create an account successfully', async () => {
      createAccountUseCase.execute.mockResolvedValue(right({ user: mockUser }));

      const result = await controller.create(createDto);

      expect(createAccountUseCase.execute).toHaveBeenCalledWith(createDto);
      expect(createAccountUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ user: mockUser });
    });

    it('should throw BadRequest when validation fails', async () => {
      const validationError = new InvalidInputError('Validation failed', [
        { field: 'email', message: 'Invalid email format' },
      ]);

      createAccountUseCase.execute.mockResolvedValue(left(validationError));

      await expect(controller.create(createDto)).rejects.toThrow(
        new HttpException(
          {
            message: 'Validation failed',
            errors: {
              details: [{ field: 'email', message: 'Invalid email format' }],
            },
          },
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(createAccountUseCase.execute).toHaveBeenCalledWith(createDto);
      expect(createAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw Conflict when email already exists', async () => {
      const duplicateEmailError = new DuplicateEmailError();
      createAccountUseCase.execute.mockResolvedValue(left(duplicateEmailError));

      await expect(controller.create(createDto)).rejects.toThrow(
        new HttpException(
          duplicateEmailError.message || 'Failed to create account',
          HttpStatus.CONFLICT,
        ),
      );

      expect(createAccountUseCase.execute).toHaveBeenCalledWith(createDto);
      expect(createAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw Conflict for generic errors', async () => {
      const genericError = new Error('Unknown error');
      createAccountUseCase.execute.mockResolvedValue(left(genericError));

      await expect(controller.create(createDto)).rejects.toThrow(
        new HttpException('Unknown error', HttpStatus.CONFLICT),
      );

      expect(createAccountUseCase.execute).toHaveBeenCalledWith(createDto);
      expect(createAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw Conflict with default message when error has no message', async () => {
      const errorWithoutMessage = new Error('');
      createAccountUseCase.execute.mockResolvedValue(left(errorWithoutMessage));

      await expect(controller.create(createDto)).rejects.toThrow(
        new HttpException('Failed to create account', HttpStatus.CONFLICT),
      );

      expect(createAccountUseCase.execute).toHaveBeenCalledWith(createDto);
      expect(createAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('PATCH /students/:id - Update Account', () => {
    const updateDto = {
      name: 'John Updated',
      email: 'john.updated@example.com',
    };

    it('should update an account successfully', async () => {
      const updatedUser = { ...mockUser, ...updateDto };
      updateAccountUseCase.execute.mockResolvedValue(
        right({ user: updatedUser }),
      );

      const result = await controller.update('user-id-123', updateDto);

      expect(updateAccountUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
        ...updateDto,
      });
      expect(updateAccountUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ user: updatedUser });
    });

    it('should throw BadRequest when no fields provided', async () => {
      await expect(controller.update('user-id-123', {})).rejects.toThrow(
        new HttpException(
          {
            message: 'At least one field to update must be provided',
            errors: { details: [] },
          },
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(updateAccountUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw BadRequest when validation fails', async () => {
      const validationError = new InvalidInputError('Validation failed', [
        { field: 'email', message: 'Invalid email format' },
      ]);

      updateAccountUseCase.execute.mockResolvedValue(left(validationError));

      await expect(controller.update('user-id-123', updateDto)).rejects.toThrow(
        new HttpException(
          {
            message: 'Validation failed',
            errors: {
              details: [{ field: 'email', message: 'Invalid email format' }],
            },
          },
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(updateAccountUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
        ...updateDto,
      });
      expect(updateAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequest when user not found', async () => {
      const notFoundError = new ResourceNotFoundError('User not found');
      updateAccountUseCase.execute.mockResolvedValue(left(notFoundError));

      await expect(controller.update('user-id-123', updateDto)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.BAD_REQUEST),
      );

      expect(updateAccountUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
        ...updateDto,
      });
      expect(updateAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw Conflict for generic errors', async () => {
      const genericError = new Error('Database error');
      updateAccountUseCase.execute.mockResolvedValue(left(genericError));

      await expect(controller.update('user-id-123', updateDto)).rejects.toThrow(
        new HttpException('Database error', HttpStatus.CONFLICT),
      );

      expect(updateAccountUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
        ...updateDto,
      });
      expect(updateAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw Conflict with default message when error has no message', async () => {
      const errorWithoutMessage = new Error('');
      updateAccountUseCase.execute.mockResolvedValue(left(errorWithoutMessage));

      await expect(controller.update('user-id-123', updateDto)).rejects.toThrow(
        new HttpException('Failed to update account', HttpStatus.CONFLICT),
      );

      expect(updateAccountUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
        ...updateDto,
      });
      expect(updateAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /students - List Users', () => {
    const listQuery = { page: 1, pageSize: 20 };
    const mockListResponse = {
      users: [mockUser],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 1,
      },
    };

    it('should list users successfully', async () => {
      listUsersUseCase.execute.mockResolvedValue(right(mockListResponse));

      const result = await controller.list(listQuery);

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
      });
      expect(listUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockListResponse);
    });

    it('should handle default pagination values', async () => {
      listUsersUseCase.execute.mockResolvedValue(right(mockListResponse));

      const result = await controller.list({});

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        page: undefined,
        pageSize: undefined,
      });
      expect(listUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockListResponse);
    });

    it('should throw InternalServerError when repository fails', async () => {
      const repositoryError = new RepositoryError('Database connection failed');
      listUsersUseCase.execute.mockResolvedValue(left(repositoryError));

      await expect(controller.list(listQuery)).rejects.toThrow(
        new HttpException(
          'Failed to list users',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
      });
      expect(listUsersUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerError for generic errors', async () => {
      const genericError = new Error('Unknown error');
      listUsersUseCase.execute.mockResolvedValue(left(genericError));

      await expect(controller.list(listQuery)).rejects.toThrow(
        new HttpException(
          'Failed to list users',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
      });
      expect(listUsersUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerError when error has no message', async () => {
      const errorWithoutMessage = new Error('');
      listUsersUseCase.execute.mockResolvedValue(left(errorWithoutMessage));

      await expect(controller.list(listQuery)).rejects.toThrow(
        new HttpException(
          'Failed to list users',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
      });
      expect(listUsersUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /students/search - Find Users', () => {
    const mockFindResponse = {
      users: [mockUser, mockUser2],
      pagination: {
        page: 1,
        pageSize: 20,
      },
    };

    it('should find users successfully without filters', async () => {
      findUsersUseCase.execute.mockResolvedValue(right(mockFindResponse));

      const result = await controller.find({});

      expect(findUsersUseCase.execute).toHaveBeenCalledWith({});
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockFindResponse);
    });

    it('should find users by name filter', async () => {
      const query: FindUsersRequestDto = { name: 'John' };
      const filteredResponse = {
        ...mockFindResponse,
        users: [mockUser],
      };

      findUsersUseCase.execute.mockResolvedValue(right(filteredResponse));

      const result = await controller.find(query);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(filteredResponse);
    });

    it('should find users by email filter', async () => {
      const query: FindUsersRequestDto = { email: 'john@example.com' };
      const filteredResponse = {
        ...mockFindResponse,
        users: [mockUser],
      };

      findUsersUseCase.execute.mockResolvedValue(right(filteredResponse));

      const result = await controller.find(query);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(filteredResponse);
    });

    it('should find users by cpf filter', async () => {
      const query: FindUsersRequestDto = { cpf: '12345678900' };
      const filteredResponse = {
        ...mockFindResponse,
        users: [mockUser],
      };

      findUsersUseCase.execute.mockResolvedValue(right(filteredResponse));

      const result = await controller.find(query);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(filteredResponse);
    });

    it('should find users with multiple filters', async () => {
      const query: FindUsersRequestDto = {
        name: 'John',
        email: 'john@example.com',
        page: 1,
        pageSize: 10,
      };

      findUsersUseCase.execute.mockResolvedValue(right(mockFindResponse));

      const result = await controller.find(query);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockFindResponse);
    });

    it('should find users with pagination', async () => {
      const query: FindUsersRequestDto = { page: 2, pageSize: 5 };
      const paginatedResponse = {
        users: [],
        pagination: {
          page: 2,
          pageSize: 5,
        },
      };

      findUsersUseCase.execute.mockResolvedValue(right(paginatedResponse));

      const result = await controller.find(query);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(paginatedResponse);
    });

    it('should return empty results when no users match filters', async () => {
      const query: FindUsersRequestDto = { name: 'NonExistent' };
      const emptyResponse = {
        users: [],
        pagination: {
          page: 1,
          pageSize: 20,
        },
      };

      findUsersUseCase.execute.mockResolvedValue(right(emptyResponse));

      const result = await controller.find(query);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(emptyResponse);
    });

    it('should throw InternalServerError when repository fails', async () => {
      const query: FindUsersRequestDto = { name: 'John' };
      const repositoryError = new RepositoryError('Database connection failed');

      findUsersUseCase.execute.mockResolvedValue(left(repositoryError));

      await expect(controller.find(query)).rejects.toThrow(
        new HttpException(
          'Failed to search users',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerError for generic errors', async () => {
      const query: FindUsersRequestDto = { email: 'john@example.com' };
      const genericError = new Error('Unknown error');

      findUsersUseCase.execute.mockResolvedValue(left(genericError));

      await expect(controller.find(query)).rejects.toThrow(
        new HttpException('Unknown error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerError with default message when error has no message', async () => {
      const query: FindUsersRequestDto = { cpf: '12345678900' };
      const errorWithoutMessage = new Error('');

      findUsersUseCase.execute.mockResolvedValue(left(errorWithoutMessage));

      await expect(controller.find(query)).rejects.toThrow(
        new HttpException(
          'Failed to search users',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should handle all filters and pagination together', async () => {
      const query: FindUsersRequestDto = {
        name: 'John',
        email: 'john@example.com',
        cpf: '12345678900',
        page: 3,
        pageSize: 15,
      };

      const complexResponse = {
        users: [mockUser],
        pagination: {
          page: 3,
          pageSize: 15,
        },
      };

      findUsersUseCase.execute.mockResolvedValue(right(complexResponse));

      const result = await controller.find(query);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(complexResponse);
    });

    it('should handle undefined query parameters', async () => {
      const query: FindUsersRequestDto = {
        name: undefined,
        email: undefined,
        cpf: undefined,
        page: undefined,
        pageSize: undefined,
      };

      findUsersUseCase.execute.mockResolvedValue(right(mockFindResponse));

      const result = await controller.find(query);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockFindResponse);
    });
  });

  describe('DELETE /students/:id - Delete User', () => {
    const mockDeleteResponse = {
      message: 'User deleted successfully',
    };

    it('should delete a user successfully as admin', async () => {
      deleteUserUseCase.execute.mockResolvedValue(right(mockDeleteResponse));

      const result = await controller.delete('user-id-123');

      expect(deleteUserUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
      });
      expect(deleteUserUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDeleteResponse);
    });

    it('should throw NotFound when user does not exist', async () => {
      const notFoundError = new ResourceNotFoundError('User not found');
      deleteUserUseCase.execute.mockResolvedValue(left(notFoundError));

      await expect(controller.delete('user-id-123')).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );

      expect(deleteUserUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
      });
      expect(deleteUserUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw Forbidden when unauthorized', async () => {
      const unauthorizedError = new UnauthorizedError(
        'Only admins can delete users',
      );
      deleteUserUseCase.execute.mockResolvedValue(left(unauthorizedError));

      await expect(controller.delete('user-id-123')).rejects.toThrow(
        new HttpException('Only admins can delete users', HttpStatus.FORBIDDEN),
      );

      expect(deleteUserUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
      });
      expect(deleteUserUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerError for generic errors', async () => {
      const genericError = new Error('Database error');
      deleteUserUseCase.execute.mockResolvedValue(left(genericError));

      await expect(controller.delete('user-id-123')).rejects.toThrow(
        new HttpException(
          'Failed to delete user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      expect(deleteUserUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
      });
      expect(deleteUserUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerError for repository errors', async () => {
      const repositoryError = new RepositoryError('Database connection failed');
      deleteUserUseCase.execute.mockResolvedValue(left(repositoryError));

      await expect(controller.delete('user-id-123')).rejects.toThrow(
        new HttpException(
          'Failed to delete user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      expect(deleteUserUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
      });
      expect(deleteUserUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });
});
