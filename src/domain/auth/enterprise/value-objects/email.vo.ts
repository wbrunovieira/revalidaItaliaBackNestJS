// src/domain/auth/enterprise/value-objects/email.vo.ts

// =====================================
// = Constants
// =====================================

const FREE_EMAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'mail.com',
  'protonmail.com',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LOCAL_PART_LENGTH = 64; // RFC 5321
const MAX_DOMAIN_LENGTH = 255;    // RFC 5321

// =====================================
// = Value Object
// =====================================

/**
 * Email Value Object
 * 
 * Encapsulates email validation and behavior.
 * Ensures all emails in the system are valid and normalized.
 * 
 * @example
 * const email = Email.create('John.Doe@Company.com');
 * console.log(email.value);      // 'john.doe@company.com'
 * console.log(email.domain);     // 'company.com'
 * console.log(email.localPart);  // 'john.doe'
 */
export class Email {
  constructor(public readonly value: string) {
    this.validate();
  }

  // ===== Private Methods =====

  private validate(): void {
    const normalizedEmail = this.value.trim().toLowerCase();
    
    if (!Email.isValidFormat(normalizedEmail)) {
      throw new Error('Invalid email format');
    }
    
    // Update the value to normalized version
    Object.defineProperty(this, 'value', {
      value: normalizedEmail,
      writable: false,
      configurable: false
    });
  }

  // ===== Public Getters =====

  /**
   * Get the domain part of the email
   * @example "user@company.com" returns "company.com"
   */
  get domain(): string {
    return this.value.split('@')[1];
  }

  /**
   * Get the local part of the email
   * @example "user@company.com" returns "user"
   */
  get localPart(): string {
    return this.value.split('@')[0];
  }

  // ===== Public Methods =====

  /**
   * Check if email is from a business domain (not free email providers)
   */
  isBusinessEmail(): boolean {
    return !FREE_EMAIL_PROVIDERS.includes(this.domain.toLowerCase());
  }

  /**
   * Check equality with another Email
   */
  equals(other: Email): boolean {
    return this.value === other.value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value;
  }

  // ===== Static Factory Methods =====

  /**
   * Create an Email instance
   * @param email The email string to validate and create
   * @returns Email instance or throws error if invalid
   */
  static create(email: string): Email {
    return new Email(email);
  }

  // ===== Static Private Methods =====

  /**
   * Validate email format according to RFC 5321
   */
  private static isValidFormat(email: string): boolean {
    // Basic regex validation
    if (!EMAIL_REGEX.test(email)) {
      return false;
    }

    // Split and validate parts
    const [localPart, domain] = email.split('@');
    
    // Check local part length (max 64 chars per RFC)
    if (localPart.length > MAX_LOCAL_PART_LENGTH) {
      return false;
    }

    // Check domain length (max 255 chars)
    if (domain.length > MAX_DOMAIN_LENGTH) {
      return false;
    }

    // Check for consecutive dots
    if (email.includes('..')) {
      return false;
    }

    return true;
  }
}