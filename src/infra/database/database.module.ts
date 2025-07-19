// src/infra/database/database.module.ts
import { Module } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

/**
 * Database Module
 * 
 * Provides database connection through PrismaService.
 * Repository implementations should be provided by their respective domain modules.
 */
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
