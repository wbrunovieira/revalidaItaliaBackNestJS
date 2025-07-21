// src/infra/events/handlers/domain-event-logger.handler.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@/core/domain/domain-event';

/**
 * Domain Event Logger
 * 
 * Infrastructure handler that logs all domain events.
 * Listens to the wildcard event 'domain.*' to capture all events.
 */
@Injectable()
export class DomainEventLoggerHandler {
  @OnEvent('domain.*')
  async handleAllEvents(event: DomainEvent): Promise<void> {
    console.log(`[Event] ${event.constructor.name}:`, {
      aggregateId: event.getAggregateId().toString(),
      occurredAt: event.occurredAt,
      event: event,
    });
    
    // In production, you might want to:
    // - Send to an event store
    // - Send to monitoring service
    // - Store in audit log
  }
}