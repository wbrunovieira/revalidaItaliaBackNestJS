// src/core/domain/exceptions/domain.exception.ts

/**
 * Base class for all domain exceptions
 * 
 * Provides rich metadata for better error tracking and debugging
 * while maintaining compatibility with existing error mapping system
 */
export abstract class DomainException extends Error {
  protected _code: string;
  readonly timestamp: Date;
  readonly context: Record<string, any>;
  readonly aggregateId?: string;

  get code(): string {
    return this._code;
  }

  constructor(
    message: string,
    code: string,
    context?: Record<string, any>,
    aggregateId?: string
  ) {
    super(message);
    this._code = code;
    this.timestamp = new Date();
    this.context = context || {};
    this.aggregateId = aggregateId;
    
    // IMPORTANT: Maintain class name for error mapping compatibility
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to JSON for logging/serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      context: this.context,
      aggregateId: this.aggregateId,
      stack: this.stack
    };
  }
}