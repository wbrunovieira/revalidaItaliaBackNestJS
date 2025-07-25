// test/e2e/attempts/shared/attempt-test-data.ts
import { randomUUID } from 'crypto';

export interface StartAttemptRequestData {
  identityId: string;
  assessmentId: string;
}

export interface SubmitAttemptRequestData {
  id: string; // attemptId as path parameter
}

export interface ReviewOpenAnswerRequestData {
  params: {
    id: string; // attemptAnswerId as path parameter
  };
  body: {
    reviewerId: string;
    isCorrect: boolean;
    teacherComment?: string;
  };
}

export class AttemptTestData {
  /**
   * Valid start attempt requests
   */
  static readonly validRequests = {
    studentQuiz: (
      studentId: string,
      quizId: string,
    ): StartAttemptRequestData => ({
      identityId: studentId,
      assessmentId: quizId,
    }),

    studentSimulado: (
      studentId: string,
      simuladoId: string,
    ): StartAttemptRequestData => ({
      identityId: studentId,
      assessmentId: simuladoId,
    }),

    studentProvaAberta: (
      studentId: string,
      provaAbertaId: string,
    ): StartAttemptRequestData => ({
      identityId: studentId,
      assessmentId: provaAbertaId,
    }),

    tutorQuiz: (tutorId: string, quizId: string): StartAttemptRequestData => ({
      identityId: tutorId,
      assessmentId: quizId,
    }),
  };

  /**
   * Invalid start attempt requests for validation testing
   */
  static readonly invalidRequests = {
    invalidIdentityId: (): any => ({
      identityId: 'invalid-uuid-format',
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    invalidAssessmentId: (): any => ({
      userId: '550e8400-e29b-41d4-a716-446655440001',
      assessmentId: 'invalid-uuid-format',
    }),

    bothInvalid: (): any => ({
      userId: 'invalid-user-id',
      assessmentId: 'invalid-assessment-id',
    }),

    emptyIdentityId: (): any => ({
      identityId: '',
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    emptyAssessmentId: (): any => ({
      userId: '550e8400-e29b-41d4-a716-446655440001',
      assessmentId: '',
    }),

    missingIdentityId: (): any => ({
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    missingAssessmentId: (): any => ({
      userId: '550e8400-e29b-41d4-a716-446655440001',
    }),

    nullIdentityId: (): any => ({
      identityId: null,
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    nullAssessmentId: (): any => ({
      userId: '550e8400-e29b-41d4-a716-446655440001',
      assessmentId: null,
    }),

    undefinedIdentityId: (): any => ({
      identityId: undefined,
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    undefinedAssessmentId: (): any => ({
      userId: '550e8400-e29b-41d4-a716-446655440001',
      assessmentId: undefined,
    }),

    numberIdentityId: (): any => ({
      identityId: 123456,
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    numberAssessmentId: (): any => ({
      userId: '550e8400-e29b-41d4-a716-446655440001',
      assessmentId: 123456,
    }),

    booleanIdentityId: (): any => ({
      identityId: true,
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    booleanAssessmentId: (): any => ({
      userId: '550e8400-e29b-41d4-a716-446655440001',
      assessmentId: false,
    }),

    objectIdentityId: (): any => ({
      identityId: { id: '550e8400-e29b-41d4-a716-446655440001' },
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    objectAssessmentId: (): any => ({
      userId: '550e8400-e29b-41d4-a716-446655440001',
      assessmentId: { id: '550e8400-e29b-41d4-a716-446655440002' },
    }),

    arrayIdentityId: (): any => ({
      identityId: ['550e8400-e29b-41d4-a716-446655440001'],
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    arrayAssessmentId: (): any => ({
      userId: '550e8400-e29b-41d4-a716-446655440001',
      assessmentId: ['550e8400-e29b-41d4-a716-446655440002'],
    }),

    uuidWithSpaces: (): any => ({
      identityId: '  550e8400-e29b-41d4-a716-446655440001  ',
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    uuidWithTabs: (): any => ({
      identityId: '\t550e8400-e29b-41d4-a716-446655440001\t',
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    uuidWithNewlines: (): any => ({
      identityId: '\n550e8400-e29b-41d4-a716-446655440001\n',
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    tooShortUuid: (): any => ({
      identityId: 'short',
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    tooLongUuid: (): any => ({
      identityId: '550e8400-e29b-41d4-a716-446655440001-extra-characters',
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    wrongHyphens: (): any => ({
      identityId: '550e8400-e29b-41d4-a716-446655440001',
      assessmentId: '550e8400-e29b-41d4-a716-4466-55440002', // wrong hyphen placement
    }),

    missingHyphens: (): any => ({
      identityId: '550e8400e29b41d4a716446655440001', // no hyphens
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    specialChars: (): any => ({
      identityId: '550e8400-e29b-41d4-a716-446655440001',
      assessmentId: '550e8400-e29b-41d4-a716-44665544000@', // special char at end
    }),

    invalidHexChars: (): any => ({
      identityId: 'gggggggg-gggg-gggg-gggg-gggggggggggg', // 'g' is not valid hex
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    unicodeChars: (): any => ({
      identityId: '550e8400-e29b-41d4-a716-446655440αβγ', // unicode chars
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    emojis: (): any => ({
      identityId: '550e8400-e29b-41d4-a716-446655440🎯', // emoji
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),
  };

  /**
   * Non-existent entity requests for testing 404 errors
   */
  static readonly nonExistentRequests = {
    nonExistentUser: (assessmentId: string): StartAttemptRequestData => ({
      identityId: '10000000-0000-4000-8000-000000000000',
      assessmentId,
    }),

    nonExistentAssessment: (identityId: string): StartAttemptRequestData => ({
      identityId,
      assessmentId: '20000000-0000-4000-8000-000000000000',
    }),

    bothNonExistent: (): StartAttemptRequestData => ({
      identityId: '10000000-0000-4000-8000-000000000000',
      assessmentId: '20000000-0000-4000-8000-000000000000',
    }),

    randomUser: (assessmentId: string): StartAttemptRequestData => ({
      identityId: randomUUID(),
      assessmentId,
    }),

    randomAssessment: (identityId: string): StartAttemptRequestData => ({
      identityId,
      assessmentId: randomUUID(),
    }),

    bothRandom: (): StartAttemptRequestData => ({
      identityId: randomUUID(),
      assessmentId: randomUUID(),
    }),
  };

  /**
   * Expected success response structure
   */
  static readonly expectedSuccessResponse = {
    attempt: {
      id: expect.any(String),
      status: 'IN_PROGRESS',
      startedAt: expect.any(String),
      identityId: expect.any(String),
      assessmentId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    },
  };

  /**
   * Expected success response with time limit (for Simulado)
   */
  static readonly expectedSuccessResponseWithTimeLimit = {
    attempt: {
      id: expect.any(String),
      status: 'IN_PROGRESS',
      startedAt: expect.any(String),
      timeLimitExpiresAt: expect.any(String),
      identityId: expect.any(String),
      assessmentId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    },
  };

  /**
   * Valid submit attempt requests
   */
  static readonly validSubmitRequests = {
    withActiveAttempt: (attemptId: string): SubmitAttemptRequestData => ({
      id: attemptId,
    }),
  };

  /**
   * Invalid submit attempt path parameters
   */
  static readonly invalidSubmitRequests = {
    invalidAttemptId: (): any => ({
      id: 'invalid-uuid-format',
    }),

    emptyAttemptId: (): any => ({
      id: '',
    }),

    missingAttemptId: (): any => ({}),

    nullAttemptId: (): any => ({
      id: null,
    }),

    undefinedAttemptId: (): any => ({
      id: undefined,
    }),

    numberAttemptId: (): any => ({
      id: 123456,
    }),

    booleanAttemptId: (): any => ({
      id: true,
    }),

    objectAttemptId: (): any => ({
      id: { id: '550e8400-e29b-41d4-a716-446655440001' },
    }),

    arrayAttemptId: (): any => ({
      id: ['550e8400-e29b-41d4-a716-446655440001'],
    }),
  };

  /**
   * Non-existent submit attempt requests
   */
  static readonly nonExistentSubmitRequests = {
    nonExistentAttempt: (): SubmitAttemptRequestData => ({
      id: '30000000-0000-4000-8000-000000000000',
    }),

    randomAttempt: (): SubmitAttemptRequestData => ({
      id: randomUUID(),
    }),
  };

  /**
   * Expected submit attempt success responses
   */
  static readonly expectedSubmitSuccessResponse = {
    attempt: {
      id: expect.any(String),
      status: expect.stringMatching(/^(SUBMITTED|GRADED)$/),
      startedAt: expect.any(String),
      submittedAt: expect.any(String),
      identityId: expect.any(String),
      assessmentId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    },
    summary: {
      totalQuestions: expect.any(Number),
      answeredQuestions: expect.any(Number),
      scorePercentage: expect.any(Number),
    },
  };

  /**
   * Expected submit attempt success response with open questions
   */
  static readonly expectedSubmitSuccessResponseOpenQuestions = {
    attempt: {
      id: expect.any(String),
      status: 'SUBMITTED',
      startedAt: expect.any(String),
      submittedAt: expect.any(String),
      identityId: expect.any(String),
      assessmentId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    },
    summary: {
      totalQuestions: expect.any(Number),
      answeredQuestions: expect.any(Number),
      correctAnswers: undefined,
      scorePercentage: undefined,
    },
  };

  /**
   * Expected error responses
   */
  static readonly expectedErrorResponses = {
    invalidInput: {
      error: 'Bad Request',
      message: expect.any(Array),
    },

    userNotFound: {
      error: 'USER_NOT_FOUND',
      message: 'User not found',
    },

    assessmentNotFound: {
      error: 'ASSESSMENT_NOT_FOUND',
      message: 'Assessment not found',
    },

    attemptAlreadyActive: {
      error: 'ATTEMPT_ALREADY_ACTIVE',
      message: 'User already has an active attempt for this assessment',
    },

    internalError: {
      error: 'INTERNAL_ERROR',
      message: expect.any(String),
    },

    attemptNotFound: {
      error: 'ATTEMPT_NOT_FOUND',
      message: 'Attempt not found',
    },

    attemptNotActive: {
      error: 'ATTEMPT_NOT_ACTIVE',
      message: 'Attempt is not active',
    },

    noAnswersFound: {
      error: 'NO_ANSWERS_FOUND',
      message: 'No answers found for this attempt',
    },

    attemptExpired: {
      error: 'ATTEMPT_EXPIRED',
      message: 'Attempt has expired',
    },
  };

  /**
   * Performance test scenarios
   */
  static readonly performanceTests = {
    singleRequest: {
      maxExecutionTime: 500, // 500ms
      description: 'Single start attempt request',
    },

    concurrentRequests: {
      requestCount: 10,
      maxExecutionTime: 2000, // 2 seconds
      description: 'Concurrent start attempt requests',
    },

    sequentialRequests: {
      requestCount: 5,
      maxExecutionTime: 2500, // 2.5 seconds
      description: 'Sequential start attempt requests',
    },
  };

  /**
   * Load test scenarios
   */
  static readonly loadTests = {
    lightLoad: {
      concurrentUsers: 10,
      requestsPerUser: 1,
      maxTotalTime: 5000, // 5 seconds
    },

    mediumLoad: {
      concurrentUsers: 50,
      requestsPerUser: 2,
      maxTotalTime: 10000, // 10 seconds
    },

    heavyLoad: {
      concurrentUsers: 100,
      requestsPerUser: 3,
      maxTotalTime: 20000, // 20 seconds
    },
  };

  /**
   * Test data generators
   */
  static generateRandomValidRequest(): StartAttemptRequestData {
    return {
      identityId: randomUUID(),
      assessmentId: randomUUID(),
    };
  }

  static generateRandomInvalidRequest(): any {
    const invalidTypes = [
      this.invalidRequests.invalidIdentityId(),
      this.invalidRequests.invalidAssessmentId(),
      this.invalidRequests.bothInvalid(),
      this.invalidRequests.emptyIdentityId(),
      this.invalidRequests.emptyAssessmentId(),
      this.invalidRequests.nullIdentityId(),
      this.invalidRequests.nullAssessmentId(),
    ];

    return invalidTypes[Math.floor(Math.random() * invalidTypes.length)];
  }

  /**
   * Get all invalid request test cases
   */
  static getAllInvalidRequests(): any[] {
    return Object.values(this.invalidRequests).map((fn) => fn());
  }

  /**
   * UUID validation helper
   */
  static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  static isValidUUID(uuid: string): boolean {
    return this.UUID_REGEX.test(uuid);
  }

  /**
   * Valid review open answer requests
   */
  static readonly validReviewRequests = {
    tutorReviewCorrect: (
      attemptAnswerId: string,
      reviewerId: string,
    ): ReviewOpenAnswerRequestData => ({
      params: { id: attemptAnswerId },
      body: {
        reviewerId,
        isCorrect: true,
        teacherComment:
          'Excelente resposta! Demonstrou conhecimento completo sobre o tema.',
      },
    }),

    tutorReviewIncorrect: (
      attemptAnswerId: string,
      reviewerId: string,
    ): ReviewOpenAnswerRequestData => ({
      params: { id: attemptAnswerId },
      body: {
        reviewerId,
        isCorrect: false,
        teacherComment:
          'Resposta incompleta. Faltou abordar aspectos importantes do tratamento.',
      },
    }),

    tutorReviewWithoutComment: (
      attemptAnswerId: string,
      reviewerId: string,
    ): ReviewOpenAnswerRequestData => ({
      params: { id: attemptAnswerId },
      body: {
        reviewerId,
        isCorrect: true,
      },
    }),

    adminReviewCorrect: (
      attemptAnswerId: string,
      reviewerId: string,
    ): ReviewOpenAnswerRequestData => ({
      params: { id: attemptAnswerId },
      body: {
        reviewerId,
        isCorrect: true,
        teacherComment: 'Admin review: Resposta está correta.',
      },
    }),
  };

  /**
   * Invalid review open answer requests
   */
  static readonly invalidReviewRequests = {
    invalidAttemptAnswerId: (reviewerId: string): any => ({
      params: { id: 'invalid-uuid-format' },
      body: {
        reviewerId,
        isCorrect: true,
        teacherComment: 'Test comment',
      },
    }),

    invalidReviewerId: (attemptAnswerId: string): any => ({
      params: { id: attemptAnswerId },
      body: {
        reviewerId: 'invalid-uuid-format',
        isCorrect: true,
        teacherComment: 'Test comment',
      },
    }),

    missingReviewerId: (attemptAnswerId: string): any => ({
      params: { id: attemptAnswerId },
      body: {
        isCorrect: true,
        teacherComment: 'Test comment',
      },
    }),

    missingIsCorrect: (attemptAnswerId: string, reviewerId: string): any => ({
      params: { id: attemptAnswerId },
      body: {
        reviewerId,
        teacherComment: 'Test comment',
      },
    }),

    invalidIsCorrect: (attemptAnswerId: string, reviewerId: string): any => ({
      params: { id: attemptAnswerId },
      body: {
        reviewerId,
        isCorrect: 'yes', // Should be boolean
        teacherComment: 'Test comment',
      },
    }),

    emptyTeacherComment: (
      attemptAnswerId: string,
      reviewerId: string,
    ): any => ({
      params: { id: attemptAnswerId },
      body: {
        reviewerId,
        isCorrect: true,
        teacherComment: '', // Empty string should be invalid
      },
    }),

    tooLongTeacherComment: (
      attemptAnswerId: string,
      reviewerId: string,
    ): any => ({
      params: { id: attemptAnswerId },
      body: {
        reviewerId,
        isCorrect: true,
        teacherComment: 'A'.repeat(1001), // Exceeds 1000 character limit
      },
    }),

    nullReviewerId: (attemptAnswerId: string): any => ({
      params: { id: attemptAnswerId },
      body: {
        reviewerId: null,
        isCorrect: true,
        teacherComment: 'Test comment',
      },
    }),

    nullIsCorrect: (attemptAnswerId: string, reviewerId: string): any => ({
      params: { id: attemptAnswerId },
      body: {
        reviewerId,
        isCorrect: null,
        teacherComment: 'Test comment',
      },
    }),
  };

  /**
   * Non-existent review requests for testing 404 errors
   */
  static readonly nonExistentReviewRequests = {
    nonExistentAttemptAnswer: (
      reviewerId: string,
    ): ReviewOpenAnswerRequestData => ({
      params: { id: '40000000-0000-4000-8000-000000000000' },
      body: {
        reviewerId,
        isCorrect: true,
        teacherComment: 'Test comment',
      },
    }),

    nonExistentReviewer: (
      attemptAnswerId: string,
    ): ReviewOpenAnswerRequestData => ({
      params: { id: attemptAnswerId },
      body: {
        reviewerId: '50000000-0000-4000-8000-000000000000',
        isCorrect: true,
        teacherComment: 'Test comment',
      },
    }),

    randomAttemptAnswer: (reviewerId: string): ReviewOpenAnswerRequestData => ({
      params: { id: randomUUID() },
      body: {
        reviewerId,
        isCorrect: true,
        teacherComment: 'Test comment',
      },
    }),

    randomReviewer: (attemptAnswerId: string): ReviewOpenAnswerRequestData => ({
      params: { id: attemptAnswerId },
      body: {
        reviewerId: randomUUID(),
        isCorrect: true,
        teacherComment: 'Test comment',
      },
    }),
  };

  /**
   * Expected review success response structure
   */
  static readonly expectedReviewSuccessResponse = {
    attemptAnswer: {
      id: expect.any(String),
      attemptId: expect.any(String),
      questionId: expect.any(String),
      textAnswer: expect.any(String),
      status: 'GRADED',
      isCorrect: expect.any(Boolean),
      teacherComment: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    },
    attemptStatus: {
      id: expect.any(String),
      status: expect.stringMatching(/^(SUBMITTED|GRADED)$/),
      allOpenQuestionsReviewed: expect.any(Boolean),
    },
  };

  /**
   * Expected review error responses
   */
  static readonly expectedReviewErrorResponses = {
    invalidInput: {
      error: 'Bad Request',
      message: expect.any(Array),
    },

    attemptAnswerNotFound: {
      error: 'ATTEMPT_ANSWER_NOT_FOUND',
      message: 'Attempt answer not found',
    },

    userNotFound: {
      error: 'USER_NOT_FOUND',
      message: 'User not found',
    },

    answerNotReviewable: {
      error: 'ANSWER_NOT_REVIEWABLE',
      message: 'Answer is not reviewable',
    },

    internalError: {
      error: 'INTERNAL_ERROR',
      message: expect.any(String),
    },
  };

  /**
   * Test scenario configurations
   */
  static readonly testScenarios = {
    happyPath: {
      description: 'Successful attempt creation scenarios',
      maxExecutionTime: 1000,
    },

    validation: {
      description: 'Input validation error scenarios',
      expectedStatus: 400,
      expectedError: 'INVALID_INPUT',
    },

    notFound: {
      description: 'Entity not found error scenarios',
      expectedStatus: 404,
    },

    conflict: {
      description: 'Business logic conflict scenarios',
      expectedStatus: 409,
      expectedError: 'ATTEMPT_ALREADY_ACTIVE',
    },

    performance: {
      description: 'Performance and load testing scenarios',
      maxExecutionTime: 2000,
    },

    edgeCases: {
      description: 'Edge cases and boundary testing',
      maxExecutionTime: 1500,
    },
  };

  // GetAttemptResults test data
  readonly nonExistentAttemptId = '550e8400-e29b-41d4-a716-446655440000';
  readonly otherStudentId = '550e8400-e29b-41d4-a716-446655440010';

  /**
   * Expected GetAttemptResults response structure
   */
  static readonly expectedGetAttemptResultsResponse = {
    attempt: {
      id: expect.any(String),
      status: expect.stringMatching(/^(SUBMITTED|GRADING|GRADED)$/),
      identityId: expect.any(String),
      assessmentId: expect.any(String),
      startedAt: expect.any(String),
    },
    assessment: {
      id: expect.any(String),
      title: expect.any(String),
      type: expect.stringMatching(/^(QUIZ|SIMULADO|PROVA_ABERTA)$/),
      passingScore: expect.any(Number),
    },
    results: {
      totalQuestions: expect.any(Number),
      answeredQuestions: expect.any(Number),
    },
    answers: expect.any(Array),
  };

  /**
   * Expected GetAttemptResults error responses
   */
  static readonly expectedGetAttemptResultsErrors = {
    invalidInput: {
      error: 'INVALID_INPUT',
      message: 'Invalid input data',
    },

    attemptNotFound: {
      error: 'ATTEMPT_NOT_FOUND',
      message: 'Attempt not found',
    },

    attemptNotFinalized: {
      error: 'ATTEMPT_NOT_FINALIZED',
      message: 'Attempt is not finalized yet',
    },

    userNotFound: {
      error: 'USER_NOT_FOUND',
      message: 'User not found',
    },

    insufficientPermissions: {
      error: 'INSUFFICIENT_PERMISSIONS',
      message: 'Insufficient permissions to view this attempt',
    },

    assessmentNotFound: {
      error: 'ASSESSMENT_NOT_FOUND',
      message: 'Assessment not found',
    },

    internalError: {
      error: 'INTERNAL_ERROR',
      message: expect.any(String),
    },
  };
}
