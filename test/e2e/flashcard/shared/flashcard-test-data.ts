// test/e2e/flashcard/shared/flashcard-test-data.ts
export class FlashcardTestData {
  static readonly TEST_UUIDS = {
    VALID: '550e8400-e29b-41d4-a716-446655440000',
    ARGUMENT_ID: '7f5a6c3b-1234-4567-8901-234567890123',
    TAG_ID_1: 'a1234567-1234-4567-8901-234567890123',
    TAG_ID_2: 'b1234567-1234-4567-8901-234567890123',
    NON_EXISTENT: '999e8400-e29b-41d4-a716-446655440999',
    INVALID: 'invalid-uuid',
    EMPTY: '',
  };

  static readonly validRequests = {
    textOnly: () => ({
      question: {
        type: 'TEXT',
        content: 'What is the capital of Brazil?',
      },
      answer: {
        type: 'TEXT',
        content: 'Brasília',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
    }),

    imageOnly: () => ({
      question: {
        type: 'IMAGE',
        content: 'https://example.com/question.jpg',
      },
      answer: {
        type: 'IMAGE',
        content: 'https://example.com/answer.jpg',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
    }),

    imageText: () => ({
      question: {
        type: 'IMAGE',
        content: 'https://example.com/anatomy-diagram.jpg',
      },
      answer: {
        type: 'TEXT',
        content: 'The heart is a muscular organ that pumps blood throughout the body',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
    }),

    textImage: () => ({
      question: {
        type: 'TEXT',
        content: 'What organ is shown in the diagram?',
      },
      answer: {
        type: 'IMAGE',
        content: 'https://example.com/heart-diagram.jpg',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
    }),

    withTags: () => ({
      question: {
        type: 'TEXT',
        content: 'What is the function of the heart?',
      },
      answer: {
        type: 'TEXT',
        content: 'Pumping blood throughout the body',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
      tagIds: [
        FlashcardTestData.TEST_UUIDS.TAG_ID_1,
        FlashcardTestData.TEST_UUIDS.TAG_ID_2,
      ],
    }),

    withCustomSlug: () => ({
      question: {
        type: 'TEXT',
        content: 'What is the capital of Italy?',
      },
      answer: {
        type: 'TEXT',
        content: 'Rome',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
      slug: 'italy-capital',
    }),

    withImportBatchId: () => ({
      question: {
        type: 'TEXT',
        content: 'What is the capital of France?',
      },
      answer: {
        type: 'TEXT',
        content: 'Paris',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
      importBatchId: 'batch-123',
    }),

    complete: () => ({
      question: {
        type: 'TEXT',
        content: 'What is the capital of Germany?',
      },
      answer: {
        type: 'TEXT',
        content: 'Berlin',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
      tagIds: [FlashcardTestData.TEST_UUIDS.TAG_ID_1],
      slug: 'germany-capital',
      importBatchId: 'batch-456',
    }),
  };

  static readonly invalidRequests = {
    missingQuestion: () => ({
      answer: {
        type: 'TEXT',
        content: 'Answer without question',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
    }),

    missingAnswer: () => ({
      question: {
        type: 'TEXT',
        content: 'Question without answer',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
    }),

    missingArgumentId: () => ({
      question: {
        type: 'TEXT',
        content: 'Question',
      },
      answer: {
        type: 'TEXT',
        content: 'Answer',
      },
    }),

    invalidQuestionType: () => ({
      question: {
        type: 'INVALID',
        content: 'Question',
      },
      answer: {
        type: 'TEXT',
        content: 'Answer',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
    }),

    emptyQuestionContent: () => ({
      question: {
        type: 'TEXT',
        content: '',
      },
      answer: {
        type: 'TEXT',
        content: 'Answer',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
    }),

    tooLongContent: () => ({
      question: {
        type: 'TEXT',
        content: 'a'.repeat(1001),
      },
      answer: {
        type: 'TEXT',
        content: 'Answer',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
    }),

    invalidArgumentId: () => ({
      question: {
        type: 'TEXT',
        content: 'Question',
      },
      answer: {
        type: 'TEXT',
        content: 'Answer',
      },
      argumentId: 'invalid-uuid',
    }),

    nonExistentArgumentId: () => ({
      question: {
        type: 'TEXT',
        content: 'Question',
      },
      answer: {
        type: 'TEXT',
        content: 'Answer',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.NON_EXISTENT,
    }),

    invalidTagIds: () => ({
      question: {
        type: 'TEXT',
        content: 'Question',
      },
      answer: {
        type: 'TEXT',
        content: 'Answer',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
      tagIds: ['invalid-tag-id'],
    }),

    nonExistentTagIds: () => ({
      question: {
        type: 'TEXT',
        content: 'Question',
      },
      answer: {
        type: 'TEXT',
        content: 'Answer',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
      tagIds: [FlashcardTestData.TEST_UUIDS.NON_EXISTENT],
    }),

    invalidSlug: () => ({
      question: {
        type: 'TEXT',
        content: 'Question',
      },
      answer: {
        type: 'TEXT',
        content: 'Answer',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
      slug: 'Invalid Slug!',
    }),

    duplicateSlug: () => ({
      question: {
        type: 'TEXT',
        content: 'New Question',
      },
      answer: {
        type: 'TEXT',
        content: 'New Answer',
      },
      argumentId: FlashcardTestData.TEST_UUIDS.ARGUMENT_ID,
      slug: 'existing-slug', // This will be created before the test
    }),
  };

  static readonly expectedErrors = {
    missingFields: {
      question: ['question should not be empty'],
      answer: ['answer should not be empty'],
      argumentId: [
        'argumentId should not be empty',
        'argumentId must be a UUID',
      ],
    },
    invalidType: {
      'question.type': [
        'type must be one of the following values: TEXT, IMAGE',
      ],
    },
    emptyContent: {
      'question.content': [
        'content should not be empty',
        'content must be longer than or equal to 1 characters',
      ],
    },
    tooLongContent: {
      'question.content': [
        'content must be shorter than or equal to 1000 characters',
      ],
    },
    invalidUuid: {
      argumentId: ['argumentId must be a UUID'],
    },
    invalidTagIds: {
      'tagIds.0': ['each value in tagIds must be a UUID'],
    },
    invalidSlug: {
      slug: ['Slug must contain only lowercase letters, numbers, and hyphens'],
    },
  };
}