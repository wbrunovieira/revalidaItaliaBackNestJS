// src/infra/controllers/tests/question/shared/question-controller-test-data.ts
import { CreateQuestionDto } from '@/domain/assessment/application/dtos/create-question.dto';
import { GetQuestionRequest } from '@/domain/assessment/application/dtos/get-question-request.dto';

export interface QuestionControllerResponse {
  success: boolean;
  question: {
    id: string;
    text: string;
    type: 'MULTIPLE_CHOICE' | 'OPEN';
    assessmentId: string;
    argumentId?: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface ExpectedError {
  statusCode: number;
  error?: string;
  message?: string | string[];
}

export class QuestionControllerTestData {
  /**
   * Valid DTOs for successful question creation
   */
  static readonly validDtos = {
    multipleChoiceQuiz: (): CreateQuestionDto => ({
      text: 'What is the capital of Brazil?',
      type: 'MULTIPLE_CHOICE',
      assessmentId: '11111111-1111-1111-1111-111111111111',
    }),

    multipleChoiceWithArgument: (): CreateQuestionDto => ({
      text: 'Which organ performs gas exchange in the respiratory system?',
      type: 'MULTIPLE_CHOICE',
      assessmentId: '22222222-2222-2222-2222-222222222222',
      argumentId: '33333333-3333-3333-3333-333333333333',
    }),

    openQuestion: (): CreateQuestionDto => ({
      text: 'Explain the pathophysiology of hypertension and discuss the current treatment guidelines.',
      type: 'OPEN',
      assessmentId: '44444444-4444-4444-4444-444444444444',
    }),

    openQuestionWithArgument: (): CreateQuestionDto => ({
      text: 'Describe the diagnostic approach for a patient presenting with acute chest pain.',
      type: 'OPEN',
      assessmentId: '55555555-5555-5555-5555-555555555555',
      argumentId: '66666666-6666-6666-6666-666666666666',
    }),

    minLength: (): CreateQuestionDto => ({
      text: '1234567890', // exactly 10 characters
      type: 'MULTIPLE_CHOICE',
      assessmentId: '77777777-7777-7777-7777-777777777777',
    }),

    maxLength: (): CreateQuestionDto => ({
      text: 'A'.repeat(1000), // exactly 1000 characters
      type: 'MULTIPLE_CHOICE',
      assessmentId: '88888888-8888-8888-8888-888888888888',
    }),

    specialChars: (): CreateQuestionDto => ({
      text: 'Question with special chars: @#$%^&*()! and symbols: ±≤≥≠≈',
      type: 'MULTIPLE_CHOICE',
      assessmentId: '99999999-9999-9999-9999-999999999999',
    }),

    unicode: (): CreateQuestionDto => ({
      text: 'Questão em português 中文 العربية русский with emojis 🎯🚀',
      type: 'OPEN',
      assessmentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    }),

    withNewlines: (): CreateQuestionDto => ({
      text: 'Question with\nnewlines and\ntabs\tfor formatting',
      type: 'OPEN',
      assessmentId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    }),

    medical: (): CreateQuestionDto => ({
      text: 'A 65-year-old patient presents with dyspnea, orthopnea, and bilateral lower extremity edema. What is your differential diagnosis?',
      type: 'OPEN',
      assessmentId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      argumentId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    }),
  };

  /**
   * Invalid DTOs that should trigger validation errors
   */
  static readonly invalidDtos = {
    textTooShort: (): any => ({
      text: 'Short', // 5 characters
      type: 'MULTIPLE_CHOICE',
      assessmentId: '11111111-1111-1111-1111-111111111111',
    }),

    textTooLong: (): any => ({
      text: 'A'.repeat(1001), // 1001 characters
      type: 'MULTIPLE_CHOICE',
      assessmentId: '11111111-1111-1111-1111-111111111111',
    }),

    emptyText: (): any => ({
      text: '',
      type: 'MULTIPLE_CHOICE',
      assessmentId: '11111111-1111-1111-1111-111111111111',
    }),

    whitespaceText: (): any => ({
      text: '          ', // 10 spaces
      type: 'MULTIPLE_CHOICE',
      assessmentId: '11111111-1111-1111-1111-111111111111',
    }),

    invalidType: (): any => ({
      text: 'What is the correct answer?',
      type: 'INVALID_TYPE',
      assessmentId: '11111111-1111-1111-1111-111111111111',
    }),

    missingType: (): any => ({
      text: 'What is the correct answer?',
      assessmentId: '11111111-1111-1111-1111-111111111111',
    }),

    invalidAssessmentId: (): any => ({
      text: 'What is the correct answer?',
      type: 'MULTIPLE_CHOICE',
      assessmentId: 'invalid-uuid',
    }),

    missingAssessmentId: (): any => ({
      text: 'What is the correct answer?',
      type: 'MULTIPLE_CHOICE',
    }),

    invalidArgumentId: (): any => ({
      text: 'What is the correct answer?',
      type: 'MULTIPLE_CHOICE',
      assessmentId: '11111111-1111-1111-1111-111111111111',
      argumentId: 'invalid-uuid',
    }),

    nullValues: (): any => ({
      text: null,
      type: null,
      assessmentId: null,
    }),

    numberValues: (): any => ({
      text: 123,
      type: 456,
      assessmentId: 789,
    }),

    multipleErrors: (): any => ({
      text: 'Short', // Too short
      type: 'INVALID', // Invalid type
      assessmentId: 'invalid-uuid', // Invalid UUID
      argumentId: 'invalid-uuid', // Invalid UUID
    }),
  };

  /**
   * Expected success responses
   */
  static readonly expectedResponses = {
    multipleChoice: (
      assessmentId: string,
      argumentId?: string,
    ): QuestionControllerResponse => ({
      success: true,
      question: {
        id: expect.any(String),
        text: expect.any(String),
        type: 'MULTIPLE_CHOICE',
        assessmentId,
        argumentId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    }),

    openQuestion: (
      assessmentId: string,
      argumentId?: string,
    ): QuestionControllerResponse => ({
      success: true,
      question: {
        id: expect.any(String),
        text: expect.any(String),
        type: 'OPEN',
        assessmentId,
        argumentId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    }),
  };

  /**
   * Expected error responses
   */
  static readonly expectedErrors = {
    validation: (): ExpectedError => ({
      statusCode: 400,
      error: 'INVALID_INPUT',
    }),

    duplicateQuestion: (): ExpectedError => ({
      statusCode: 409,
      error: 'DUPLICATE_QUESTION',
    }),

    assessmentNotFound: (): ExpectedError => ({
      statusCode: 404,
      error: 'ASSESSMENT_NOT_FOUND',
    }),

    argumentNotFound: (): ExpectedError => ({
      statusCode: 404,
      error: 'ARGUMENT_NOT_FOUND',
    }),

    questionTypeMismatch: (): ExpectedError => ({
      statusCode: 400,
      error: 'QUESTION_TYPE_MISMATCH',
    }),

    repositoryError: (): ExpectedError => ({
      statusCode: 500,
      error: 'INTERNAL_ERROR',
    }),

    unknownError: (): ExpectedError => ({
      statusCode: 500,
      error: 'INTERNAL_ERROR',
    }),
  };

  /**
   * Assessment type scenarios for business rule testing
   */
  static readonly assessmentScenarios = {
    quiz: {
      assessmentId: '11111111-1111-1111-1111-111111111111',
      validType: 'MULTIPLE_CHOICE' as const,
      invalidType: 'OPEN' as const,
    },
    simulado: {
      assessmentId: '22222222-2222-2222-2222-222222222222',
      validType: 'MULTIPLE_CHOICE' as const,
      invalidType: 'OPEN' as const,
    },
    provaAberta: {
      assessmentId: '33333333-3333-3333-3333-333333333333',
      validType: 'OPEN' as const,
      invalidType: 'MULTIPLE_CHOICE' as const,
    },
  };

  /**
   * Get random valid DTO
   */
  static getRandomValid(): CreateQuestionDto {
    const keys = Object.keys(this.validDtos);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return (this.validDtos as any)[randomKey]();
  }

  /**
   * Get random invalid DTO
   */
  static getRandomInvalid(): any {
    const keys = Object.keys(this.invalidDtos);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return (this.invalidDtos as any)[randomKey]();
  }

  /**
   * Generate duplicate scenario data
   */
  static getDuplicateScenario(): {
    first: CreateQuestionDto;
    second: CreateQuestionDto;
  } {
    const sameText = 'What is the capital of Brazil?';
    const sameAssessmentId = '11111111-1111-1111-1111-111111111111';

    return {
      first: {
        text: sameText,
        type: 'MULTIPLE_CHOICE',
        assessmentId: sameAssessmentId,
      },
      second: {
        text: sameText,
        type: 'MULTIPLE_CHOICE',
        assessmentId: sameAssessmentId,
      },
    };
  }

  /**
   * Generate type mismatch scenario
   */
  static getTypeMismatchScenario(
    assessmentType: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA',
  ): CreateQuestionDto {
    const scenarios = this.assessmentScenarios;

    switch (assessmentType) {
      case 'QUIZ':
        return {
          text: 'This should be multiple choice for quiz',
          type: scenarios.quiz.invalidType,
          assessmentId: scenarios.quiz.assessmentId,
        };
      case 'SIMULADO':
        return {
          text: 'This should be multiple choice for simulado',
          type: scenarios.simulado.invalidType,
          assessmentId: scenarios.simulado.assessmentId,
        };
      case 'PROVA_ABERTA':
        return {
          text: 'This should be open question for prova aberta',
          type: scenarios.provaAberta.invalidType,
          assessmentId: scenarios.provaAberta.assessmentId,
        };
    }
  }

  /**
   * UUID regex pattern for validation
   */
  static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /**
   * Get Question test data
   */
  static readonly getQuestion = {
    /**
     * Valid IDs for GetQuestion requests
     */
    validIds: {
      standard: (): GetQuestionRequest => ({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      }),

      multipleChoice: (): GetQuestionRequest => ({
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      }),

      openQuestion: (): GetQuestionRequest => ({
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      }),

      withArgument: (): GetQuestionRequest => ({
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      }),

      withoutArgument: (): GetQuestionRequest => ({
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      }),

      edgeCase: (): GetQuestionRequest => ({
        id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      }),
    },

    /**
     * Invalid IDs for GetQuestion requests
     */
    invalidIds: {
      invalidFormat: (): any => ({
        id: 'invalid-uuid-format',
      }),

      notUuid: (): any => ({
        id: 'not-a-uuid-at-all',
      }),

      tooShort: (): any => ({
        id: 'short',
      }),

      tooLong: (): any => ({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa-extra-characters',
      }),

      wrongHyphens: (): any => ({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaa-aaaaaaaa',
      }),

      missingHyphens: (): any => ({
        id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      }),

      specialChars: (): any => ({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa@',
      }),

      invalidChars: (): any => ({
        id: 'gggggggg-gggg-gggg-gggg-gggggggggggg', // 'g' is not valid hex
      }),

      emptyString: (): any => ({
        id: '',
      }),

      nullValue: (): any => ({
        id: null,
      }),

      undefinedValue: (): any => ({
        id: undefined,
      }),

      numberValue: (): any => ({
        id: 123456,
      }),

      booleanValue: (): any => ({
        id: true,
      }),

      objectValue: (): any => ({
        id: { nested: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
      }),

      arrayValue: (): any => ({
        id: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'],
      }),

      withWhitespace: (): any => ({
        id: '  aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa  ',
      }),

      withTabs: (): any => ({
        id: '\taaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\t',
      }),

      withNewlines: (): any => ({
        id: '\naaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\n',
      }),

      mixedCase: (): any => ({
        id: 'AAAAAAAA-aaaa-AAAA-aaaa-AAAAAAAAAAAA',
      }),

      unicodeChars: (): any => ({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaαβγ',
      }),

      emojis: (): any => ({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa🎯',
      }),
    },

    /**
     * Special request scenarios
     */
    invalidRequests: {
      nullRequest: (): any => null,
      undefinedRequest: (): any => undefined,
      stringRequest: (): any => 'invalid-request',
      numberRequest: (): any => 123,
      arrayRequest: (): any => ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'],
      emptyObject: (): any => ({}),
      missingId: (): any => ({ notId: 'value' }),
      extraFields: (): any => ({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        extraField: 'not allowed',
        anotherField: 123,
      }),
    },

    /**
     * Non-existent question IDs
     */
    nonExistentIds: {
      zeros: (): GetQuestionRequest => ({
        id: '00000000-0000-0000-0000-000000000000',
      }),

      notFound: (): GetQuestionRequest => ({
        id: 'aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
      }),

      deleted: (): GetQuestionRequest => ({
        id: 'ddddeee-ffff-aaaa-bbbb-ccccddddeeee',
      }),
    },
  };

  /**
   * Expected GetQuestion responses
   */
  static readonly getQuestionResponses = {
    multipleChoice: (
      id: string,
      assessmentId: string,
      argumentId?: string,
    ): QuestionControllerResponse => ({
      success: true,
      question: {
        id,
        text: expect.any(String),
        type: 'MULTIPLE_CHOICE',
        assessmentId,
        argumentId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    }),

    openQuestion: (
      id: string,
      assessmentId: string,
      argumentId?: string,
    ): QuestionControllerResponse => ({
      success: true,
      question: {
        id,
        text: expect.any(String),
        type: 'OPEN',
        assessmentId,
        argumentId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    }),

    withSpecificData: (questionData: {
      id: string;
      text: string;
      type: 'MULTIPLE_CHOICE' | 'OPEN';
      assessmentId: string;
      argumentId?: string;
      createdAt: Date;
      updatedAt: Date;
    }): QuestionControllerResponse => ({
      success: true,
      question: questionData,
    }),
  };

  /**
   * GetQuestion error responses
   */
  static readonly getQuestionErrors = {
    invalidInput: (): ExpectedError => ({
      statusCode: 400,
      error: 'INVALID_INPUT',
      message: 'Invalid input data',
    }),

    questionNotFound: (): ExpectedError => ({
      statusCode: 404,
      error: 'QUESTION_NOT_FOUND',
      message: 'Question not found',
    }),

    repositoryError: (): ExpectedError => ({
      statusCode: 500,
      error: 'INTERNAL_ERROR',
    }),

    unknownError: (): ExpectedError => ({
      statusCode: 500,
      error: 'INTERNAL_ERROR',
      message: 'Unexpected error occurred',
    }),
  };

  /**
   * Performance test data
   */
  static readonly performance = {
    concurrent: (count: number): CreateQuestionDto[] => {
      return Array.from({ length: count }, (_, i) => ({
        text: `Concurrent test question ${i + 1}`,
        type: 'MULTIPLE_CHOICE',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      }));
    },

    sequential: (count: number): CreateQuestionDto[] => {
      return Array.from({ length: count }, (_, i) => ({
        text: `Sequential test question ${i + 1}`,
        type: 'MULTIPLE_CHOICE',
        assessmentId: '22222222-2222-2222-2222-222222222222',
      }));
    },

    getQuestionConcurrent: (count: number): GetQuestionRequest[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: `${i.toString(16).padStart(8, '0')}-aaaa-bbbb-cccc-dddddddddddd`,
      }));
    },
  };
}
