// src/domain/auth/application/use-cases/get-user-by-id.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../repositories/i-user-repository';
import { InvalidInputError } from './errors/invalid-input-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { GetUserByIdRequestDto } from '../dtos/get-user-by-id-request.dto';
import {
  GetUserByIdSchema,
  getUserByIdSchema,
} from './validations/get-user-by-id.schema';

export type GetUserByIdResponse = Either<
  InvalidInputError | ResourceNotFoundError | RepositoryError,
  {
    user: {
      id: string;
      name: string;
      email: string;
      nationalId?: string;
      phone?: string;
      birthDate?: Date;
      profileImageUrl?: string;
      role: 'student' | 'admin' | 'tutor';
      lastLogin?: Date;
      createdAt: Date;
      updatedAt: Date;
    };
  }
>;

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(request: GetUserByIdRequestDto): Promise<GetUserByIdResponse> {
    // Validate
    const parse = getUserByIdSchema.safeParse(request);
    if (!parse.success) {
      const details = parse.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }
    const { id } = parse.data;

    // Fetch from repo
    const found = await this.userRepo.findById(id);
    
    if (found.isLeft()) {
      return left(new RepositoryError(found.value.message));
    }

    const userEntity = found.value;
    
    if (!userEntity) {
      return left(new ResourceNotFoundError('User not found'));
    }
    const payload = {
      user: {
        id: userEntity.id.toString(),
        name: userEntity.name,
        email: userEntity.email,
        nationalId: userEntity.nationalId,
        phone: userEntity.phone,
        birthDate: userEntity.birthDate,
        profileImageUrl: userEntity.profileImageUrl,
        role: userEntity.role,
        lastLogin: userEntity.lastLogin,
        createdAt: userEntity.createdAt,
        updatedAt: userEntity.updatedAt,
      },
    };
    return right(payload);
  }
}
