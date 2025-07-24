export class FlashcardTagControllerTestData {
  static readonly VALID_IDS = {
    FLASHCARD_TAG: '550e8400-e29b-41d4-a716-446655440100',
    FLASHCARD_TAG_2: '550e8400-e29b-41d4-a716-446655440101',
  };

  static readonly VALID_DTOS = {
    SIMPLE_TAG: {
      name: 'Farmacologia',
    },
    TAG_WITH_SLUG: {
      name: 'Anatomia Cardiovascular',
      slug: 'anatomia-cardio',
    },
    MINIMAL_NAME: {
      name: 'ABC',
    },
    MAXIMUM_NAME: {
      name: 'A'.repeat(50),
    },
  };

  static readonly INVALID_DTOS = {
    EMPTY_NAME: { name: '' },
    TOO_SHORT_NAME: { name: 'AB' },
    TOO_LONG_NAME: { name: 'A'.repeat(51) },
    INVALID_SLUG_UPPERCASE: { name: 'Valid Name', slug: 'Invalid-SLUG' },
    INVALID_SLUG_SPACES: { name: 'Valid Name', slug: 'invalid slug' },
    INVALID_SLUG_UNDERSCORE: { name: 'Valid Name', slug: 'invalid_slug' },
    TOO_SHORT_SLUG: { name: 'Valid Name', slug: 'AB' },
    TOO_LONG_SLUG: { name: 'Valid Name', slug: 'a'.repeat(51) },
    EXTRA_FIELD: { name: 'Valid Name', extraField: 'not allowed' },
  };

  static readonly SUCCESS_RESPONSES = {
    SIMPLE_TAG: {
      flashcardTag: {
        id: '550e8400-e29b-41d4-a716-446655440100',
        name: 'Farmacologia',
        slug: 'farmacologia',
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
      },
    },
    TAG_WITH_SLUG: {
      flashcardTag: {
        id: '550e8400-e29b-41d4-a716-446655440101',
        name: 'Anatomia Cardiovascular',
        slug: 'anatomia-cardio',
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
      },
    },
  };

  static readonly ERROR_RESPONSES = {
    INVALID_INPUT: {
      error: 'INVALID_INPUT',
      message: 'Invalid input data',
      details: {
        name: ['Name must be at least 3 characters long'],
      },
    },
    DUPLICATE_TAG: {
      error: 'DUPLICATE_FLASHCARD_TAG',
      message: 'FlashcardTag with this name already exists',
    },
    NOT_FOUND: {
      error: 'FLASHCARD_TAG_NOT_FOUND',
      message: 'FlashcardTag not found',
    },
    INTERNAL_ERROR: {
      error: 'INTERNAL_ERROR',
      message: 'Unexpected error occurred',
    },
  };

  // Helper methods for GET by ID tests
  static validFlashcardTag() {
    return {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Farmacologia',
      slug: 'farmacologia',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };
  }

  static flashcardTagWithSpecialChars() {
    return {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Anatomia & Fisiologia',
      slug: 'anatomia-fisiologia',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };
  }

  static flashcardTagWithCustomSlug() {
    return {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Medicina Legal',
      slug: 'med-legal',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };
  }

  static flashcardTagWithDifferentTimestamps() {
    return {
      id: '550e8400-e29b-41d4-a716-446655440004',
      name: 'Patologia',
      slug: 'patologia',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T01:00:00.000Z'), // 1 hour later
    };
  }

  // Helper methods for List All tests
  static multipleFlashcardTags() {
    return [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Anatomia',
        slug: 'anatomia',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Farmacologia',
        slug: 'farmacologia',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Fisiologia',
        slug: 'fisiologia',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ];
  }

  static emptyFlashcardTagsList() {
    return [];
  }

  static singleFlashcardTag() {
    return [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Única Tag',
        slug: 'unica-tag',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ];
  }

  static flashcardTagsWithSpecialChars() {
    return [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Anatomia & Fisiologia',
        slug: 'anatomia-fisiologia',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Médico Português',
        slug: 'medico-portugues',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ];
  }

  static readonly LIST_ALL_SUCCESS_RESPONSES = {
    MULTIPLE_TAGS: {
      flashcardTags: this.multipleFlashcardTags(),
    },
    EMPTY_LIST: {
      flashcardTags: this.emptyFlashcardTagsList(),
    },
    SINGLE_TAG: {
      flashcardTags: this.singleFlashcardTag(),
    },
    SPECIAL_CHARS: {
      flashcardTags: this.flashcardTagsWithSpecialChars(),
    },
  };
}
