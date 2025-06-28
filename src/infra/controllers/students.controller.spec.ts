// src/infra/http/controllers/students.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { CreateAccountUseCase } from '@/domain/auth/application/use-cases/create-account.use-case';
import { UpdateAccountUseCase } from '@/domain/auth/application/use-cases/update-account.use-case';
import { ListUsersUseCase } from '@/domain/auth/application/use-cases/list-users.use-case';
import { DeleteUserUseCase } from '@/domain/auth/application/use-cases/delete-user.use-case';
import { left, right } from '@/core/either';
import { InvalidInputError } from '@/domain/auth/application/use-cases/errors/invalid-input-error';
import { ResourceNotFoundError } from '@/domain/auth/application/use-cases/errors/resource-not-found-error';
import { DuplicateEmailError } from '@/domain/auth/application/use-cases/errors/duplicate-email-error';
import { RepositoryError } from '@/domain/auth/application/use-cases/errors/repository-error';
import { UnauthorizedError } from '@/domain/auth/application/use-cases/errors/unauthorized-error';
import { CreateAccountRequest } from '@/domain/auth/application/dtos/create-account-request.dto';

class MockCreateAccountUseCase {
  execute = vi.fn();
}

class MockUpdateAccountUseCase {
  execute = vi.fn();
}

class MockListUsersUseCase {
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
  let deleteUserUseCase: MockDeleteUserUseCase;

  const mockUser = {
    id: 'user-id-123',
    name: 'John Doe',
    email: 'john@example.com',
    cpf: '12345678900',
    role: 'student' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    createAccountUseCase = new MockCreateAccountUseCase();
    updateAccountUseCase = new MockUpdateAccountUseCase();
    listUsersUseCase = new MockListUsersUseCase();
    deleteUserUseCase = new MockDeleteUserUseCase();

    controller = new StudentsController(
      createAccountUseCase as any,
      updateAccountUseCase as any,
      listUsersUseCase as any,
      deleteUserUseCase as any,
    );

    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  describe('create', () => {
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

  describe('update', () => {
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

  describe('list', () => {
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

  describe('delete', () => {
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
