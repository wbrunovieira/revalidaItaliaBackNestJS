import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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

  if (process.env.NODE_ENV === 'development') {
    const prisma = new PrismaClient();
    await import('./seed');
    await prisma.$disconnect();
  }

  await app.listen(process.env.PORT ?? 3333);
}

bootstrap();
