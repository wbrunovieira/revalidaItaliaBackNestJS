// src/domain/auth/application/use-cases/delete-user.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeleteUserUseCase } from './delete-user.use-case';
import { InMemoryAccountRepository } from '@/test/repositories/in-memory-account-repository';
import { User } from '@/domain/auth/enterprise/entities/user.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { UnauthorizedError } from './errors/unauthorized-error';
import { RepositoryError } from './errors/repository-error';
import { left, right } from '@/core/either';

describe('DeleteUserUseCase', () => {
  let repo: InMemoryAccountRepository;
  let useCase: DeleteUserUseCase;

  beforeEach(() => {
    repo = new InMemoryAccountRepository();
    useCase = new DeleteUserUseCase(repo as any);
  });

  describe('when deleting users', () => {
    it('should allow admin to delete any user', async () => {
      // Create admin and target user
      const adminUser = User.create(
        {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'password',
          cpf: '11111111111',
          role: 'admin',
        },
        new UniqueEntityID('admin-id'),
      );

      const targetUser = User.create(
        {
          name: 'Target User',
          email: 'target@example.com',
          password: 'password',
          cpf: '22222222222',
          role: 'student',
        },
        new UniqueEntityID('target-id'),
      );

      repo.items.push(adminUser, targetUser);

      const result = await useCase.execute({
        id: 'target-id',
        requesterId: 'admin-id',
        requesterRole: 'admin',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('User deleted successfully');
      }
      expect(repo.items).toHaveLength(1);
      expect(repo.items[0].id.toString()).toBe('admin-id');
    });

    it('should allow user to delete their own account', async () => {
      const user = User.create(
        {
          name: 'Regular User',
          email: 'user@example.com',
          password: 'password',
          cpf: '33333333333',
          role: 'student',
        },
        new UniqueEntityID('user-id'),
      );

      repo.items.push(user);

      const result = await useCase.execute({
        id: 'user-id',
        requesterId: 'user-id',
        requesterRole: 'student',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.message).toBe('User deleted successfully');
      }
      expect(repo.items).toHaveLength(0);
    });

    it('should not allow non-admin to delete other users', async () => {
      const user1 = User.create(
        {
          name: 'User 1',
          email: 'user1@example.com',
          password: 'password',
          cpf: '44444444444',
          role: 'student',
        },
        new UniqueEntityID('user1-id'),
      );

      const user2 = User.create(
        {
          name: 'User 2',
          email: 'user2@example.com',
          password: 'password',
          cpf: '55555555555',
          role: 'student',
        },
        new UniqueEntityID('user2-id'),
      );

      repo.items.push(user1, user2);

      const result = await useCase.execute({
        id: 'user2-id',
        requesterId: 'user1-id',
        requesterRole: 'student',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(UnauthorizedError);
        expect(result.value.message).toBe('Only admins can delete other users');
      }
      expect(repo.items).toHaveLength(2);
    });

    it('should not allow tutor to delete other users', async () => {
      const tutor = User.create(
        {
          name: 'Tutor User',
          email: 'tutor@example.com',
          password: 'password',
          cpf: '66666666666',
          role: 'tutor',
        },
        new UniqueEntityID('tutor-id'),
      );

      const student = User.create(
        {
          name: 'Student User',
          email: 'student@example.com',
          password: 'password',
          cpf: '77777777777',
          role: 'student',
        },
        new UniqueEntityID('student-id'),
      );

      repo.items.push(tutor, student);

      const result = await useCase.execute({
        id: 'student-id',
        requesterId: 'tutor-id',
        requesterRole: 'tutor',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(UnauthorizedError);
      }
    });

    it('should return error when user not found', async () => {
      const result = await useCase.execute({
        id: 'non-existent-id',
        requesterId: 'admin-id',
        requesterRole: 'admin',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
        expect(result.value.message).toBe('User not found');
      }
    });

    it('should handle repository findById error', async () => {
      vi.spyOn(repo, 'findById').mockResolvedValueOnce(
        left(new Error('Database error')),
      );

      const result = await useCase.execute({
        id: 'any-id',
        requesterId: 'admin-id',
        requesterRole: 'admin',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      }
    });

    it('should handle repository delete error', async () => {
      const user = User.create(
        {
          name: 'User',
          email: 'user@example.com',
          password: 'password',
          cpf: '88888888888',
          role: 'student',
        },
        new UniqueEntityID('user-id'),
      );

      repo.items.push(user);

      vi.spyOn(repo, 'delete').mockResolvedValueOnce(
        left(new Error('Failed to delete')),
      );

      const result = await useCase.execute({
        id: 'user-id',
        requesterId: 'admin-id',
        requesterRole: 'admin',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to delete');
      }
    });

    it('should handle exceptions thrown by repository', async () => {
      vi.spyOn(repo, 'findById').mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      const result = await useCase.execute({
        id: 'any-id',
        requesterId: 'admin-id',
        requesterRole: 'admin',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Unexpected error');
      }
    });

    it('should log warning when deleting admin user', async () => {
      const adminToDelete = User.create(
        {
          name: 'Admin to Delete',
          email: 'admin.delete@example.com',
          password: 'password',
          cpf: '99999999999',
          role: 'admin',
        },
        new UniqueEntityID('admin-delete-id'),
      );

      const adminRequester = User.create(
        {
          name: 'Admin Requester',
          email: 'admin.requester@example.com',
          password: 'password',
          cpf: '10101010101',
          role: 'admin',
        },
        new UniqueEntityID('admin-requester-id'),
      );

      repo.items.push(adminToDelete, adminRequester);

      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const result = await useCase.execute({
        id: 'admin-delete-id',
        requesterId: 'admin-requester-id',
        requesterRole: 'admin',
      });

      expect(result.isRight()).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Admin user admin-delete-id is being deleted by admin-requester-id',
      );

      consoleWarnSpy.mockRestore();
    });

    it('should allow admin to delete their own account', async () => {
      const admin = User.create(
        {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'password',
          cpf: '12121212121',
          role: 'admin',
        },
        new UniqueEntityID('admin-id'),
      );

      repo.items.push(admin);

      const result = await useCase.execute({
        id: 'admin-id',
        requesterId: 'admin-id',
        requesterRole: 'admin',
      });

      expect(result.isRight()).toBe(true);
      expect(repo.items).toHaveLength(0);
    });
  });
});
