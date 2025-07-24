import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const exceptionResponse = exception.getResponse() as any;

    // If it's already our custom error format, pass it through
    if (exceptionResponse.error && exceptionResponse.error !== 'Bad Request') {
      return response.status(400).json(exceptionResponse);
    }

    // Convert ValidationPipe errors to our expected format
    if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
      const details: Record<string, string[]> = {};

      exceptionResponse.message.forEach((msg: string) => {
        // Parse validation messages to extract field names
        const field = this.extractFieldFromMessage(msg);
        const standardizedMsg = this.standardizeMessage(msg);
        if (!details[field]) details[field] = [];
        details[field].push(standardizedMsg);
      });

      return response.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Invalid input data',
        details,
      });
    }

    // For single string messages
    if (typeof exceptionResponse.message === 'string') {
      const field = this.extractFieldFromMessage(exceptionResponse.message);
      const standardizedMsg = this.standardizeMessage(
        exceptionResponse.message,
      );
      return response.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Invalid input data',
        details: {
          [field]: [standardizedMsg],
        },
      });
    }

    // Default ValidationPipe error format
    return response.status(400).json({
      error: 'INVALID_INPUT',
      message: 'Invalid input data',
      details: { general: ['Validation failed'] },
    });
  }

  private extractFieldFromMessage(message: string): string {
    if (message.toLowerCase().includes('name')) return 'name';
    if (message.toLowerCase().includes('slug')) return 'slug';
    if (message.toLowerCase().includes('id')) return 'id';
    return 'general';
  }

  private standardizeMessage(message: string): string {
    // Padronizar mensagens do class-validator para match com as esperadas
    if (
      message.includes('name should not be empty') ||
      message.includes('name must be longer than') ||
      message.includes('name must be a string')
    ) {
      return 'Name cannot be empty after trimming';
    }
    return message;
  }
}
