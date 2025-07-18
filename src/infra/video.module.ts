// src/infra/course-catalog/video.module.ts
import { Module } from '@nestjs/common';
import { CreateVideoUseCase } from '@/domain/course-catalog/application/use-cases/create-video.use-case';
import { GetVideoUseCase } from '@/domain/course-catalog/application/use-cases/get-video.use-case';
import { ListVideosUseCase } from '@/domain/course-catalog/application/use-cases/list-videos.use-case';
import { VideoController } from './controllers/video.controller';
import { PrismaVideoRepository } from '@/infra/database/prisma/repositories/prisma-video-repository';
import { PrismaLessonRepository } from '@/infra/database/prisma/repositories/prisma-lesson-repository';
import { PandaVideoProvider } from './video/panda-video.provider';
import { DatabaseModule } from '@/infra/database/database.module';
import { HttpModule as AxiosHttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ModuleModule } from './module.module';
import { DeleteVideoUseCase } from '@/domain/course-catalog/application/use-cases/delete-video.use-case';
import { UpdateVideoUseCase } from '@/domain/course-catalog/application/use-cases/update-video.use-case';

@Module({
  imports: [DatabaseModule, AxiosHttpModule, ConfigModule, ModuleModule],
  controllers: [VideoController],
  providers: [
    CreateVideoUseCase,
    GetVideoUseCase,
    ListVideosUseCase,
    DeleteVideoUseCase,
    UpdateVideoUseCase,

    { provide: 'VideoRepository', useClass: PrismaVideoRepository },
    { provide: 'LessonRepository', useClass: PrismaLessonRepository },
    { provide: 'VideoHostProvider', useClass: PandaVideoProvider },
  ],
  exports: [
    CreateVideoUseCase,
    GetVideoUseCase,
    ListVideosUseCase,
    DeleteVideoUseCase,
    UpdateVideoUseCase,
    'VideoRepository',
    'LessonRepository',
  ],
})
export class VideoModule {}
