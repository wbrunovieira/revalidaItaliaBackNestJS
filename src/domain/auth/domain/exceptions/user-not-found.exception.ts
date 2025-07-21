// src/domain/auth/domain/exceptions/user-not-found.exception.ts
import { EntityNotFoundException } from '@/core/domain/exceptions';

/**
 * Exception thrown when a user is not found
 * 
 * Maintains backward compatibility with ResourceNotFoundError
 */
export class UserNotFoundError extends EntityNotFoundException {
  constructor(message: string = 'User not found') {
    // Extract criteria from message if possible
    const criteria: Record<string, any> = {};
    
    if (message.includes('id:')) {
      const match = message.match(/id:\s*(\S+)/);
      if (match) criteria.id = match[1];
    } else if (message.includes('email:')) {
      const match = message.match(/email:\s*(\S+)/);
      if (match) criteria.email = match[1];
    }
    
    super('User', criteria);
    
    // Override message to maintain compatibility
    this.message = message;
    this._code = 'USER.NOT_FOUND';
  }

  static byId(id: string): UserNotFoundError {
    const error = new UserNotFoundError(`User not found with id: ${id}`);
    error.context.id = id;
    return error;
  }

  static byEmail(email: string): UserNotFoundError {
    const error = new UserNotFoundError(`User not found with email: ${email}`);
    error.context.email = email;
    return error;
  }
}