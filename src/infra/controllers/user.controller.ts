// src/infra/controllers/user.controller.ts
import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  UseGuards,
  Delete,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiDocs,
  CreateAccountOperation,
  CreateAccountBody,
  CreateAccountResponses,
} from './docs';
import { CreateUserUseCase } from '@/domain/auth/application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '@/domain/auth/application/use-cases/update-user.use-case';
import { ListUsersUseCase } from '@/domain/auth/application/use-cases/list-users.use-case';
import { FindUsersUseCase } from '@/domain/auth/application/use-cases/find-users.use-case';
import { GetUserByIdUseCase } from '@/domain/auth/application/use-cases/get-user-by-id.use-case'; // Adicionar
import { CreateUserRequest } from '@/domain/auth/application/dtos/create-user-request.dto';
import { CreateUserDto } from '@/domain/auth/application/dtos/create-user.dto';
import {
  CreateUserResponseDto,
  UserResponseDto,
} from '@/domain/auth/application/dtos/user-response.dto';
import { UpdateUserRequest } from '@/domain/auth/application/dtos/update-user-request.dto';
import { FindUsersRequestDto } from '@/domain/auth/application/dtos/find-users-request.dto';
import { GetUserByIdRequestDto } from '@/domain/auth/application/dtos/get-user-by-id-request.dto'; // Adicionar

import { InvalidInputError } from '@/domain/auth/application/use-cases/errors/invalid-input-error';
import { ResourceNotFoundError } from '@/domain/auth/application/use-cases/errors/resource-not-found-error';
import { RepositoryError } from '@/domain/auth/application/use-cases/errors/repository-error';
import { DuplicateEmailError } from '@/domain/auth/application/use-cases/errors/duplicate-email-error';
import { DuplicateNationalIdError } from '@/domain/auth/application/use-cases/errors/duplicate-national-id-error';

import { ListUsersDto } from '@/domain/auth/application/dtos/list-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UnauthorizedError } from '@/domain/auth/application/use-cases/errors/unauthorized-error';
import { DeleteUserUseCase } from '@/domain/auth/application/use-cases/delete-user.use-case';
import { DeleteUserRequestDto } from '@/domain/auth/application/dtos/delete-user-request.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly findUsers: FindUsersUseCase,
    private readonly getUserById: GetUserByIdUseCase,
    private readonly deleteUser: DeleteUserUseCase,
  ) {}

  @ApiDocs({
    operation: CreateAccountOperation,
    body: CreateAccountBody,
    responses: CreateAccountResponses,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @HttpCode(201)
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async create(@Body() dto: CreateUserDto) {
    const result = await this.createUser.execute({
      ...dto,
      source: 'admin',
    });

    if (result.isLeft()) {
      throw result.value;
    }

    return { user: result.value.user };
  }

  @Patch(':id')
  @HttpCode(200)
  async update(
    @Param('id') id: string,
    @Body() dto: Omit<UpdateUserRequest, 'id'>,
  ) {
    if (!dto || Object.keys(dto).length === 0) {
      throw new InvalidInputError(
        'At least one field to update must be provided',
        [
          {
            path: [],
            message: 'At least one field to update must be provided',
          },
        ],
      );
    }

    const request: UpdateUserRequest = { id, ...dto };
    const result = await this.updateUser.execute(request);

    if (result.isLeft()) {
      throw result.value;
    }

    return { user: result.value.user };
  }

  @Get()
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async list(@Query() query: ListUsersDto) {
    const result = await this.listUsers.execute({
      page: query.page,
      pageSize: query.pageSize,
    });

    if (result.isLeft()) {
      throw result.value;
    }

    return result.value;
  }

  @Get('search')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async find(@Query() query: FindUsersRequestDto) {
    const result = await this.findUsers.execute(query);

    if (result.isLeft()) {
      throw result.value;
    }

    return result.value;
  }

  @Get(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findById(@Param('id') id: string) {
    const result = await this.getUserById.execute({ id });

    if (result.isLeft()) {
      throw result.value;
    }

    return result.value;
  }

  @Delete(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async delete(@Param('id') id: string) {
    const result = await this.deleteUser.execute({ id });

    if (result.isLeft()) {
      throw result.value;
    }

    return result.value;
  }
}
