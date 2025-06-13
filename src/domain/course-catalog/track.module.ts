// src/infra/course-catalog/track.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infra/database/database.module';
import { CreateTrackUseCase } from '@/domain/course-catalog/application/use-cases/create-track.use-case';
import { PrismaTrackRepository } from '@/infra/database/prisma/repositories/prisma-track-repository';
import { TrackController } from '@/infra/controllers/track.controller';
import { GetTrackUseCase } from './application/use-cases/get-track.use-case';


@Module({
  imports: [DatabaseModule],
  controllers: [TrackController],
  providers: [
    CreateTrackUseCase,
    GetTrackUseCase,
    { provide: 'TrackRepository', useClass: PrismaTrackRepository },
  ],
  exports: ['TrackRepository'],
})
export class TrackModule {}