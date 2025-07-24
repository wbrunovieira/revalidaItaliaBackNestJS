// src/infra/controllers/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Req,
  Ip,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthenticateUserUseCase } from '@/domain/auth/application/use-cases/authentication/authenticate-user.use-case';
import { AuthenticateUserRequestDto } from '@/domain/auth/application/dtos/authenticate-user-request.dto';
import { AuthenticateUserDto } from '@/domain/auth/application/dtos/authenticate-user.dto';
import {
  AuthSuccessResponseDto,
  AuthErrorResponseDto,
  ValidationErrorResponseDto,
} from '@/domain/auth/application/dtos/auth-response.dto';
import {
  IS_PUBLIC_KEY,
  Public,
} from '@/infra/auth/decorators/public.decorator';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authenticateUser: AuthenticateUserUseCase,
    private readonly jwtService: JwtService,
  ) {}

  @ApiOperation({
    summary: 'Authenticate user',
    description: `
      Authenticates a user with email and password credentials.
      
      ## Security Notes
      - All authentication failures return generic "Invalid credentials" message
      - Rate limited to 5 attempts per minute per IP
      - Passwords must be at least 6 characters (validated internally)
      - Email format is validated internally
      
      ## Token Usage
      After successful authentication:
      1. Extract the accessToken from response
      2. Include in subsequent requests: Authorization: Bearer {accessToken}
      3. Token expires after 24 hours
      4. No refresh token endpoint currently available
      
      ## Next Steps
      - GET /users/profile - Get user profile details
      - GET /courses - List available courses
      - GET /enrollments - Check user enrollments
    `,
  })
  @ApiBody({
    type: AuthenticateUserDto,
    description: 'Login credentials',
    examples: {
      student: {
        summary: 'Student login - Medical student accessing course content',
        value: {
          email: 'mario.rossi@medicina.it',
          password: 'SecurePass123!',
        },
      },
      admin: {
        summary: 'Admin login - System administrator',
        value: {
          email: 'admin@revalidaitalia.com',
          password: 'AdminSecure456!',
        },
      },
      testAccount: {
        summary: 'Test account (dev environment only)',
        value: {
          email: 'test.student@example.com',
          password: 'TestPassword123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful - returns JWT token and user info',
    type: AuthSuccessResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed - returns generic message for security',
    type: AuthErrorResponseDto,
    examples: {
      invalidCredentials: {
        summary:
          'Any authentication failure (email invalid, password too short, user not found, wrong password)',
        value: {
          statusCode: 401,
          message: 'Invalid credentials',
          error: 'Unauthorized',
        },
      },
    },
  })
  @Public()
  @Post('login')
  async login(
    @Body() dto: AuthenticateUserRequestDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    // Get user agent from request headers
    const userAgent = request.headers?.['user-agent'] || 'Unknown';

    const result = await this.authenticateUser.execute({
      ...dto,
      ipAddress,
      userAgent,
    });

    if (result.isLeft()) {
      // Por segurança, sempre retornar mensagem genérica
      throw new UnauthorizedException('Invalid credentials');
    }

    const { user } = result.value;

    const token = this.jwtService.sign({
      sub: user.identityId,
      role: user.role,
    });

    return { accessToken: token, user };
  }
}
