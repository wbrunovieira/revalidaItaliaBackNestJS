// src/core/domain/events/i-event-dispatcher.ts
import { DomainEvent } from '../domain-event';

/**
 * Event Dispatcher Interface
 *
 * Defines the contract for dispatching domain events.
 * Implementations can use different strategies (in-memory, message queue, etc.)
 */
export interface IEventDispatcher {
  /**
   * Dispatch a domain event
   * @param event The domain event to dispatch
   */
  dispatch(event: DomainEvent): Promise<void>;
}

/**
 * Injection token for IEventDispatcher
 */
export const EVENT_DISPATCHER = Symbol('IEventDispatcher');
