// src/infra/http/controllers/students.controller.ts
import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpException,
  HttpStatus,
  UseGuards,
  Request,
  Delete,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CreateAccountUseCase } from '@/domain/auth/application/use-cases/create-account.use-case';
import { UpdateAccountUseCase } from '@/domain/auth/application/use-cases/update-account.use-case';
import { ListUsersUseCase } from '@/domain/auth/application/use-cases/list-users.use-case';
import { FindUsersUseCase } from '@/domain/auth/application/use-cases/find-users.use-case';
import { GetUserByIdUseCase } from '@/domain/auth/application/use-cases/get-user-by-id.use-case'; // Adicionar
import { CreateAccountRequest } from '@/domain/auth/application/dtos/create-account-request.dto';
import { CreateStudentDto } from '@/domain/auth/application/dtos/create-student.dto';
import { CreateStudentResponseDto, StudentResponseDto } from '@/domain/auth/application/dtos/student-response.dto';
import { ErrorResponseDto, ValidationErrorResponseDto, ConflictErrorResponseDto } from '@/domain/auth/application/dtos/error-response.dto';
import { UpdateAccountRequest } from '@/domain/auth/application/dtos/update-account-request.dto';
import { FindUsersRequestDto } from '@/domain/auth/application/dtos/find-users-request.dto';
import { GetUserByIdRequestDto } from '@/domain/auth/application/dtos/get-user-by-id-request.dto'; // Adicionar

import { InvalidInputError } from '@/domain/auth/application/use-cases/errors/invalid-input-error';
import { ResourceNotFoundError } from '@/domain/auth/application/use-cases/errors/resource-not-found-error';
import { RepositoryError } from '@/domain/auth/application/use-cases/errors/repository-error';
import { DuplicateEmailError } from '@/domain/auth/application/use-cases/errors/duplicate-email-error';
import { DuplicateCPFError } from '@/domain/auth/application/use-cases/errors/duplicate-cpf-error';
import { SimpleLogger } from '@/infra/logger/simple-logger';

import { ListUsersDto } from '@/domain/auth/application/dtos/list-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UnauthorizedError } from '@/domain/auth/application/use-cases/errors/unauthorized-error';
import { DeleteUserUseCase } from '@/domain/auth/application/use-cases/delete-user.use-case';
import { DeleteUserRequestDto } from '@/domain/auth/application/dtos/delete-user-request.dto';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(
    private readonly createAccount: CreateAccountUseCase,
    private readonly updateAccount: UpdateAccountUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly findUsers: FindUsersUseCase,
    private readonly getUserById: GetUserByIdUseCase, // Adicionar
    private readonly deleteUser: DeleteUserUseCase,
  ) {}

  @ApiOperation({ 
    summary: 'Create new student account',
    description: `
      Creates a new student account for the Italian medical diploma revalidation system.
      
      ## Authentication Required 🔒
      
      **To test this endpoint in Swagger UI:**
      1. Click the "Authorize" button at the top of this page (green button with padlock)
      2. In the modal, enter: Bearer YOUR_TOKEN_HERE
      3. Click "Authorize" and close
      4. Now you can use "Try it out" on this endpoint
      
      **For API calls:**
      Add header: \`Authorization: Bearer <token>\`
      
      ## Access Control
      - Only administrators can create student accounts
      - Requires valid JWT token with admin role
      
      ## Business Rules
      - Email must be unique in the system
      - Document number (CPF) must be unique
      - Password must meet security requirements
      - Name must have at least 3 characters
      
      ## Security Notes
      - For security reasons, duplicate email/document errors return generic messages
      - Password requirements are validated but not exposed in error messages
      - Rate limited to 10 requests per minute per admin
      
      ## After Creation
      - Student receives welcome email with login instructions
      - Account is immediately active
      - Student can login and start courses
      
      ## Next Steps
      - POST /auth/login - Student can authenticate
      - GET /courses - View available courses
      - POST /enrollments - Enroll in courses
    `
  })
  @ApiBody({ 
    type: CreateStudentDto,
    description: 'Student account data',
    examples: {
      italian: {
        summary: 'Italian medical student',
        value: {
          name: 'Giulia Bianchi',
          email: 'giulia.bianchi@medicina.it',
          password: 'SecurePass123!',
          cpf: '12345678901',
          role: 'student'
        }
      },
      brazilian: {
        summary: 'Brazilian student with CPF',
        value: {
          name: 'João Silva',
          email: 'joao.silva@med.br',
          password: 'StrongPass456!',
          cpf: '98765432109',
          role: 'student'
        }
      },
      foreign: {
        summary: 'Foreign student with passport',
        value: {
          name: 'John Smith',
          email: 'john.smith@medical.edu',
          password: 'SecurePass789!',
          cpf: 'PP123456789',
          role: 'student'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Student account created successfully',
    type: CreateStudentResponseDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Validation error - invalid input data',
    type: ValidationErrorResponseDto,
    examples: {
      validation: {
        summary: 'Multiple validation errors',
        value: {
          type: 'https://api.revalidaitalia.com/errors/validation-failed',
          title: 'Validation Failed',
          status: 400,
          detail: 'One or more fields failed validation',
          instance: '/students',
          traceId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: '2024-01-20T15:30:00.000Z',
          errors: {
            name: ['Name must be at least 3 characters'],
            email: ['Invalid email format']
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Only administrators can create student accounts',
    type: ErrorResponseDto,
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - resource already exists',
    type: ConflictErrorResponseDto,
    examples: {
      conflict: {
        summary: 'Generic conflict message for security',
        value: {
          type: 'https://api.revalidaitalia.com/errors/resource-conflict',
          title: 'Resource Conflict',
          status: 409,
          detail: 'Unable to create resource due to conflict',
          instance: '/students',
          traceId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: '2024-01-20T15:30:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateStudentDto) {
    const traceId = SimpleLogger.generateTraceId();
    
    // Log da requisição
    SimpleLogger.logInfo('Creating new student account', {
      traceId,
      endpoint: 'POST /students',
      payload: { ...dto, password: '[REDACTED]' }
    });

    // Force role to be student for security
    const studentData: CreateAccountRequest = {
      ...dto,
      role: 'student'
    };

    const result = await this.createAccount.execute(studentData);

    if (result.isLeft()) {
      const err = result.value;
      
      // Log do erro real para debugging
      SimpleLogger.logError(traceId, err, {
        endpoint: 'POST /students',
        method: 'create',
        payload: { ...dto, password: '[REDACTED]' },
        errorType: err.constructor.name
      });
      
      if (err instanceof InvalidInputError) {
        // Para erros de validação que não são sensíveis, podemos ser específicos
        const sanitizedDetails = err.details?.map((detail: any) => {
          // Não expor detalhes de senha
          if (detail.path?.includes('password')) {
            return {
              ...detail,
              message: 'Invalid password'
            };
          }
          return detail;
        });

        throw new HttpException(
          {
            type: 'https://api.revalidaitalia.com/errors/validation-failed',
            title: 'Validation Failed',
            status: 400,
            detail: 'One or more fields failed validation',
            instance: '/students',
            traceId,
            timestamp: new Date().toISOString(),
            errors: { details: sanitizedDetails }
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Para duplicações, sempre retornar mensagem genérica
      if (err instanceof DuplicateEmailError || err instanceof DuplicateCPFError) {
        throw new HttpException(
          {
            type: 'https://api.revalidaitalia.com/errors/resource-conflict',
            title: 'Resource Conflict',
            status: 409,
            detail: 'Unable to create resource due to conflict',
            instance: '/students',
            traceId,
            timestamp: new Date().toISOString()
          },
          HttpStatus.CONFLICT,
        );
      }

      if (err instanceof RepositoryError) {
        throw new HttpException(
          {
            type: 'https://api.revalidaitalia.com/errors/internal-error',
            title: 'Internal Server Error',
            status: 500,
            detail: 'An error occurred while processing your request',
            instance: '/students',
            traceId,
            timestamp: new Date().toISOString()
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Erro genérico
      throw new HttpException(
        {
          type: 'https://api.revalidaitalia.com/errors/internal-error',
          title: 'Internal Server Error',
          status: 500,
          detail: 'An error occurred while processing your request',
          instance: '/students',
          traceId,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Log de sucesso
    SimpleLogger.logInfo('Student account created successfully', {
      traceId,
      endpoint: 'POST /students',
      userId: result.value.user.id,
      email: result.value.user.email
    });

    return { user: result.value.user };
  }

  @Patch(':id')
  @HttpCode(200)
  async update(
    @Param('id') id: string,
    @Body() dto: Omit<UpdateAccountRequest, 'id'>,
  ) {
    if (!dto || Object.keys(dto).length === 0) {
      throw new HttpException(
        {
          message: 'At least one field to update must be provided',
          errors: { details: [] },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const request: UpdateAccountRequest = { id, ...dto };
    const result = await this.updateAccount.execute(request);

    if (result.isLeft()) {
      const err = result.value;

      if (err instanceof InvalidInputError) {
        throw new HttpException(
          { message: err.message, errors: { details: err.details } },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (err instanceof ResourceNotFoundError) {
        throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
      }

      throw new HttpException(
        err.message || 'Failed to update account',
        HttpStatus.CONFLICT,
      );
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
      throw new HttpException(
        'Failed to list users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      const err = result.value;

      if (err instanceof RepositoryError) {
        throw new HttpException(
          'Failed to search users',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException(
        err.message || 'Failed to search users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return result.value;
  }

  @Get(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findById(@Param('id') id: string) {
    const result = await this.getUserById.execute({ id });

    if (result.isLeft()) {
      const err = result.value;

      if (err instanceof InvalidInputError) {
        throw new HttpException(
          { message: err.message, errors: { details: err.details } },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (err instanceof ResourceNotFoundError) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (err instanceof RepositoryError) {
        throw new HttpException(
          'Failed to get user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException(
        err['message'] || 'Failed to get user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return result.value;
  }

  @Delete(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async delete(@Param('id') id: string) {
    const result = await this.deleteUser.execute({
      id,
    });

    if (result.isLeft()) {
      const err = result.value;

      if (err instanceof ResourceNotFoundError) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (err instanceof UnauthorizedError) {
        throw new HttpException(err.message, HttpStatus.FORBIDDEN);
      }

      throw new HttpException(
        'Failed to delete user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return result.value;
  }
}
