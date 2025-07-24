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
// Use cases

// Domain DTOs (interfaces/types)
import { CreateUserRequest } from '@/domain/auth/application/use-cases/profile/create-user.use-case';
import { UpdateUserRequestDto } from '@/domain/auth/application/dtos/update-user-request.dto';
import { UpdateUserResponseDto } from '@/domain/auth/application/dtos/update-user-response.dto';
import { FindUsersRequestDto } from '@/domain/auth/application/dtos/find-users-request.dto';
import { ListUsersResult } from '@/domain/auth/application/use-cases/profile/list-users.use-case';

// Infrastructure DTOs (classes with validation)
import { CreateUserDto } from '@/infra/http/dtos/create-user.dto';
import { UpdateUserDto } from '@/infra/http/dtos/update-user.dto';
import { ListUsersDto } from '@/infra/http/dtos/list-users.dto';

// Guards and decorators
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserUseCase } from '@/domain/auth/application/use-cases/profile/create-user.use-case';
import { UpdateUserUseCase } from '@/domain/auth/application/use-cases/profile/update-user.use-case';
import { ListUsersUseCase } from '@/domain/auth/application/use-cases/profile/list-users.use-case';
import { FindUsersUseCase } from '@/domain/auth/application/use-cases/profile/find-users.use-case';
import { GetUserByIdUseCase } from '@/domain/auth/application/use-cases/profile/get-user-by-id.use-case';
import { DeleteUserUseCase } from '@/domain/auth/application/use-cases/profile/delete-user.use-case';

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
  async create(@Body() dto: CreateUserDto): Promise<any> {
    // Convert infrastructure DTO to domain request
    const request: CreateUserRequest = {
      email: dto.email,
      password: dto.password,
      fullName: dto.name, // Map 'name' to 'fullName'
      nationalId: dto.nationalId,
      role: dto.role,
      source: dto.source || 'admin', // Default to 'admin' when created via admin endpoint
    };

    const result = await this.createUser.execute(request);

    if (result.isLeft()) {
      throw result.value;
    }

    return result.value;
  }

  @Patch(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UpdateUserResponseDto> {
    const request: UpdateUserRequestDto = { id, ...dto };
    const result = await this.updateUser.execute(request);

    if (result.isLeft()) {
      throw result.value;
    }

    return result.value;
  }

  @Get()
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async list(@Query() query: ListUsersDto): Promise<any> {
    const result = await this.listUsers.execute({
      page: query.page,
      limit: query.pageSize, // Map pageSize to limit
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
