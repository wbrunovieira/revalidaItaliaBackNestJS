// src/domain/auth/domain/services/email-verification.service.ts

/**
 * Domain Service: Email Verification Policy
 *
 * Encapsulates business rules about when email verification is required.
 * This is a domain concern, not infrastructure.
 */
export class EmailVerificationService {
  private readonly skipVerificationSources = ['admin', 'hotmart', 'api'];
  private readonly verificationRequired: boolean;

  constructor(verificationRequired: boolean = false) {
    this.verificationRequired = verificationRequired;
  }

  /**
   * Determines if email should be pre-verified based on user creation source
   */
  shouldAutoVerifyEmail(source?: string): boolean {
    if (!source) return false;
    return this.skipVerificationSources.includes(source);
  }

  /**
   * Checks if email verification is required for authentication
   */
  isVerificationRequiredForLogin(): boolean {
    return this.verificationRequired;
  }

  /**
   * Business rule: Which sources are trusted for auto-verification
   */
  getTrustedSources(): string[] {
    return [...this.skipVerificationSources];
  }
}
