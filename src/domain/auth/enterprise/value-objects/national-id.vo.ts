// src/domain/auth/enterprise/value-objects/national-id.vo.ts

// =====================================
// = Constants
// =====================================

const MIN_LENGTH = 3;
const MAX_LENGTH = 50;
const MASK_VISIBLE_CHARS = 4;
const ALPHANUMERIC_ONLY_REGEX = /[^a-zA-Z0-9]/g;

// =====================================
// = Value Object
// =====================================

/**
 * NationalId Value Object
 * 
 * Generic national identification document.
 * Accepts any format to support international users.
 * 
 * @example
 * const nationalId = NationalId.create('ABC-123-XYZ');
 * console.log(nationalId.value);      // 'ABC-123-XYZ'
 * console.log(nationalId.normalized); // 'ABC123XYZ'
 * console.log(nationalId.mask());     // '*******-XYZ'
 */
export class NationalId {
  constructor(public readonly value: string) {
    this.validate();
  }

  // ===== Private Methods =====

  private validate(): void {
    const trimmed = this.value.trim();
    
    if (!trimmed) {
      throw new Error('National ID cannot be empty');
    }

    if (trimmed.length < MIN_LENGTH) {
      throw new Error(`National ID must have at least ${MIN_LENGTH} characters`);
    }

    if (trimmed.length > MAX_LENGTH) {
      throw new Error(`National ID cannot exceed ${MAX_LENGTH} characters`);
    }
  }

  // ===== Public Getters =====

  /**
   * Remove special characters for storage and comparison
   * @example "ABC-123" returns "ABC123"
   */
  get normalized(): string {
    return this.value.replace(ALPHANUMERIC_ONLY_REGEX, '').toUpperCase();
  }

  // ===== Public Methods =====

  /**
   * Mask the national ID for display (show only last characters)
   * @example "1234567890" returns "******7890"
   */
  mask(): string {
    if (this.value.length <= MASK_VISIBLE_CHARS) {
      return '*'.repeat(this.value.length);
    }
    
    const visiblePart = this.value.slice(-MASK_VISIBLE_CHARS);
    const maskedPart = '*'.repeat(this.value.length - MASK_VISIBLE_CHARS);
    return maskedPart + visiblePart;
  }

  /**
   * Check equality with another NationalId
   * Uses normalized values for comparison
   */
  equals(other: NationalId): boolean {
    return this.normalized === other.normalized;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value;
  }

  // ===== Static Factory Methods =====

  /**
   * Create a NationalId instance
   * @param value The national ID string to validate and create
   * @returns NationalId instance or throws error if invalid
   */
  static create(value: string): NationalId {
    return new NationalId(value.trim());
  }
}