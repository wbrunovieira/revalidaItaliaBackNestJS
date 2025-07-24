// src/infra/modules/stats/stats.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/infra/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/infra/auth/guards/roles.guard';
import { Roles } from '@/infra/auth/decorators/roles.decorator';
import { StatsService } from './stats.service';

@ApiTags('Statistics')
@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('users')
  @Roles('admin')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 150 },
        byRole: {
          type: 'object',
          properties: {
            admin: { type: 'number', example: 5 },
            tutor: { type: 'number', example: 10 },
            student: { type: 'number', example: 135 },
          },
        },
        bySource: {
          type: 'object',
          properties: {
            admin: { type: 'number', example: 15 },
            hotmart: { type: 'number', example: 120 },
            api: { type: 'number', example: 15 },
          },
        },
      },
    },
  })
  async getUserStats() {
    return await this.statsService.getUserStats();
  }
}
