// src/infra/events/nest-event-dispatcher.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '@/core/domain/domain-event';
import { IEventDispatcher } from '@/core/domain/events/i-event-dispatcher';

/**
 * NestJS Event Dispatcher
 * 
 * Implementation of IEventDispatcher using NestJS EventEmitter2.
 * Provides async event handling with decorators support.
 */
@Injectable()
export class NestEventDispatcher implements IEventDispatcher {
  constructor(private eventEmitter: EventEmitter2) {}

  async dispatch(event: DomainEvent): Promise<void> {
    const eventName = event.constructor.name;
    
    // Emit the event asynchronously
    await this.eventEmitter.emitAsync(eventName, event);
    
    // Also emit a wildcard event for generic logging/monitoring
    await this.eventEmitter.emitAsync('domain.*', event);
  }
}