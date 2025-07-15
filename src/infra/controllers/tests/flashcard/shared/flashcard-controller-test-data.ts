// src/infra/controllers/tests/flashcard/shared/flashcard-controller-test-data.ts

import { CreateFlashcardResponseDto } from '@/domain/flashcard/application/dtos/create-flashcard-response.dto';
import { GetFlashcardByIdResponseDto } from '@/domain/flashcard/application/dtos/get-flashcard-by-id-response.dto';
import { CreateFlashcardDto } from '@/infra/controllers/dtos/create-flashcard.dto';

export class FlashcardControllerTestData {
  static readonly VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
  static readonly ARGUMENT_ID = '7f5a6c3b-1234-4567-8901-234567890123';
  static readonly TAG_ID_1 = 'a1234567-1234-4567-8901-234567890123';
  static readonly TAG_ID_2 = 'b1234567-1234-4567-8901-234567890123';

  static readonly validCreateFlashcardDtos = {
    textOnly: (): CreateFlashcardDto => ({
      question: {
        type: 'TEXT',
        content: 'What is the capital of Brazil?',
      },
      answer: {
        type: 'TEXT',
        content: 'Brasília',
      },
      argumentId: FlashcardControllerTestData.ARGUMENT_ID,
    }),

    imageOnly: (): CreateFlashcardDto => ({
      question: {
        type: 'IMAGE',
        content: 'https://example.com/question.jpg',
      },
      answer: {
        type: 'IMAGE',
        content: 'https://example.com/answer.jpg',
      },
      argumentId: FlashcardControllerTestData.ARGUMENT_ID,
    }),

    mixedImageText: (): CreateFlashcardDto => ({
      question: {
        type: 'IMAGE',
        content: 'https://example.com/anatomy-diagram.jpg',
      },
      answer: {
        type: 'TEXT',
        content: 'The heart is a muscular organ that pumps blood',
      },
      argumentId: FlashcardControllerTestData.ARGUMENT_ID,
    }),

    mixedTextImage: (): CreateFlashcardDto => ({
      question: {
        type: 'TEXT',
        content: 'What organ is shown in the diagram?',
      },
      answer: {
        type: 'IMAGE',
        content: 'https://example.com/heart-diagram.jpg',
      },
      argumentId: FlashcardControllerTestData.ARGUMENT_ID,
    }),

    withTags: (): CreateFlashcardDto => ({
      question: {
        type: 'TEXT',
        content: 'What is the function of the heart?',
      },
      answer: {
        type: 'TEXT',
        content: 'Pumping blood throughout the body',
      },
      argumentId: FlashcardControllerTestData.ARGUMENT_ID,
      tagIds: [
        FlashcardControllerTestData.TAG_ID_1,
        FlashcardControllerTestData.TAG_ID_2,
      ],
    }),

    withCustomSlug: (): CreateFlashcardDto => ({
      question: {
        type: 'TEXT',
        content: 'What is the capital of Italy?',
      },
      answer: {
        type: 'TEXT',
        content: 'Rome',
      },
      argumentId: FlashcardControllerTestData.ARGUMENT_ID,
      slug: 'italy-capital',
    }),

    withImportBatchId: (): CreateFlashcardDto => ({
      question: {
        type: 'TEXT',
        content: 'What is the capital of France?',
      },
      answer: {
        type: 'TEXT',
        content: 'Paris',
      },
      argumentId: FlashcardControllerTestData.ARGUMENT_ID,
      importBatchId: 'batch-123',
    }),

    complete: (): CreateFlashcardDto => ({
      question: {
        type: 'TEXT',
        content: 'What is the capital of Germany?',
      },
      answer: {
        type: 'TEXT',
        content: 'Berlin',
      },
      argumentId: FlashcardControllerTestData.ARGUMENT_ID,
      tagIds: [FlashcardControllerTestData.TAG_ID_1],
      slug: 'germany-capital',
      importBatchId: 'batch-456',
    }),
  };

  static readonly invalidCreateFlashcardDtos = {
    missingQuestion: (): any => ({
      answer: {
        type: 'TEXT',
        content: 'Answer without question',
      },
      argumentId: FlashcardControllerTestData.ARGUMENT_ID,
    }),

    missingAnswer: (): any => ({
      question: {
        type: 'TEXT',
        content: 'Question without answer',
      },
      argumentId: FlashcardControllerTestData.ARGUMENT_ID,
    }),

    missingArgumentId: (): any => ({
      question: {
        type: 'TEXT',
        content: 'Question',
      },
      answer: {
        type: 'TEXT',
        content: 'Answer',
      },
    }),

    invalidQuestionType: (): any => ({
      question: {
        type: 'INVALID',
        content: 'Question',
      },
      answer: {
        type: 'TEXT',
        content: 'Answer',
      },
      argumentId: FlashcardControllerTestData.ARGUMENT_ID,
    }),

    emptyQuestionContent: (): any => ({
      question: {
        type: 'TEXT',
        content: '',
      },
      answer: {
        type: 'TEXT',
        content: 'Answer',
      },
      argumentId: FlashcardControllerTestData.ARGUMENT_ID,
    }),

    tooLongContent: (): any => ({
      question: {
        type: 'TEXT',
        content: 'a'.repeat(1001),
      },
      answer: {
        type: 'TEXT',
        content: 'Answer',
      },
      argumentId: FlashcardControllerTestData.ARGUMENT_ID,
    }),

    invalidArgumentId: (): any => ({
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

    invalidTagIds: (): any => ({
      question: {
        type: 'TEXT',
        content: 'Question',
      },
      answer: {
        type: 'TEXT',
        content: 'Answer',
      },
      argumentId: FlashcardControllerTestData.ARGUMENT_ID,
      tagIds: ['invalid-tag-id'],
    }),

    invalidSlug: (): any => ({
      question: {
        type: 'TEXT',
        content: 'Question',
      },
      answer: {
        type: 'TEXT',
        content: 'Answer',
      },
      argumentId: FlashcardControllerTestData.ARGUMENT_ID,
      slug: 'Invalid Slug!',
    }),
  };

  static readonly successResponses = {
    textOnly: (): CreateFlashcardResponseDto => ({
      flashcard: {
        id: FlashcardControllerTestData.VALID_UUID,
        slug: 'what-is-the-capital-of-brazil',
        question: {
          type: 'TEXT',
          content: 'What is the capital of Brazil?',
        },
        answer: {
          type: 'TEXT',
          content: 'Brasília',
        },
        argumentId: FlashcardControllerTestData.ARGUMENT_ID,
        tagIds: [],
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
    }),

    withTags: (): CreateFlashcardResponseDto => ({
      flashcard: {
        id: FlashcardControllerTestData.VALID_UUID,
        slug: 'what-is-the-function-of-the-heart',
        question: {
          type: 'TEXT',
          content: 'What is the function of the heart?',
        },
        answer: {
          type: 'TEXT',
          content: 'Pumping blood throughout the body',
        },
        argumentId: FlashcardControllerTestData.ARGUMENT_ID,
        tagIds: [
          FlashcardControllerTestData.TAG_ID_1,
          FlashcardControllerTestData.TAG_ID_2,
        ],
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
    }),

    complete: (): CreateFlashcardResponseDto => ({
      flashcard: {
        id: FlashcardControllerTestData.VALID_UUID,
        slug: 'germany-capital',
        question: {
          type: 'TEXT',
          content: 'What is the capital of Germany?',
        },
        answer: {
          type: 'TEXT',
          content: 'Berlin',
        },
        argumentId: FlashcardControllerTestData.ARGUMENT_ID,
        tagIds: [FlashcardControllerTestData.TAG_ID_1],
        importBatchId: 'batch-456',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
    }),
  };

  static readonly errorDetails = {
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

  static readonly getByIdResponses = {
    withoutTags: (): GetFlashcardByIdResponseDto => ({
      flashcard: {
        id: FlashcardControllerTestData.VALID_UUID,
        slug: 'what-is-domain-driven-design',
        question: {
          type: 'TEXT',
          content: 'What is Domain-Driven Design?',
        },
        answer: {
          type: 'TEXT',
          content: 'DDD is an approach to software development that centers the development on programming a domain model',
        },
        argumentId: FlashcardControllerTestData.ARGUMENT_ID,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
    }),

    withTags: (): GetFlashcardByIdResponseDto => ({
      flashcard: {
        id: FlashcardControllerTestData.VALID_UUID,
        slug: 'what-is-domain-driven-design',
        question: {
          type: 'TEXT',
          content: 'What is Domain-Driven Design?',
        },
        answer: {
          type: 'TEXT',
          content: 'DDD is an approach to software development that centers the development on programming a domain model',
        },
        argumentId: FlashcardControllerTestData.ARGUMENT_ID,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        tags: [
          {
            id: FlashcardControllerTestData.TAG_ID_1,
            name: 'Architecture',
            slug: 'architecture',
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-01T00:00:00Z'),
          },
          {
            id: FlashcardControllerTestData.TAG_ID_2,
            name: 'Design Patterns',
            slug: 'design-patterns',
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-01T00:00:00Z'),
          },
        ],
      },
    }),

    withOptionalFields: (): GetFlashcardByIdResponseDto => ({
      flashcard: {
        id: FlashcardControllerTestData.VALID_UUID,
        slug: 'imported-flashcard',
        question: {
          type: 'IMAGE',
          content: 'https://example.com/diagram.jpg',
        },
        answer: {
          type: 'TEXT',
          content: 'This is an imported flashcard',
        },
        argumentId: FlashcardControllerTestData.ARGUMENT_ID,
        importBatchId: 'batch-789',
        exportedAt: new Date('2024-01-15T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
    }),
  };
}
