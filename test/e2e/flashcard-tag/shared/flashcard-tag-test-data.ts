// test/e2e/flashcard-tag/shared/flashcard-tag-test-data.ts

export interface CreateFlashcardTagRequest {
  name: string;
  slug?: string;
}

export interface GetFlashcardTagByIdResponse {
  flashcardTag: {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface FlashcardTagErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string[]>;
}

export class FlashcardTagTestData {
  // Valid request data
  static readonly VALID_CREATE_REQUESTS = {
    SIMPLE: {
      name: 'Farmacologia',
    },
    WITH_SLUG: {
      name: 'Anatomia Cardiovascular',
      slug: 'anatomia-cardio',
    },
    MINIMAL_LENGTH: {
      name: 'ABC',
    },
    MAXIMUM_LENGTH: {
      name: 'A'.repeat(200),
    },
    SPECIAL_CHARS: {
      name: 'Anatomia & Fisiologia',
    },
  };

  // Invalid request data
  static readonly INVALID_CREATE_REQUESTS = {
    EMPTY_NAME: {
      name: '',
    },
    TOO_SHORT: {
      name: 'AB',
    },
    TOO_LONG: {
      name: 'A'.repeat(201),
    },
    INVALID_SLUG_UPPERCASE: {
      name: 'Valid Name',
      slug: 'Invalid-SLUG',
    },
    INVALID_SLUG_SPACES: {
      name: 'Valid Name',
      slug: 'invalid slug',
    },
    INVALID_SLUG_UNDERSCORE: {
      name: 'Valid Name',
      slug: 'invalid_slug',
    },
    TOO_SHORT_SLUG: {
      name: 'Valid Name',
      slug: 'AB',
    },
    TOO_LONG_SLUG: {
      name: 'Valid Name',
      slug: 'a'.repeat(51),
    },
  };

  // Expected response data
  static readonly EXPECTED_RESPONSES = {
    FARMACOLOGIA: {
      id: '550e8400-e29b-41d4-a716-446655440070',
      name: 'Farmacologia',
      slug: 'farmacologia',
    },
    ANATOMIA: {
      id: '550e8400-e29b-41d4-a716-446655440071',
      name: 'Anatomia',
      slug: 'anatomia',
    },
    FISIOLOGIA: {
      id: '550e8400-e29b-41d4-a716-446655440072',
      name: 'Fisiologia',
      slug: 'fisiologia',
    },
    PATOLOGIA: {
      id: '550e8400-e29b-41d4-a716-446655440073',
      name: 'Patologia',
      slug: 'patologia',
    },
    ANATOMIA_FISIOLOGIA: {
      id: '550e8400-e29b-41d4-a716-446655440074',
      name: 'Anatomia & Fisiologia',
      slug: 'anatomia-fisiologia',
    },
  };

  // Error responses
  static readonly ERROR_RESPONSES = {
    NOT_FOUND: {
      error: 'FLASHCARD_TAG_NOT_FOUND',
      message: 'FlashcardTag not found',
    },
    INVALID_INPUT: {
      error: 'INVALID_INPUT',
      message: 'Invalid input data',
    },
    DUPLICATE_TAG: {
      error: 'DUPLICATE_FLASHCARD_TAG',
      message: 'FlashcardTag with this name already exists',
    },
    INTERNAL_ERROR: {
      error: 'INTERNAL_ERROR',
      message: 'Unexpected error occurred',
    },
  };

  // Test UUIDs
  static readonly TEST_UUIDS = {
    VALID_EXISTING: '550e8400-e29b-41d4-a716-446655440070',
    VALID_NON_EXISTING: '550e8400-e29b-41d4-a716-446655440999',
    INVALID_FORMAT: 'invalid-uuid-format',
    MALFORMED: '550e8400-e29b-41d4-a716-44665544000g',
    EMPTY: '',
    NIL: '00000000-0000-0000-0000-000000000000',
    MAX: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  };

  // Common validation error details
  static readonly VALIDATION_ERRORS = {
    EMPTY_NAME: {
      name: ['Name cannot be empty after trimming'],
    },
    TOO_SHORT_NAME: {
      name: ['Name must be at least 3 characters long'],
    },
    TOO_LONG_NAME: {
      name: ['Name cannot exceed 50 characters'],
    },
    INVALID_UUID: {
      id: ['ID must be a valid UUID'],
    },
    EMPTY_ID: {
      id: ['ID cannot be empty'],
    },
    INVALID_SLUG: {
      slug: ['Slug must contain only lowercase letters, numbers, and hyphens'],
    },
    TOO_SHORT_SLUG: {
      slug: ['Slug must be at least 3 characters long'],
    },
    TOO_LONG_SLUG: {
      slug: ['Slug cannot exceed 50 characters'],
    },
  };
}
