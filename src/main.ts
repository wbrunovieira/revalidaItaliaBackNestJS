// src/main.ts
import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';

import { PrismaClient } from '@prisma/client';

import { AppModule } from './app.module';
import { LoggingInterceptor } from '@/infra/interceptors/logging.interceptor';
import { HttpExceptionFilter } from '@/infra/filters/http-exception.filter';
import { createSwaggerConfig } from '@/infra/config/swagger.config';

/**
 * Bootstrap the NestJS application
 * Configures middleware, global pipes, filters, and Swagger documentation
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable graceful shutdown
  app.enableShutdownHooks();

  // API Versioning
  app.setGlobalPrefix('api/v1');

  // CORS Configuration
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  });

  // Global Middleware
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const firstMsg = Object.values(errors[0].constraints!)[0];
        return new BadRequestException(firstMsg);
      },
    }),
  );

  // Swagger Configuration (conditional for production)
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const swaggerConfig = createSwaggerConfig();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Development Seed
  if (process.env.NODE_ENV === 'development') {
    const prisma = new PrismaClient();
    await import('./seed');
    await prisma.$disconnect();
  }

  // Start Server
  const port = process.env.PORT ?? 3333;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
