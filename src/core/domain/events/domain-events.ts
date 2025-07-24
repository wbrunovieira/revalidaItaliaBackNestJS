// src/core/domain/events/domain-events.ts
import { DomainEvent } from '../domain-event';
import { AggregateRoot } from '../aggregate-root';
import { UniqueEntityID } from '@/core/unique-entity-id';

type DomainEventCallback = (event: DomainEvent) => void;

/**
 * Domain Events Dispatcher
 *
 * Simple in-memory implementation for managing domain events.
 * In production, this could be replaced with a message queue or event bus.
 */
export class DomainEvents {
  private static handlersMap: Map<string, DomainEventCallback[]> = new Map();
  private static markedAggregates: AggregateRoot<any>[] = [];

  /**
   * Mark an aggregate for dispatch after persistence
   */
  public static markAggregateForDispatch(aggregate: AggregateRoot<any>): void {
    const aggregateFound = !!this.findMarkedAggregateByID(aggregate.id);

    if (!aggregateFound) {
      this.markedAggregates.push(aggregate);
    }
  }

  /**
   * Dispatch events for a specific aggregate
   */
  public static dispatchEventsForAggregate(id: UniqueEntityID): void {
    const aggregate = this.findMarkedAggregateByID(id);

    if (aggregate) {
      const events = aggregate.getUncommittedEvents();
      events.forEach((event) => this.dispatch(event));

      aggregate.clearEvents();
      this.removeAggregateFromMarkedDispatchList(aggregate);
    }
  }

  /**
   * Register a handler for a specific event
   */
  public static register(
    eventClassName: string,
    callback: DomainEventCallback,
  ): void {
    if (!this.handlersMap.has(eventClassName)) {
      this.handlersMap.set(eventClassName, []);
    }
    this.handlersMap.get(eventClassName)!.push(callback);
  }

  /**
   * Clear all handlers (useful for testing)
   */
  public static clearHandlers(): void {
    this.handlersMap.clear();
  }

  /**
   * Clear all marked aggregates (useful for testing)
   */
  public static clearMarkedAggregates(): void {
    this.markedAggregates = [];
  }

  private static dispatch(event: DomainEvent): void {
    const eventClassName = event.constructor.name;

    if (this.handlersMap.has(eventClassName)) {
      const handlers = this.handlersMap.get(eventClassName)!;
      handlers.forEach((handler) => handler(event));
    }
  }

  private static findMarkedAggregateByID(
    id: UniqueEntityID,
  ): AggregateRoot<any> | undefined {
    return this.markedAggregates.find((aggregate) => aggregate.id.equals(id));
  }

  private static removeAggregateFromMarkedDispatchList(
    aggregate: AggregateRoot<any>,
  ): void {
    const index = this.markedAggregates.findIndex((a) =>
      a.id.equals(aggregate.id),
    );
    this.markedAggregates.splice(index, 1);
  }
}
