// src/infra/filters/http-exception.filter.ts
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
import { errorMappings } from './error-mappings';

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

/**
 * HTTP Exception Filter
 *
 * Global exception filter that maps domain errors to HTTP responses following
 * RFC 7807 Problem Details format. Uses modular error mappings to handle
 * domain-specific errors from all bounded contexts.
 */

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
      traceId,
    );

    response.status(errorResponse.status).json(errorResponse);
  }

  private mapExceptionToResponse(
    exception: Error,
    instance: string,
    traceId: string,
  ): ErrorResponse {
    const timestamp = new Date().toISOString();
    const baseUrl = 'https://api.portalrevalida.com/errors';

    // Handle HttpException (already formatted)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        'type' in exceptionResponse
      ) {
        return {
          ...exceptionResponse,
          traceId,
          timestamp,
        } as ErrorResponse;
      }

      // Handle validation errors from ValidationPipe (BadRequestException)
      if (
        status === 400 &&
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const messages = Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message
          : [exceptionResponse.message];

        // If we have detailed validation messages, include them in detail
        if (messages.length > 0 && typeof messages[0] === 'string') {
          return {
            type: `${baseUrl}/http-error`,
            title: this.getHttpTitle(status),
            status,
            detail: messages.join(', '),
            instance,
            traceId,
            timestamp,
          };
        }
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

    // Handle domain errors using modular mappings
    const errorName = exception.constructor.name;
    const mapping = errorMappings[errorName];

    if (mapping) {
      const detail = mapping.extractDetail
        ? mapping.extractDetail(exception)
        : mapping.detail || exception.message;

      const response: ErrorResponse = {
        type: `${baseUrl}/${mapping.type}`,
        title: mapping.title,
        status: mapping.status,
        detail,
        instance,
        traceId,
        timestamp,
      };

      // Add additional data if extractor is provided
      if (mapping.extractAdditionalData) {
        const additionalData = mapping.extractAdditionalData(exception);
        Object.assign(response, additionalData);
      }

      return response;
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
