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

class MockGetUserByIdUseCase {
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
  let getUserByIdUseCase: MockGetUserByIdUseCase;

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
    getUserByIdUseCase = new MockGetUserByIdUseCase();

    // Create controller instance
    controller = new StudentsController(
      createAccountUseCase as any,
      updateAccountUseCase as any,
      listUsersUseCase as any,
      findUsersUseCase as any,
      getUserByIdUseCase as any, // Adicionar
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

    it('should throw InvalidInputError when validation fails', async () => {
      const validationError = new InvalidInputError('Validation failed', [
        { field: 'email', message: 'Invalid email format' },
      ]);

      createAccountUseCase.execute.mockResolvedValue(left(validationError));

      await expect(controller.create(createDto)).rejects.toThrow(validationError);

      expect(createAccountUseCase.execute).toHaveBeenCalledWith({
        ...createDto,
        role: 'student'
      });
      expect(createAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw DuplicateEmailError when email already exists', async () => {
      const duplicateEmailError = new DuplicateEmailError();
      createAccountUseCase.execute.mockResolvedValue(left(duplicateEmailError));

      await expect(controller.create(createDto)).rejects.toThrow(duplicateEmailError);

      expect(createAccountUseCase.execute).toHaveBeenCalledWith({
        ...createDto,
        role: 'student'
      });
      expect(createAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw generic Error for unknown errors', async () => {
      const genericError = new Error('Unknown error');
      createAccountUseCase.execute.mockResolvedValue(left(genericError));

      await expect(controller.create(createDto)).rejects.toThrow(genericError);

      expect(createAccountUseCase.execute).toHaveBeenCalledWith({
        ...createDto,
        role: 'student'
      });
      expect(createAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw Error when error has no message', async () => {
      const errorWithoutMessage = new Error('');
      createAccountUseCase.execute.mockResolvedValue(left(errorWithoutMessage));

      await expect(controller.create(createDto)).rejects.toThrow(errorWithoutMessage);

      expect(createAccountUseCase.execute).toHaveBeenCalledWith({
        ...createDto,
        role: 'student'
      });
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

    it('should throw InvalidInputError when no fields provided', async () => {
      await expect(controller.update('user-id-123', {})).rejects.toThrow(InvalidInputError);

      expect(updateAccountUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw InvalidInputError when validation fails', async () => {
      const validationError = new InvalidInputError('Validation failed', [
        { field: 'email', message: 'Invalid email format' },
      ]);

      updateAccountUseCase.execute.mockResolvedValue(left(validationError));

      await expect(
        controller.update('user-id-123', updateDto),
      ).rejects.toThrow(validationError);

      expect(updateAccountUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
        ...updateDto,
      });
      expect(updateAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw ResourceNotFoundError when user not found', async () => {
      const notFoundError = new ResourceNotFoundError();
      updateAccountUseCase.execute.mockResolvedValue(left(notFoundError));

      await expect(
        controller.update('user-id-123', updateDto),
      ).rejects.toThrow(notFoundError);

      expect(updateAccountUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
        ...updateDto,
      });
      expect(updateAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw generic Error for other errors', async () => {
      const genericError = new Error('Unknown error');
      updateAccountUseCase.execute.mockResolvedValue(left(genericError));

      await expect(
        controller.update('user-id-123', updateDto),
      ).rejects.toThrow(genericError);

      expect(updateAccountUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
        ...updateDto,
      });
      expect(updateAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /students - List Users', () => {
    it('should list users successfully with default pagination', async () => {
      const mockResponse = {
        users: [mockUser, mockUser2],
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      listUsersUseCase.execute.mockResolvedValue(right(mockResponse));

      const result = await controller.list({});

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        page: undefined,
        pageSize: undefined,
      });
      expect(listUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should list users with custom pagination', async () => {
      const mockResponse = {
        users: [mockUser],
        total: 2,
        page: 2,
        pageSize: 1,
        totalPages: 2,
      };

      listUsersUseCase.execute.mockResolvedValue(right(mockResponse));

      const result = await controller.list({ page: 2, pageSize: 1 });

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        page: 2,
        pageSize: 1,
      });
      expect(listUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should handle default pagination values', async () => {
      const mockResponse = {
        users: [mockUser, mockUser2],
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      listUsersUseCase.execute.mockResolvedValue(right(mockResponse));

      const result = await controller.list({ page: undefined, pageSize: undefined });

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        page: undefined,
        pageSize: undefined,
      });
      expect(listUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should throw RepositoryError when repository fails', async () => {
      const repoError = new RepositoryError('Database connection failed');
      listUsersUseCase.execute.mockResolvedValue(left(repoError));

      await expect(controller.list({})).rejects.toThrow(repoError);

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        page: undefined,
        pageSize: undefined,
      });
      expect(listUsersUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw generic Error for other errors', async () => {
      const genericError = new Error('Unknown error');
      listUsersUseCase.execute.mockResolvedValue(left(genericError));

      await expect(controller.list({})).rejects.toThrow(genericError);

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        page: undefined,
        pageSize: undefined,
      });
      expect(listUsersUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw Error when error has no message', async () => {
      const errorWithoutMessage = new Error('');
      listUsersUseCase.execute.mockResolvedValue(left(errorWithoutMessage));

      await expect(controller.list({})).rejects.toThrow(errorWithoutMessage);

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        page: undefined,
        pageSize: undefined,
      });
      expect(listUsersUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /students/search - Find Users', () => {
    it('should find users successfully without filters', async () => {
      const mockResponse = {
        users: [mockUser, mockUser2],
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      findUsersUseCase.execute.mockResolvedValue(right(mockResponse));

      const result = await controller.find({});

      expect(findUsersUseCase.execute).toHaveBeenCalledWith({});
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should find users by name filter', async () => {
      const mockResponse = {
        users: [mockUser],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      findUsersUseCase.execute.mockResolvedValue(right(mockResponse));

      const query: FindUsersRequestDto = { name: 'John' };
      const result = await controller.find(query);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should find users by email filter', async () => {
      const mockResponse = {
        users: [mockUser],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      findUsersUseCase.execute.mockResolvedValue(right(mockResponse));

      const query: FindUsersRequestDto = { email: 'john@example.com' };
      const result = await controller.find(query);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should find users by cpf filter', async () => {
      const mockResponse = {
        users: [mockUser],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      findUsersUseCase.execute.mockResolvedValue(right(mockResponse));

      const query: FindUsersRequestDto = { cpf: '12345678900' };
      const result = await controller.find(query);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should find users with multiple filters', async () => {
      const mockResponse = {
        users: [mockUser],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      findUsersUseCase.execute.mockResolvedValue(right(mockResponse));

      const query: FindUsersRequestDto = {
        name: 'John',
        email: 'john@example.com',
        cpf: '12345678900',
      };
      const result = await controller.find(query);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should find users with pagination', async () => {
      const mockResponse = {
        users: [mockUser],
        total: 2,
        page: 2,
        pageSize: 1,
        totalPages: 2,
      };

      findUsersUseCase.execute.mockResolvedValue(right(mockResponse));

      const query: FindUsersRequestDto = { page: 2, pageSize: 1 };
      const result = await controller.find(query);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should return empty results when no users match filters', async () => {
      const mockResponse = {
        users: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };

      findUsersUseCase.execute.mockResolvedValue(right(mockResponse));

      const query: FindUsersRequestDto = { name: 'NonExistent' };
      const result = await controller.find(query);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should throw RepositoryError when repository fails', async () => {
      const repoError = new RepositoryError('Database connection failed');
      findUsersUseCase.execute.mockResolvedValue(left(repoError));

      await expect(controller.find({})).rejects.toThrow(repoError);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith({});
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw generic Error for other errors', async () => {
      const genericError = new Error('Unknown error');
      findUsersUseCase.execute.mockResolvedValue(left(genericError));

      await expect(controller.find({})).rejects.toThrow(genericError);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith({});
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw Error with default message when error has no message', async () => {
      const errorWithoutMessage = new Error('');
      findUsersUseCase.execute.mockResolvedValue(left(errorWithoutMessage));

      await expect(controller.find({})).rejects.toThrow(errorWithoutMessage);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith({});
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should handle all filters and pagination together', async () => {
      const mockResponse = {
        users: [mockUser],
        total: 1,
        page: 1,
        pageSize: 5,
        totalPages: 1,
      };

      findUsersUseCase.execute.mockResolvedValue(right(mockResponse));

      const query: FindUsersRequestDto = {
        name: 'John',
        email: 'john@example.com',
        cpf: '12345678900',
        page: 1,
        pageSize: 5,
      };
      const result = await controller.find(query);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should handle undefined query parameters', async () => {
      const mockResponse = {
        users: [mockUser, mockUser2],
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      findUsersUseCase.execute.mockResolvedValue(right(mockResponse));

      const query: FindUsersRequestDto = {
        name: undefined,
        email: undefined,
        cpf: undefined,
        page: undefined,
        pageSize: undefined,
      };
      const result = await controller.find(query);

      expect(findUsersUseCase.execute).toHaveBeenCalledWith(query);
      expect(findUsersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('DELETE /students/:id - Delete User', () => {
    it('should delete a user successfully as admin', async () => {
      const mockResponse = { message: 'User deleted successfully' };

      deleteUserUseCase.execute.mockResolvedValue(right(mockResponse));

      const result = await controller.delete('user-id-123');

      expect(deleteUserUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
      });
      expect(deleteUserUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should throw ResourceNotFoundError when user does not exist', async () => {
      const notFoundError = new ResourceNotFoundError();
      deleteUserUseCase.execute.mockResolvedValue(left(notFoundError));

      await expect(controller.delete('non-existent-id')).rejects.toThrow(notFoundError);

      expect(deleteUserUseCase.execute).toHaveBeenCalledWith({
        id: 'non-existent-id',
      });
      expect(deleteUserUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedError when unauthorized', async () => {
      const unauthorizedError = new UnauthorizedError(
        'Only admins can delete users',
      );
      deleteUserUseCase.execute.mockResolvedValue(left(unauthorizedError));

      await expect(controller.delete('user-id-123')).rejects.toThrow(unauthorizedError);

      expect(deleteUserUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
      });
      expect(deleteUserUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw generic Error for other errors', async () => {
      const genericError = new Error('Unknown error');
      deleteUserUseCase.execute.mockResolvedValue(left(genericError));

      await expect(controller.delete('user-id-123')).rejects.toThrow(genericError);

      expect(deleteUserUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
      });
      expect(deleteUserUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw RepositoryError for repository errors', async () => {
      const repoError = new RepositoryError('Database connection failed');
      deleteUserUseCase.execute.mockResolvedValue(left(repoError));

      await expect(controller.delete('user-id-123')).rejects.toThrow(repoError);

      expect(deleteUserUseCase.execute).toHaveBeenCalledWith({
        id: 'user-id-123',
      });
      expect(deleteUserUseCase.execute).toHaveBeenCalledTimes(1);
    });

    describe('GET /students/:id - Get User By Id', () => {
      it('should get a user by id successfully', async () => {
        getUserByIdUseCase.execute.mockResolvedValue(right({ user: mockUser }));

        const result = await controller.findById('user-id-123');

        expect(getUserByIdUseCase.execute).toHaveBeenCalledWith({
          id: 'user-id-123',
        });
        expect(getUserByIdUseCase.execute).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ user: mockUser });
      });

      it('should throw InvalidInputError when validation fails', async () => {
        const validationError = new InvalidInputError('Validation failed', [
          { field: 'id', message: 'Invalid UUID format' },
        ]);

        getUserByIdUseCase.execute.mockResolvedValue(left(validationError));

        await expect(controller.findById('invalid-uuid')).rejects.toThrow(validationError);

        expect(getUserByIdUseCase.execute).toHaveBeenCalledWith({
          id: 'invalid-uuid',
        });
        expect(getUserByIdUseCase.execute).toHaveBeenCalledTimes(1);
      });

      it('should throw ResourceNotFoundError when user does not exist', async () => {
        const notFoundError = new ResourceNotFoundError();
        getUserByIdUseCase.execute.mockResolvedValue(left(notFoundError));

        await expect(controller.findById('non-existent-id')).rejects.toThrow(notFoundError);

        expect(getUserByIdUseCase.execute).toHaveBeenCalledWith({
          id: 'non-existent-id',
        });
        expect(getUserByIdUseCase.execute).toHaveBeenCalledTimes(1);
      });

      it('should throw RepositoryError when repository fails', async () => {
        const repoError = new RepositoryError('Database connection failed');
        getUserByIdUseCase.execute.mockResolvedValue(left(repoError));

        await expect(controller.findById('user-id-123')).rejects.toThrow(repoError);

        expect(getUserByIdUseCase.execute).toHaveBeenCalledWith({
          id: 'user-id-123',
        });
        expect(getUserByIdUseCase.execute).toHaveBeenCalledTimes(1);
      });

      it('should throw generic Error for other errors', async () => {
        const genericError = new Error('Unknown error');
        getUserByIdUseCase.execute.mockResolvedValue(left(genericError));

        await expect(controller.findById('user-id-123')).rejects.toThrow(genericError);

        expect(getUserByIdUseCase.execute).toHaveBeenCalledWith({
          id: 'user-id-123',
        });
        expect(getUserByIdUseCase.execute).toHaveBeenCalledTimes(1);
      });

      it('should throw Error with default message when error has no message', async () => {
        const errorWithoutMessage = new Error('');
        getUserByIdUseCase.execute.mockResolvedValue(left(errorWithoutMessage));

        await expect(controller.findById('user-id-123')).rejects.toThrow(errorWithoutMessage);

        expect(getUserByIdUseCase.execute).toHaveBeenCalledWith({
          id: 'user-id-123',
        });
        expect(getUserByIdUseCase.execute).toHaveBeenCalledTimes(1);
      });

      it('should handle different user roles', async () => {
        const adminUser = { ...mockUser, role: 'admin' as const };
        getUserByIdUseCase.execute.mockResolvedValue(
          right({ user: adminUser }),
        );

        const result = await controller.findById('user-id-123');

        expect(getUserByIdUseCase.execute).toHaveBeenCalledWith({
          id: 'user-id-123',
        });
        expect(getUserByIdUseCase.execute).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ user: adminUser });
      });

      it('should handle user with all optional fields populated', async () => {
        const userWithAllFields = {
          ...mockUser,
          phone: '+5511999999999',
          profileImageUrl: 'https://example.com/profile.jpg',
        };
        getUserByIdUseCase.execute.mockResolvedValue(
          right({ user: userWithAllFields }),
        );

        const result = await controller.findById('user-id-123');

        expect(getUserByIdUseCase.execute).toHaveBeenCalledWith({
          id: 'user-id-123',
        });
        expect(getUserByIdUseCase.execute).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ user: userWithAllFields });
      });
    });
  });
});