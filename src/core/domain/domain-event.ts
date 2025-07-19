// src/core/domain/domain-event.ts
import { UniqueEntityID } from '../unique-entity-id';

export abstract class DomainEvent {
  public readonly occurredAt: Date;

  constructor() {
    this.occurredAt = new Date();
  }

  abstract getAggregateId(): UniqueEntityID;
}