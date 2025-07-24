// src/infra/controllers/docs/api-docs.decorator.ts
import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiOperationOptions,
  ApiBodyOptions,
  ApiResponseOptions,
} from '@nestjs/swagger';

interface ApiDocsOptions {
  operation?: ApiOperationOptions;
  body?: ApiBodyOptions;
  responses?: Record<number, ApiResponseOptions>;
}

/**
 * Custom decorator to apply all API documentation at once
 * Keeps controllers clean while maintaining comprehensive documentation
 */
export function ApiDocs(options: ApiDocsOptions) {
  const decorators: Array<
    ClassDecorator | MethodDecorator | PropertyDecorator
  > = [];

  if (options.operation) {
    decorators.push(ApiOperation(options.operation));
  }

  if (options.body) {
    decorators.push(ApiBody(options.body));
  }

  if (options.responses) {
    Object.entries(options.responses).forEach(([status, responseOptions]) => {
      decorators.push(
        ApiResponse({
          status: Number(status),
          ...responseOptions,
        }),
      );
    });
  }

  return applyDecorators(...decorators);
}
