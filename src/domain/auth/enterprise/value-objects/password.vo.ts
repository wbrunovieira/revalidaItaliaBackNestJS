// src/domain/auth/enterprise/value-objects/password.vo.ts
import { hash, compare } from 'bcryptjs';
import { WeakPasswordException } from '@/domain/auth/domain/exceptions/weak-password.exception';

// =====================================
// = Constants
// =====================================

const MIN_LENGTH = 6;
const MAX_LENGTH = 100;
const DEFAULT_SALT_ROUNDS = 10;

// =====================================
// = Value Object
// =====================================

/**
 * Password Value Object
 * 
 * Encapsulates password validation and hashing logic.
 * Ensures passwords meet security requirements and handles
 * both plain text and hashed password scenarios.
 */
export class Password {
  private constructor(
    private readonly _value: string,
    private readonly isHashed: boolean,
  ) {}

  // ===== Getters =====

  /**
   * Get the password value (hash or plain)
   * Use with caution - prefer using compare() method
   */
  get hash(): string {
    if (!this.isHashed) {
      throw new Error('Cannot get hash from unhashed password. Use toHash() first.');
    }
    return this._value;
  }

  /**
   * Get the raw value (for persistence)
   * Only use when you know what you're doing
   */
  get value(): string {
    return this._value;
  }

  // ===== Public Methods =====

  /**
   * Compare a plain text password with this password
   */
  async compare(plainPassword: string): Promise<boolean> {
    if (!this.isHashed) {
      return this._value === plainPassword;
    }
    return compare(plainPassword, this._value);
  }

  /**
   * Convert plain password to hashed password
   */
  async toHash(saltRounds: number = DEFAULT_SALT_ROUNDS): Promise<Password> {
    if (this.isHashed) {
      return this;
    }
    const hashed = await hash(this._value, saltRounds);
    return new Password(hashed, true);
  }

  /**
   * Check if password is already hashed
   */
  isPasswordHashed(): boolean {
    return this.isHashed;
  }

  // ===== Static Factory Methods =====

  /**
   * Create Password from plain text
   * Validates password strength requirements
   */
  static createFromPlain(plainPassword: string): Password {
    // Basic validation
    if (!plainPassword || typeof plainPassword !== 'string') {
      throw new WeakPasswordException('Password must be a non-empty string');
    }

    if (plainPassword.length < MIN_LENGTH) {
      throw WeakPasswordException.tooShort(plainPassword.length, MIN_LENGTH);
    }

    if (plainPassword.length > MAX_LENGTH) {
      throw new WeakPasswordException(`Password must be at most ${MAX_LENGTH} characters long`);
    }

    // Security validations with Unicode support
    // Check for uppercase letters (including Unicode)
    if (!/[A-ZÀ-ÖØ-ÞĀ-ſƀ-ɏ]/u.test(plainPassword)) {
      throw WeakPasswordException.missingUppercase();
    }

    // Check for lowercase letters (including Unicode)
    if (!/[a-zà-öø-þĀ-ſƀ-ɏ]/u.test(plainPassword)) {
      throw WeakPasswordException.missingLowercase();
    }

    // Check for numbers
    if (!/[0-9]/.test(plainPassword)) {
      throw WeakPasswordException.missingNumber();
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '123456', 'qwerty', 'letmein'];
    if (weakPasswords.some(weak => plainPassword.toLowerCase().includes(weak))) {
      throw WeakPasswordException.tooCommon();
    }

    return new Password(plainPassword, false);
  }

  /**
   * Create Password from existing hash
   * Assumes the hash is valid (from database)
   */
  static createFromHash(hashedPassword: string): Password {
    if (!hashedPassword || typeof hashedPassword !== 'string') {
      throw new Error('Hashed password must be a non-empty string');
    }

    // Basic bcrypt hash validation (starts with $2a$, $2b$, or $2y$)
    if (!/^\$2[aby]\$\d{2}\$/.test(hashedPassword)) {
      throw new Error('Invalid password hash format');
    }

    return new Password(hashedPassword, true);
  }
}