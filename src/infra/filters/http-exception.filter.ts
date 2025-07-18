import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SimpleLogger } from '@/infra/logger/simple-logger';
import { InvalidInputError } from '@/domain/auth/application/use-cases/errors/invalid-input-error';
import { DuplicateEmailError } from '@/domain/auth/application/use-cases/errors/duplicate-email-error';
import { DuplicateCPFError } from '@/domain/auth/application/use-cases/errors/duplicate-cpf-error';
import { ResourceNotFoundError } from '@/domain/auth/application/use-cases/errors/resource-not-found-error';
import { RepositoryError } from '@/domain/auth/application/use-cases/errors/repository-error';
import { AuthenticationError } from '@/domain/auth/application/use-cases/errors/authentication-error';
import { UnauthorizedError } from '@/domain/auth/application/use-cases/errors/unauthorized-error';

interface ErrorResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  traceId: string;
  timestamp: string;
  errors?: any;
}

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { traceId?: string }>();
    
    const traceId = request.traceId || SimpleLogger.generateTraceId();
    const instance = request.url;

    // Log the error if not already logged
    if (!request.traceId) {
      SimpleLogger.logError(traceId, exception, {
        endpoint: `${request.method} ${request.url}`,
        errorType: exception.constructor.name,
      });
    }

    const errorResponse = this.mapExceptionToResponse(
      exception,
      instance,
      traceId
    );

    response.status(errorResponse.status).json(errorResponse);
  }

  private mapExceptionToResponse(
    exception: Error,
    instance: string,
    traceId: string
  ): ErrorResponse {
    const timestamp = new Date().toISOString();
    const baseUrl = 'https://api.revalidaitalia.com/errors';

    // Handle HttpException (already formatted)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && 'type' in exceptionResponse) {
        return {
          ...exceptionResponse,
          traceId,
          timestamp,
        } as ErrorResponse;
      }

      return {
        type: `${baseUrl}/http-error`,
        title: this.getHttpTitle(status),
        status,
        detail: exception.message,
        instance,
        traceId,
        timestamp,
      };
    }

    // Handle domain errors
    if (exception instanceof InvalidInputError) {
      return {
        type: `${baseUrl}/validation-failed`,
        title: 'Validation Failed',
        status: HttpStatus.BAD_REQUEST,
        detail: 'One or more fields failed validation',
        instance,
        traceId,
        timestamp,
        errors: { details: this.sanitizeValidationErrors(exception.details) },
      };
    }

    if (exception instanceof DuplicateEmailError || exception instanceof DuplicateCPFError) {
      return {
        type: `${baseUrl}/resource-conflict`,
        title: 'Resource Conflict',
        status: HttpStatus.CONFLICT,
        detail: 'Unable to create resource due to conflict',
        instance,
        traceId,
        timestamp,
      };
    }

    if (exception instanceof ResourceNotFoundError) {
      return {
        type: `${baseUrl}/resource-not-found`,
        title: 'Resource Not Found',
        status: HttpStatus.NOT_FOUND,
        detail: 'The requested resource was not found',
        instance,
        traceId,
        timestamp,
      };
    }

    if (exception instanceof AuthenticationError) {
      return {
        type: `${baseUrl}/authentication-failed`,
        title: 'Authentication Failed',
        status: HttpStatus.UNAUTHORIZED,
        detail: 'Invalid credentials',
        instance,
        traceId,
        timestamp,
      };
    }

    if (exception instanceof UnauthorizedError) {
      return {
        type: `${baseUrl}/forbidden`,
        title: 'Forbidden',
        status: HttpStatus.FORBIDDEN,
        detail: exception.message || 'You do not have permission to perform this action',
        instance,
        traceId,
        timestamp,
      };
    }

    if (exception instanceof RepositoryError) {
      return {
        type: `${baseUrl}/internal-error`,
        title: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detail: 'An error occurred while processing your request',
        instance,
        traceId,
        timestamp,
      };
    }

    // Default error
    return {
      type: `${baseUrl}/internal-error`,
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: 'An unexpected error occurred',
      instance,
      traceId,
      timestamp,
    };
  }

  private sanitizeValidationErrors(details: any[]): any[] {
    if (!details) return [];

    return details.map((detail) => {
      // Don't expose password validation details
      if (detail.path?.includes('password')) {
        return {
          ...detail,
          message: 'Invalid password',
        };
      }
      return detail;
    });
  }

  private getHttpTitle(status: number): string {
    const titles: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      500: 'Internal Server Error',
    };

    return titles[status] || 'Error';
  }
}