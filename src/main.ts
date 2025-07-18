import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://3.18.51.87:3000'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  });

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

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Revalida Italia API')
    .setDescription(`
      RESTful API for the Italian medical diploma revalidation system.
      
      ## Overview
      This API provides endpoints for managing the revalidation process of medical diplomas in Italy,
      including user authentication, course management, video lessons, and progress tracking.
      
      ## Authentication
      Most endpoints require authentication via JWT Bearer token.
      1. Obtain token via POST /auth/login
      2. Include token in Authorization header: "Bearer {token}"
      3. Tokens expire after 24 hours
      
      ## Rate Limiting
      - Authentication endpoints: 5 requests per minute per IP
      - Other endpoints: 100 requests per minute per token
      
      ## User Roles
      - **student**: Can access courses, watch videos, track progress
      - **instructor**: Can manage courses and content
      - **admin**: Full system access
      
      ## Error Handling
      All errors follow RFC 7807 (Problem Details for HTTP APIs)
    `)
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter JWT token obtained from /auth/login'
    })
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User profile management')
    .addTag('Courses', 'Course catalog and enrollment')
    .addTag('Videos', 'Video content and progress tracking')
    .setContact('API Support', 'https://revalidaitalia.com/support', 'api@revalidaitalia.com')
    .setLicense('Proprietary', 'https://revalidaitalia.com/terms')
    .addServer('http://localhost:3333', 'Local Development')
    .addServer('https://api.revalidaitalia.com', 'Production')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  if (process.env.NODE_ENV === 'development') {
    const prisma = new PrismaClient();
    await import('./seed');
    await prisma.$disconnect();
  }

  await app.listen(process.env.PORT ?? 3333);
}

bootstrap();
