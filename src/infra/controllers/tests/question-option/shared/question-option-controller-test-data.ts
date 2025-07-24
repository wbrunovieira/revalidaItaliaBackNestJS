// src/infra/controllers/tests/question-option/shared/question-option-controller-test-data.ts
import { CreateQuestionOptionDto } from '@/domain/assessment/application/dtos/create-question-option.dto';
import { CreateQuestionOptionResponse } from '@/domain/assessment/application/dtos/create-question-option-response.dto';

export class QuestionOptionControllerTestData {
  // Valid question IDs
  static readonly VALID_QUESTION_IDS = {
    MULTIPLE_CHOICE: '550e8400-e29b-41d4-a716-446655440022',
    OPEN_QUESTION: '550e8400-e29b-41d4-a716-446655440062',
  };

  // Invalid question IDs
  static readonly INVALID_QUESTION_IDS = {
    INVALID_UUID: 'invalid-uuid',
    NOT_FOUND: '550e8400-e29b-41d4-a716-446655440000',
  };

  // Valid DTOs
  static readonly VALID_DTOS: Record<string, CreateQuestionOptionDto> = {
    SIMPLE_OPTION: {
      text: 'Paris',
    },
    OPTION_WITH_SPECIAL_CHARS: {
      text: 'São Paulo (Brasil) - R$ 1.500,00',
    },
    LONG_OPTION: {
      text: 'This is a very long option text that contains detailed information about the topic and should be within the 500 character limit but still be quite comprehensive in its explanation.',
    },
    MEDICAL_OPTION: {
      text: 'Hipertensão arterial sistêmica (HAS)',
    },
  };

  // Invalid DTOs
  static readonly INVALID_DTOS: Record<string, any> = {
    EMPTY_TEXT: {
      text: '',
    },
    WHITESPACE_TEXT: {
      text: '   ',
    },
    MISSING_TEXT: {},
    TOO_LONG_TEXT: {
      text: 'a'.repeat(501),
    },
    NULL_TEXT: {
      text: null,
    },
    NUMBER_TEXT: {
      text: 123,
    },
  };

  // Success responses
  static readonly SUCCESS_RESPONSES: Record<
    string,
    CreateQuestionOptionResponse
  > = {
    SIMPLE_OPTION: {
      questionOption: {
        id: '550e8400-e29b-41d4-a716-446655440100',
        text: 'Paris',
        questionId: '550e8400-e29b-41d4-a716-446655440022',
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
      },
    },
    OPTION_WITH_SPECIAL_CHARS: {
      questionOption: {
        id: '550e8400-e29b-41d4-a716-446655440101',
        text: 'São Paulo (Brasil) - R$ 1.500,00',
        questionId: '550e8400-e29b-41d4-a716-446655440022',
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
      },
    },
    MEDICAL_OPTION: {
      questionOption: {
        id: '550e8400-e29b-41d4-a716-446655440102',
        text: 'Hipertensão arterial sistêmica (HAS)',
        questionId: '550e8400-e29b-41d4-a716-446655440062',
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
      },
    },
  };

  // Error messages
  static readonly ERROR_MESSAGES = {
    INVALID_INPUT: 'Invalid input data',
    QUESTION_NOT_FOUND: 'Question not found',
    REPOSITORY_ERROR: 'Repository error occurred',
    UNKNOWN_ERROR: 'An unexpected error occurred',
  };

  // HTTP error responses
  static readonly HTTP_ERROR_RESPONSES = {
    BAD_REQUEST: {
      error: 'INVALID_INPUT',
      message: 'Invalid input data',
    },
    NOT_FOUND: {
      error: 'QUESTION_NOT_FOUND',
      message: 'Question not found',
    },
    INTERNAL_SERVER_ERROR: {
      error: 'REPOSITORY_ERROR',
      message: 'Repository error occurred',
    },
    UNKNOWN_ERROR: {
      error: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
    },
  };
}
