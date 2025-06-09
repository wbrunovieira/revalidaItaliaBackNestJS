// src/infra/course-catalog/video.module.ts
import { Module } from '@nestjs/common';
import { CreateVideoUseCase } from '@/domain/course-catalog/application/use-cases/create-video.use-case';

import { VideoController } from './controllers/video.controller';
import { PrismaVideoRepository } from './database/prisma/repositories/prisma-video-repository';
import { PandaVideoProvider } from './video/panda-video.provider';
import { DatabaseModule } from './database/database.module';
import { HttpModule as AxiosHttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ModuleModule } from './module.module';

@Module({
  imports: [DatabaseModule,AxiosHttpModule,ConfigModule,ModuleModule],
  controllers: [VideoController],
  providers: [
    CreateVideoUseCase,

    { provide: 'VideoRepository', useClass: PrismaVideoRepository },
    { provide: 'VideoHostProvider', useClass: PandaVideoProvider },
  ],
  exports: [  CreateVideoUseCase, 'VideoRepository'],
})
export class VideoModule {}