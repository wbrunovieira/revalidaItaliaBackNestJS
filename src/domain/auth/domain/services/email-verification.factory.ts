// src/domain/auth/domain/services/email-verification.factory.ts

import { EmailVerificationService } from './email-verification.service';

/**
 * Factory to create EmailVerificationService with configuration
 * This is the bridge between infrastructure config and domain service
 */
export class EmailVerificationFactory {
  static create(): EmailVerificationService {
    // Here we read from environment, but the service doesn't know about it
    const verificationRequired =
      process.env.EMAIL_VERIFICATION_REQUIRED === 'true';

    // Could also read skip sources from env if needed
    return new EmailVerificationService(verificationRequired);
  }
}
