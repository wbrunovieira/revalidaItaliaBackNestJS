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
import { GetVideoUseCase } from '@/domain/course-catalog/application/use-cases/get-video.use-case';
import { GetVideosUseCase } from '@/domain/course-catalog/application/use-cases/get-videos.use-case';

@Module({
  imports: [DatabaseModule,AxiosHttpModule,ConfigModule,ModuleModule],
  controllers: [VideoController],
  providers: [
    CreateVideoUseCase,
    GetVideoUseCase,
    GetVideosUseCase,

    { provide: 'VideoRepository', useClass: PrismaVideoRepository },
    { provide: 'VideoHostProvider', useClass: PandaVideoProvider },
  ],
  exports: [  CreateVideoUseCase,     GetVideoUseCase, GetVideosUseCase, 'VideoRepository'],
})
export class VideoModule {}