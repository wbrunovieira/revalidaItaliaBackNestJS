// src/infra/database/prisma/repositories/prisma-user-repository.ts
import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { PaginationParams } from '@/core/repositories/pagination-params';
import { Either, left, right } from '@/core/either';
import { RepositoryError } from '@/core/errors/repository-error';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { DomainEvents } from '@/core/domain/events/domain-events';

import {
  IUserRepository,
  SearchFilters,
} from '@/domain/auth/application/repositories/i-user-repository';
import { User } from '@/domain/auth/enterprise/entities/user.entity';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  private toDomain(user: any): User {
    return User.create(
      {
        ...user,
        createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
        updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
      },
      user.id,
    );
  }

  async findUsers(
    filters: SearchFilters,
    params: PaginationParams,
  ): Promise<Either<Error, User[]>> {
    try {
      const { page, pageSize } = params;
      const skip = (page - 1) * pageSize;

      // Construir condições de busc
      const whereConditions: any[] = [];

      if (filters.name) {
        whereConditions.push({
          name: {
            contains: filters.name,
            mode: 'insensitive', // Case insensitive
          },
        });
      }

      if (filters.email) {
        whereConditions.push({
          email: {
            contains: filters.email,
            mode: 'insensitive',
          },
        });
      }

      if (filters.nationalId) {
        whereConditions.push({
          nationalId: {
            contains: filters.nationalId,
          },
        });
      }

      const users = await this.prisma.user.findMany({
        where:
          whereConditions.length > 0
            ? {
                OR: whereConditions, // Busca por qualquer um dos critérios
              }
            : {},
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Converter cada usuário do Prisma para a entidade User do domínio
      const domainUsers = users.map((user) => this.toDomain(user));

      return right(domainUsers);
    } catch (error: any) {
      return left(
        new RepositoryError('Failed to search users', 'findUsers', error),
      );
    }
  }

  async findByNationalId(nationalId: string): Promise<Either<Error, User | null>> {
    try {
      const data = await this.prisma.user.findFirst({ where: { nationalId } });
      return right(data ? this.toDomain(data) : null);
    } catch (err: any) {
      return left(
        new RepositoryError('Failed to find user by National ID', 'findByNationalId', err),
      );
    }
  }

  async findById(id: string): Promise<Either<Error, User | null>> {
    try {
      const accountData = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!accountData) {
        return right(null);
      }

      const account = User.create(
        {
          name: accountData.name,
          email: accountData.email,
          password: accountData.password,
          nationalId: accountData.nationalId,
          phone: accountData.phone ?? undefined,
          birthDate: accountData.birthDate ?? undefined,
          profileImageUrl: accountData.profileImageUrl ?? undefined,
          role: accountData.role as 'student' | 'admin' | 'tutor',
          createdAt: accountData.createdAt,
          updatedAt: accountData.updatedAt,
        },
        new UniqueEntityID(accountData.id),
      );

      return right(account);
    } catch (error: any) {
      return left(
        new RepositoryError('Failed to find user by ID', 'findById', error),
      );
    }
  }

  async save(user: User): Promise<Either<Error, void>> {
    try {
      await this.prisma.user.update({
        where: { id: user.id.toString() },
        data: {
          name: user.name,
          email: user.email.value,
          nationalId: user.nationalId.value,
          phone: user.phone,
          birthDate: user.birthDate,
          profileImageUrl: user.profileImageUrl,
          role: user.role.value,
          updatedAt: new Date(),
        },
      });
      return right(undefined);
    } catch (error: any) {
      return left(new RepositoryError('Failed to update user', 'save', error));
    }
  }

  async updatePassword(
    userId: string,
    password: string,
  ): Promise<Either<Error, void>> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password,
          updatedAt: new Date(),
        },
      });
      return right(undefined);
    } catch (error: any) {
      return left(
        new RepositoryError(
          'Failed to update password',
          'updatePassword',
          error,
        ),
      );
    }
  }

  async create(user: User): Promise<Either<Error, void>> {
    try {
      await this.prisma.user.create({
        data: {
          id: user.id.toString(),
          name: user.name,
          email: user.email.value,
          password: user.password,
          nationalId: user.nationalId.value,
          profileImageUrl: user.profileImageUrl,
          role: user.role.value,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });

      // Mark aggregate for event dispatch
      DomainEvents.markAggregateForDispatch(user);
      
      // Dispatch events immediately after marking
      DomainEvents.dispatchEventsForAggregate(user.id);
      
      return right(undefined);
    } catch (error: any) {
      return left(
        new RepositoryError('Failed to create user', 'create', error),
      );
    }
  }

  async delete(user: User): Promise<Either<Error, void>> {
    try {
      await this.prisma.user.delete({
        where: { id: user.id.toString() },
      });
      return right(undefined);
    } catch (error: any) {
      return left(
        new RepositoryError('Failed to delete user', 'delete', error),
      );
    }
  }

  async findByEmail(email: string): Promise<Either<Error, User | null>> {
    try {
      const accountData = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!accountData) {
        return right(null);
      }

      const user = User.create(
        {
          name: accountData.name,
          email: accountData.email,
          password: accountData.password,
          role: accountData.role as 'student' | 'admin' | 'tutor',
          nationalId: accountData.nationalId ?? undefined,
        },
        new UniqueEntityID(accountData.id),
      );

      return right(user);
    } catch (error: any) {
      return left(
        new RepositoryError(
          'Failed to find user by email',
          'findByEmail',
          error,
        ),
      );
    }
  }

  async findAll(params: PaginationParams): Promise<Either<Error, User[]>> {
    try {
      const { page, pageSize } = params;

      if (page < 1 || pageSize < 1) {
        return left(
          new RepositoryError('Invalid pagination parameters', 'findAll'),
        );
      }

      const skip = (page - 1) * pageSize;

      const accountsData = await this.prisma.user.findMany({
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc', // Newest first
        },
      });

      const accounts = accountsData.map((account) =>
        User.create(
          {
            name: account.name,
            email: account.email,
            password: account.password,
            nationalId: account.nationalId,
            phone: account.phone ?? undefined,
            paymentToken: account.paymentToken ?? undefined,
            birthDate: account.birthDate ?? undefined,
            lastLogin: account.lastLogin ?? undefined,
            profileImageUrl: account.profileImageUrl ?? undefined,
            role: account.role as 'student' | 'admin' | 'tutor',
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
          },
          new UniqueEntityID(account.id),
        ),
      );

      return right(accounts);
    } catch (error: any) {
      console.error('Error listing users:', error);
      return left(
        new RepositoryError('Failed to list users', 'findAll', error),
      );
    }
  }

  async count(): Promise<Either<Error, number>> {
    try {
      const count = await this.prisma.user.count();
      return right(count);
    } catch (error: any) {
      console.error('Error counting users:', error);
      return left(new RepositoryError('Failed to count users', 'count', error));
    }
  }
}
