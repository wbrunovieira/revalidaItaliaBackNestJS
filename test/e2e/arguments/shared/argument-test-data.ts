// test/e2e/arguments/shared/argument-test-data.ts

export interface CreateArgumentPayload {
  title: string;
  assessmentId?: string;
}

export interface ExpectedError {
  statusCode: number;
  error?: string;
  message?: string | string[];
}

export class ArgumentTestData {
  /**
   * Valid payloads for successful argument creation
   */
  static readonly validPayloads = {
    minimal: (): CreateArgumentPayload => ({
      title: 'Valid argument title',
    }),

    withAssessment: (assessmentId: string): CreateArgumentPayload => ({
      title: 'Argument with assessment',
      assessmentId,
    }),

    minLength: (): CreateArgumentPayload => ({
      title: 'Min', // 3 characters
    }),

    maxLength: (): CreateArgumentPayload => ({
      title: 'A'.repeat(255), // 255 characters
    }),

    specialChars: (): CreateArgumentPayload => ({
      title: 'Argument with special chars: @#$%^&*()!',
    }),

    unicode: (): CreateArgumentPayload => ({
      title: 'Argumento 中文 العربية русский 🎯',
    }),

    emoji: (): CreateArgumentPayload => ({
      title: 'Argument with emoji 💡 and more 🚀',
    }),

    numbers: (): CreateArgumentPayload => ({
      title: 'Argument 123 with numbers 456',
    }),

    mixedCase: (): CreateArgumentPayload => ({
      title: 'ArGuMeNt WiTh MiXeD cAsE',
    }),

    withSpaces: (): CreateArgumentPayload => ({
      title: '   Argument with spaces   ',
    }),

    multipleSpaces: (): CreateArgumentPayload => ({
      title: 'Argument    with    multiple    spaces',
    }),

    punctuation: (): CreateArgumentPayload => ({
      title: '!@#$%^&*()',
    }),

    longTitle: (): CreateArgumentPayload => ({
      title:
        'Performance Test Argument with Very Long Title ' + 'A'.repeat(200),
    }),
  };

  /**
   * Invalid payloads that should trigger validation errors
   */
  static readonly invalidPayloads = {
    missing: (): any => ({
      // Missing title
    }),

    tooShort: (): any => ({
      title: 'AB', // 2 characters
    }),

    tooLong: (): any => ({
      title: 'A'.repeat(256), // 256 characters
    }),

    empty: (): any => ({
      title: '',
    }),

    whitespace: (): any => ({
      title: '   ',
    }),

    null: (): any => ({
      title: null,
    }),

    notString: (): any => ({
      title: 123,
    }),

    invalidUuid: (): any => ({
      title: 'Valid title',
      assessmentId: 'invalid-uuid',
    }),

    emptyUuid: (): any => ({
      title: 'Valid title',
      assessmentId: '',
    }),

    notStringUuid: (): any => ({
      title: 'Valid title',
      assessmentId: 123,
    }),

    multipleErrors: (): any => ({
      title: 'AB', // Too short
      assessmentId: 'invalid-uuid', // Invalid UUID
    }),

    extraFields: (): any => ({
      title: 'Valid title',
      extraField: 'should not be allowed',
      anotherField: 123,
    }),
  };

  /**
   * Edge case payloads for testing boundary conditions
   */
  static readonly edgeCases = {
    newlines: (): CreateArgumentPayload => ({
      title: 'Argument with\nnewlines\nand\nbreaks',
    }),

    tabs: (): CreateArgumentPayload => ({
      title: 'Argument\twith\ttabs',
    }),

    controlChars: (): CreateArgumentPayload => ({
      title: 'Argument\x00with\x01control\x02chars',
    }),

    mixedWhitespace: (): CreateArgumentPayload => ({
      title: '  \t Argument \n with \r mixed \t whitespace  ',
    }),

    allSpaces: (): CreateArgumentPayload => ({
      title: ' '.repeat(10),
    }),

    hyphenated: (): CreateArgumentPayload => ({
      title: 'Multi-word-argument-with-hyphens',
    }),

    underscored: (): CreateArgumentPayload => ({
      title: 'Argument_with_underscores_123',
    }),

    quotedText: (): CreateArgumentPayload => ({
      title: 'Argument with "quoted text" and \'single quotes\'',
    }),

    parentheses: (): CreateArgumentPayload => ({
      title: 'Argument (with parentheses) and [brackets]',
    }),

    mathematical: (): CreateArgumentPayload => ({
      title: 'Mathematical symbols: ∑∏∆∇∞±≤≥≠≈',
    }),

    accented: (): CreateArgumentPayload => ({
      title: 'Àrgümént wíth áccêntéd chàracters',
    }),
  };

  /**
   * Expected error responses
   */
  static readonly expectedErrors = {
    validation: (): ExpectedError => ({
      statusCode: 400,
    }),

    duplicateTitle: (): ExpectedError => ({
      statusCode: 409,
      error: 'DUPLICATE_ARGUMENT',
      message: 'Argument with this title already exists',
    }),

    assessmentNotFound: (): ExpectedError => ({
      statusCode: 404,
      error: 'ASSESSMENT_NOT_FOUND',
      message: 'Assessment not found',
    }),
  };

  /**
   * Performance test data
   */
  static readonly performance = {
    sequential: (count: number): CreateArgumentPayload[] => {
      return Array.from({ length: count }, (_, i) => ({
        title: `Sequential Test ${i + 1}`,
      }));
    },

    loadTest: (
      count: number,
      assessmentId?: string,
    ): CreateArgumentPayload[] => {
      return Array.from({ length: count }, (_, i) => ({
        title: `Load Test Argument ${i + 1}`,
        ...(i % 2 === 0 && assessmentId ? { assessmentId } : {}),
      }));
    },

    concurrent: (count: number): CreateArgumentPayload[] => {
      return Array.from({ length: count }, (_, i) => ({
        title: `Concurrent Test ${i + 1}`,
      }));
    },
  };

  /**
   * Get a random valid payload
   */
  static getRandomValid(): CreateArgumentPayload {
    const keys = Object.keys(this.validPayloads);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return (this.validPayloads as any)[randomKey]();
  }

  /**
   * Get a random invalid payload
   */
  static getRandomInvalid(): any {
    const keys = Object.keys(this.invalidPayloads);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return (this.invalidPayloads as any)[randomKey]();
  }

  /**
   * Get duplicate test data
   */
  static getDuplicateTestData(): {
    first: CreateArgumentPayload;
    second: CreateArgumentPayload;
  } {
    return {
      first: {
        title: 'Duplicate Title Test',
      },
      second: {
        title: 'Duplicate Title Test',
      },
    };
  }

  /**
   * Get normalized duplicate test data
   */
  static getNormalizedDuplicateTestData(): {
    first: CreateArgumentPayload;
    second: CreateArgumentPayload;
  } {
    return {
      first: {
        title: '  Normalized Title  ',
      },
      second: {
        title: 'Normalized Title',
      },
    };
  }

  /**
   * Get test data for response validation
   */
  static getResponseTestData(): CreateArgumentPayload {
    return {
      title: 'Response Format Test',
    };
  }

  /**
   * Get test data for integrity testing
   */
  static getIntegrityTestData(assessmentId: string): CreateArgumentPayload {
    return {
      title: 'Integrity Test Argument',
      assessmentId,
    };
  }

  /**
   * Get expected success response structure
   */
  static getExpectedSuccessResponse() {
    return {
      success: true,
      argument: {
        id: expect.any(String),
        title: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    };
  }

  /**
   * Get expected success response structure with assessment
   */
  static getExpectedSuccessResponseWithAssessment(assessmentId: string) {
    return {
      success: true,
      argument: {
        id: expect.any(String),
        title: expect.any(String),
        assessmentId,
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
  static readonly MAX_EXECUTION_TIME = 2000;

  /**
   * Test timeout values
   */
  static readonly TIMEOUTS = {
    SHORT: 5000,
    MEDIUM: 10000,
    LONG: 30000,
  };
}
