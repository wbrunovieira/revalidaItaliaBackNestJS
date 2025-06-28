// src/infra/database/prisma/repositories/prisma-account-repositories.ts
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationParams } from '@/core/repositories/pagination-params';

import { Injectable } from '@nestjs/common';

import { Either, left, right } from '@/core/either';
import {
  IAccountRepository,
  SearchFilters,
} from '@/domain/auth/application/repositories/i-account-repository';

import { User } from '@/domain/auth/enterprise/entities/user.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { ResourceNotFoundError } from '@/domain/auth/application/use-cases/errors/resource-not-found-error';

@Injectable()
export class PrismaAccountRepository implements IAccountRepository {
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

      if (filters.cpf) {
        whereConditions.push({
          cpf: {
            contains: filters.cpf,
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
    } catch (error) {
      return left(new Error(`Failed to search users: ${error.message}`));
    }
  }

  async findByCpf(cpf: string): Promise<Either<Error, User>> {
    try {
      const data = await this.prisma.user.findUnique({ where: { cpf } });
      if (!data) {
        return left(new ResourceNotFoundError('User not found'));
      }
      return right(this.toDomain(data));
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async findById(id: string): Promise<Either<Error, User>> {
    try {
      const accountData = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!accountData) {
        return left(new ResourceNotFoundError('User not found'));
      }

      const account = User.create(
        {
          name: accountData.name,

          email: accountData.email,
          password: accountData.password,
          phone: accountData.phone ?? undefined,
          birthDate: accountData.birthDate ?? undefined,

          profileImageUrl: accountData.profileImageUrl ?? undefined,
          role: accountData.role as 'student' | 'admin' | 'tutor',
          cpf: accountData.cpf ?? undefined,
        },
        new UniqueEntityID(accountData.id),
      );

      return right(account);
    } catch (error) {
      return left(new Error('Database error'));
    }
  }

  async save(user: User): Promise<Either<Error, void>> {
    try {
      await this.prisma.user.update({
        where: { id: user.id.toString() },
        data: {
          name: user.name,
          email: user.email,

          profileImageUrl: user.profileImageUrl,

          role: user.role,

          updatedAt: new Date(),
        },
      });
      return right(undefined);
    } catch (error) {
      return left(new Error('Failed to update user'));
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
    } catch (error) {
      return left(new Error('Failed to update password'));
    }
  }

  async create(user: User): Promise<Either<Error, void>> {
    try {
      await this.prisma.user.create({
        data: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          password: user.password,
          cpf: user.cpf,
          profileImageUrl: user.profileImageUrl,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
      return right(undefined);
    } catch (error) {
      return left(new Error('Failed to create user'));
    }
  }

  async delete(user: User): Promise<Either<Error, void>> {
    try {
      await this.prisma.user.delete({
        where: { id: user.id.toString() },
      });
      return right(undefined);
    } catch (error) {
      return left(new Error('Failed to delete user'));
    }
  }

  async findByEmail(email: string): Promise<Either<Error, User>> {
    try {
      const accountData = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!accountData) {
        return left(new ResourceNotFoundError('User not found'));
      }

      const user = User.create(
        {
          name: accountData.name,
          email: accountData.email,
          password: accountData.password,
          role: accountData.role as 'student' | 'admin' | 'tutor',
          cpf: accountData.cpf ?? undefined,
        },
        new UniqueEntityID(accountData.id),
      );

      return right(user);
    } catch (error) {
      return left(new Error('Database error'));
    }
  }

  async findAll(params: PaginationParams): Promise<Either<Error, User[]>> {
    try {
      const { page, pageSize } = params;

      if (page < 1 || pageSize < 1) {
        return left(new Error('Invalid pagination parameters'));
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
            cpf: account.cpf,
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
      // Log error for debugging but return generic message
      console.error('Error listing users:', error);
      return left(new Error('Failed to find users'));
    }
  }

  async count(): Promise<Either<Error, number>> {
    try {
      const count = await this.prisma.user.count();
      return right(count);
    } catch (error: any) {
      console.error('Error counting users:', error);
      return left(new Error('Failed to count users'));
    }
  }
}
