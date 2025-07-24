import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { SimpleLogger } from '@/infra/logger/simple-logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;

    // Generate trace ID for this request
    const traceId = SimpleLogger.generateTraceId();
    request.traceId = traceId;

    // Log incoming request
    SimpleLogger.logInfo(`Incoming request: ${method} ${url}`, {
      traceId,
      endpoint: `${method} ${url}`,
      userId: user?.id,
      payload: this.sanitizePayload(body),
    });

    const startTime = Date.now();

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;

        SimpleLogger.logInfo(`Request completed: ${method} ${url}`, {
          traceId,
          endpoint: `${method} ${url}`,
          duration: `${duration}ms`,
          userId: user?.id,
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        SimpleLogger.logError(traceId, error, {
          endpoint: `${method} ${url}`,
          duration: `${duration}ms`,
          userId: user?.id,
          payload: this.sanitizePayload(body),
        });

        throw error;
      }),
    );
  }

  private sanitizePayload(payload: any): any {
    if (!payload) return payload;

    const sanitized = { ...payload };

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
    ];

    sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
