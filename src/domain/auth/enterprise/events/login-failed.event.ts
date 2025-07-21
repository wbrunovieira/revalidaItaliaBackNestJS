// src/domain/auth/enterprise/events/login-failed.event.ts
import { DomainEvent } from '@/core/domain/domain-event';
import { UniqueEntityID } from '@/core/unique-entity-id';

export type LoginFailureReason = 'invalid_credentials' | 'account_locked' | 'email_not_verified';

export class LoginFailedEvent extends DomainEvent {
  public readonly email: string;
  public readonly reason: LoginFailureReason;
  public readonly ipAddress: string;
  public readonly attemptNumber: number;
  public readonly timestamp: Date;

  constructor(
    email: string,
    reason: LoginFailureReason,
    ipAddress: string,
    attemptNumber: number,
    timestamp?: Date
  ) {
    super();
    this.email = email;
    this.reason = reason;
    this.ipAddress = ipAddress;
    this.attemptNumber = attemptNumber;
    this.timestamp = timestamp || new Date();
  }

  getAggregateId(): UniqueEntityID {
    // Using email as aggregate id for failed login attempts
    return new UniqueEntityID(this.email);
  }
}