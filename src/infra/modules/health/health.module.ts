// src/infra/modules/health/health.module.ts
import { Module } from '@nestjs/common';

import { HealthController } from '@/infra/controllers/health.controller';

/**
 * Health Module
 *
 * Provides health check endpoints for monitoring and orchestration.
 * Used by Kubernetes, Docker, and load balancers to verify service status.
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
