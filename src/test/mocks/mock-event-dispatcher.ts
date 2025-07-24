// src/test/mocks/mock-event-dispatcher.ts
import { IEventDispatcher } from '@/core/domain/events/i-event-dispatcher';
import { DomainEvent } from '@/core/domain/domain-event';

export class MockEventDispatcher implements IEventDispatcher {
  public dispatchedEvents: DomainEvent[] = [];

  async dispatch(event: DomainEvent): Promise<void> {
    this.dispatchedEvents.push(event);
  }

  clear(): void {
    this.dispatchedEvents = [];
  }
}
