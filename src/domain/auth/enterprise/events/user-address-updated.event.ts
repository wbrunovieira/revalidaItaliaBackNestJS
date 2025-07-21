// src/domain/auth/enterprise/events/user-address-updated.event.ts
import { DomainEvent } from '@/core/domain/domain-event';
import { UniqueEntityID } from '@/core/unique-entity-id';

export class UserAddressUpdatedEvent extends DomainEvent {
  public readonly userId: string;
  public readonly addressId: string;
  public readonly timestamp: Date;

  constructor(
    userId: string,
    addressId: string,
    timestamp?: Date
  ) {
    super();
    this.userId = userId;
    this.addressId = addressId;
    this.timestamp = timestamp || new Date();
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.userId);
  }
}