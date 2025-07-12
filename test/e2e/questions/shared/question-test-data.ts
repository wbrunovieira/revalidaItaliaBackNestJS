// test/e2e/questions/shared/question-test-data.ts

export interface CreateQuestionPayload {
  text: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN';
  assessmentId: string;
  argumentId?: string;
}

export interface ExpectedError {
  statusCode: number;
  error?: string;
  message?: string | string[];
}

export class QuestionTestData {
  /**
   * Valid payloads for successful question creation by assessment type
   */
  static readonly validPayloads = {
    // QUIZ Assessment - Multiple Choice Questions
    quizMultipleChoice: (assessmentId: string): CreateQuestionPayload => ({
      text: 'What is the capital of Brazil?',
      type: 'MULTIPLE_CHOICE',
      assessmentId,
    }),

    quizWithArgument: (
      assessmentId: string,
      argumentId: string,
    ): CreateQuestionPayload => ({
      text: 'Which organ is responsible for gas exchange in the respiratory system?',
      type: 'MULTIPLE_CHOICE',
      assessmentId,
      argumentId,
    }),

    // SIMULADO Assessment - Multiple Choice Questions
    simuladoMultipleChoice: (assessmentId: string): CreateQuestionPayload => ({
      text: 'What is the mechanism of action of ACE inhibitors?',
      type: 'MULTIPLE_CHOICE',
      assessmentId,
    }),

    simuladoWithArgument: (
      assessmentId: string,
      argumentId: string,
    ): CreateQuestionPayload => ({
      text: 'Which laboratory test is most specific for myocardial infarction?',
      type: 'MULTIPLE_CHOICE',
      assessmentId,
      argumentId,
    }),

    // PROVA_ABERTA Assessment - Open Questions
    provaAbertaOpen: (assessmentId: string): CreateQuestionPayload => ({
      text: 'Explain the pathophysiology of hypertension and discuss current treatment guidelines.',
      type: 'OPEN',
      assessmentId,
    }),

    provaAbertaWithArgument: (
      assessmentId: string,
      argumentId: string,
    ): CreateQuestionPayload => ({
      text: 'Describe the diagnostic approach for a patient presenting with acute chest pain. Include differential diagnosis and initial management.',
      type: 'OPEN',
      assessmentId,
      argumentId,
    }),

    // Edge cases - Text length
    minLength: (assessmentId: string): CreateQuestionPayload => ({
      text: '1234567890', // exactly 10 characters
      type: 'MULTIPLE_CHOICE',
      assessmentId,
    }),

    maxLength: (assessmentId: string): CreateQuestionPayload => ({
      text: 'A'.repeat(1000), // exactly 1000 characters
      type: 'MULTIPLE_CHOICE',
      assessmentId,
    }),

    // Special characters and formatting
    specialChars: (assessmentId: string): CreateQuestionPayload => ({
      text: 'Question with special chars: @#$%^&*()! and symbols: ±≤≥≠≈',
      type: 'MULTIPLE_CHOICE',
      assessmentId,
    }),

    unicode: (assessmentId: string): CreateQuestionPayload => ({
      text: 'Questão em português 中文 العربية русский with emojis 🎯🚀',
      type: 'OPEN',
      assessmentId,
    }),

    withNewlines: (assessmentId: string): CreateQuestionPayload => ({
      text: 'Question with\nnewlines and\ttabs for\nformatting purposes',
      type: 'OPEN',
      assessmentId,
    }),

    // Medical context questions
    clinicalCase: (assessmentId: string): CreateQuestionPayload => ({
      text: 'A 65-year-old patient presents with dyspnea, orthopnea, and bilateral lower extremity edema. Physical examination reveals jugular venous distension and S3 gallop. What is your differential diagnosis and management approach?',
      type: 'OPEN',
      assessmentId,
    }),

    pharmacology: (assessmentId: string): CreateQuestionPayload => ({
      text: 'Which of the following medications is contraindicated in patients with severe renal impairment?',
      type: 'MULTIPLE_CHOICE',
      assessmentId,
    }),

    anatomy: (assessmentId: string): CreateQuestionPayload => ({
      text: 'Which anatomical structure separates the right and left ventricles?',
      type: 'MULTIPLE_CHOICE',
      assessmentId,
    }),

    // Formatting edge cases
    mixedWhitespace: (assessmentId: string): CreateQuestionPayload => ({
      text: '  Question with    mixed   whitespace   and   formatting  ',
      type: 'MULTIPLE_CHOICE',
      assessmentId,
    }),

    punctuation: (assessmentId: string): CreateQuestionPayload => ({
      text: 'Question with punctuation: What is this? How does it work! Amazing...',
      type: 'MULTIPLE_CHOICE',
      assessmentId,
    }),

    mathematical: (assessmentId: string): CreateQuestionPayload => ({
      text: 'Calculate the cardiac output if stroke volume = 70mL and heart rate = 80bpm. Show your work.',
      type: 'OPEN',
      assessmentId,
    }),
  };

  /**
   * Invalid payloads that should trigger validation errors
   */
  static readonly invalidPayloads = {
    textTooShort: (assessmentId: string): any => ({
      text: 'Short', // 5 characters
      type: 'MULTIPLE_CHOICE',
      assessmentId,
    }),

    textTooLong: (assessmentId: string): any => ({
      text: 'A'.repeat(1001), // 1001 characters
      type: 'MULTIPLE_CHOICE',
      assessmentId,
    }),

    emptyText: (assessmentId: string): any => ({
      text: '',
      type: 'MULTIPLE_CHOICE',
      assessmentId,
    }),

    whitespaceText: (assessmentId: string): any => ({
      text: '          ', // 10 spaces
      type: 'MULTIPLE_CHOICE',
      assessmentId,
    }),

    invalidType: (assessmentId: string): any => ({
      text: 'What is the correct answer?',
      type: 'INVALID_TYPE',
      assessmentId,
    }),

    missingType: (assessmentId: string): any => ({
      text: 'What is the correct answer?',
      assessmentId,
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

    invalidArgumentId: (assessmentId: string): any => ({
      text: 'What is the correct answer?',
      type: 'MULTIPLE_CHOICE',
      assessmentId,
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

    extraFields: (assessmentId: string): any => ({
      text: 'Valid question text',
      type: 'MULTIPLE_CHOICE',
      assessmentId,
      extraField: 'should not be allowed',
      anotherField: 123,
    }),

    multipleErrors: (): any => ({
      text: 'Short', // Too short
      type: 'INVALID', // Invalid type
      assessmentId: 'invalid-uuid', // Invalid UUID
      argumentId: 'invalid-uuid', // Invalid UUID
    }),
  };

  /**
   * Type mismatch scenarios for testing business rules
   */
  static readonly typeMismatchScenarios = {
    quizWithOpen: (assessmentId: string): CreateQuestionPayload => ({
      text: 'This should be multiple choice for quiz assessment',
      type: 'OPEN', // Wrong type for QUIZ
      assessmentId,
    }),

    simuladoWithOpen: (assessmentId: string): CreateQuestionPayload => ({
      text: 'This should be multiple choice for simulado assessment',
      type: 'OPEN', // Wrong type for SIMULADO
      assessmentId,
    }),

    provaAbertaWithMultipleChoice: (
      assessmentId: string,
    ): CreateQuestionPayload => ({
      text: 'This should be open question for prova aberta assessment',
      type: 'MULTIPLE_CHOICE', // Wrong type for PROVA_ABERTA
      assessmentId,
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
      message: 'Question with similar text already exists in this assessment',
    }),

    assessmentNotFound: (): ExpectedError => ({
      statusCode: 404,
      error: 'ASSESSMENT_NOT_FOUND',
      message: 'Assessment not found',
    }),

    argumentNotFound: (): ExpectedError => ({
      statusCode: 404,
      error: 'ARGUMENT_NOT_FOUND',
      message: 'Argument not found',
    }),

    questionTypeMismatch: (): ExpectedError => ({
      statusCode: 400,
      error: 'QUESTION_TYPE_MISMATCH',
    }),

    repositoryError: (): ExpectedError => ({
      statusCode: 500,
      error: 'INTERNAL_ERROR',
    }),
  };

  /**
   * Performance test data
   */
  static readonly performance = {
    sequential: (
      count: number,
      assessmentId: string,
    ): CreateQuestionPayload[] => {
      return Array.from({ length: count }, (_, i) => ({
        text: `Sequential test question ${i + 1} with enough characters to pass validation`,
        type: 'MULTIPLE_CHOICE',
        assessmentId,
      }));
    },

    concurrent: (
      count: number,
      assessmentId: string,
    ): CreateQuestionPayload[] => {
      return Array.from({ length: count }, (_, i) => ({
        text: `Concurrent test question ${i + 1} with enough characters to pass validation`,
        type: 'MULTIPLE_CHOICE',
        assessmentId,
      }));
    },

    loadTest: (
      count: number,
      assessmentId: string,
      argumentId?: string,
    ): CreateQuestionPayload[] => {
      return Array.from({ length: count }, (_, i) => ({
        text: `Load test question ${i + 1} with sufficient characters for validation requirements`,
        type: i % 2 === 0 ? 'MULTIPLE_CHOICE' : 'OPEN',
        assessmentId,
        ...(i % 3 === 0 && argumentId ? { argumentId } : {}),
      }));
    },
  };

  /**
   * Get duplicate scenario data
   */
  static getDuplicateScenario(assessmentId: string): {
    first: CreateQuestionPayload;
    second: CreateQuestionPayload;
  } {
    const sameText = 'What is the capital of Brazil?';
    return {
      first: {
        text: sameText,
        type: 'MULTIPLE_CHOICE',
        assessmentId,
      },
      second: {
        text: sameText,
        type: 'MULTIPLE_CHOICE',
        assessmentId,
      },
    };
  }

  /**
   * Get case insensitive duplicate scenario
   */
  static getCaseInsensitiveDuplicateScenario(assessmentId: string): {
    first: CreateQuestionPayload;
    second: CreateQuestionPayload;
  } {
    return {
      first: {
        text: 'WHAT IS THE CAPITAL OF BRAZIL?',
        type: 'MULTIPLE_CHOICE',
        assessmentId,
      },
      second: {
        text: 'what is the capital of brazil?',
        type: 'MULTIPLE_CHOICE',
        assessmentId,
      },
    };
  }

  /**
   * Get different assessment scenario (should allow same text)
   */
  static getDifferentAssessmentScenario(
    assessmentId1: string,
    assessmentId2: string,
  ): {
    first: CreateQuestionPayload;
    second: CreateQuestionPayload;
  } {
    const sameText = 'What is the capital of Brazil?';
    return {
      first: {
        text: sameText,
        type: 'MULTIPLE_CHOICE',
        assessmentId: assessmentId1,
      },
      second: {
        text: sameText,
        type: 'MULTIPLE_CHOICE',
        assessmentId: assessmentId2,
      },
    };
  }

  /**
   * Get random valid payload
   */
  static getRandomValid(assessmentId: string): CreateQuestionPayload {
    const keys = Object.keys(this.validPayloads).filter(
      (key) =>
        ![
          'quizWithArgument',
          'simuladoWithArgument',
          'provaAbertaWithArgument',
        ].includes(key),
    );
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return (this.validPayloads as any)[randomKey](assessmentId);
  }

  /**
   * Get random invalid payload
   */
  static getRandomInvalid(assessmentId: string): any {
    const keys = Object.keys(this.invalidPayloads).filter(
      (key) =>
        ![
          'invalidAssessmentId',
          'missingAssessmentId',
          'nullValues',
          'numberValues',
        ].includes(key),
    );
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return (this.invalidPayloads as any)[randomKey](assessmentId);
  }

  /**
   * Get expected success response structure
   */
  static getExpectedSuccessResponse() {
    return {
      success: true,
      question: {
        id: expect.any(String),
        text: expect.any(String),
        type: expect.stringMatching(/^(MULTIPLE_CHOICE|OPEN)$/),
        assessmentId: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    };
  }

  /**
   * Get expected success response structure with argument
   */
  static getExpectedSuccessResponseWithArgument(argumentId: string) {
    return {
      success: true,
      question: {
        id: expect.any(String),
        text: expect.any(String),
        type: expect.stringMatching(/^(MULTIPLE_CHOICE|OPEN)$/),
        assessmentId: expect.any(String),
        argumentId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    };
  }

  /**
   * UUID regex pattern for validation
   */
  static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /**
   * Maximum execution time for performance tests (in milliseconds)
   */
  static readonly MAX_EXECUTION_TIME = 3000;

  /**
   * Test timeout values
   */
  static readonly TIMEOUTS = {
    SHORT: 5000,
    MEDIUM: 10000,
    LONG: 30000,
  };

  /**
   * Medical specialties for context testing
   */
  static readonly medicalContexts = {
    cardiology: (assessmentId: string): CreateQuestionPayload => ({
      text: 'A patient presents with chest pain radiating to the left arm. ECG shows ST elevation in leads II, III, and aVF. What is the most likely diagnosis?',
      type: 'MULTIPLE_CHOICE',
      assessmentId,
    }),

    respiratory: (assessmentId: string): CreateQuestionPayload => ({
      text: 'Describe the pathophysiology of acute respiratory distress syndrome (ARDS) and outline the management approach.',
      type: 'OPEN',
      assessmentId,
    }),

    neurology: (assessmentId: string): CreateQuestionPayload => ({
      text: 'A patient presents with sudden onset of right-sided weakness and aphasia. Describe your initial assessment and management.',
      type: 'OPEN',
      assessmentId,
    }),

    pharmacology: (assessmentId: string): CreateQuestionPayload => ({
      text: 'Which of the following antibiotics is associated with QT prolongation?',
      type: 'MULTIPLE_CHOICE',
      assessmentId,
    }),
  };

  /**
   * Assessment type scenarios
   */
  static readonly assessmentTypeScenarios = {
    QUIZ: 'MULTIPLE_CHOICE' as const,
    SIMULADO: 'MULTIPLE_CHOICE' as const,
    PROVA_ABERTA: 'OPEN' as const,
  };
}
