import { NestFactory } from '@nestjs/core'
import { AppModule }  from './app.module'
import { BadRequestException, ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://18.118.80.184:3000',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  })

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
  )

  await app.listen(process.env.PORT ?? 3333)
}

bootstrap();