// src/infra/controllers/tests/attempt/shared/attempt-controller-test-data.ts
import { StartAttemptDto } from '@/domain/assessment/application/dtos/start-attempt.dto';
import { SubmitAnswerDto } from '@/domain/assessment/application/dtos/submit-answer.dto';
import { StartAttemptResponse } from '@/domain/assessment/application/dtos/start-attempt-response.dto';
import { SubmitAnswerResponse } from '@/domain/assessment/application/dtos/submit-answer-response.dto';

export class AttemptControllerTestData {
  static readonly validStartAttemptDto = (): StartAttemptDto => ({
    userId: '550e8400-e29b-41d4-a716-446655440001',
    assessmentId: '550e8400-e29b-41d4-a716-446655440002',
  });

  static readonly validStartAttemptDtoForQuiz = (): StartAttemptDto => ({
    userId: '550e8400-e29b-41d4-a716-446655440003',
    assessmentId: '550e8400-e29b-41d4-a716-446655440004', // Quiz assessment
  });

  static readonly validStartAttemptDtoForSimulado = (): StartAttemptDto => ({
    userId: '550e8400-e29b-41d4-a716-446655440005',
    assessmentId: '550e8400-e29b-41d4-a716-446655440006', // Simulado assessment with time limit
  });

  static readonly invalidStartAttemptDto = {
    invalidUserId: (): any => ({
      userId: 'invalid-uuid',
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),
    
    invalidAssessmentId: (): any => ({
      userId: '550e8400-e29b-41d4-a716-446655440001',
      assessmentId: 'invalid-uuid',
    }),

    missingUserId: (): any => ({
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    missingAssessmentId: (): any => ({
      userId: '550e8400-e29b-41d4-a716-446655440001',
    }),

    emptyUserId: (): any => ({
      userId: '',
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    emptyAssessmentId: (): any => ({
      userId: '550e8400-e29b-41d4-a716-446655440001',
      assessmentId: '',
    }),

    nullUserId: (): any => ({
      userId: null,
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
    }),

    nullAssessmentId: (): any => ({
      userId: '550e8400-e29b-41d4-a716-446655440001',
      assessmentId: null,
    }),
  };

  static readonly mockStartAttemptResponse = (): StartAttemptResponse => ({
    attempt: {
      id: '550e8400-e29b-41d4-a716-446655440010',
      status: 'IN_PROGRESS',
      startedAt: new Date('2023-01-01T10:00:00Z'),
      userId: '550e8400-e29b-41d4-a716-446655440001',
      assessmentId: '550e8400-e29b-41d4-a716-446655440002',
      createdAt: new Date('2023-01-01T10:00:00Z'),
      updatedAt: new Date('2023-01-01T10:00:00Z'),
    },
  });

  static readonly mockStartAttemptResponseForQuiz = (): StartAttemptResponse => ({
    attempt: {
      id: '550e8400-e29b-41d4-a716-446655440011',
      status: 'IN_PROGRESS',
      startedAt: new Date('2023-01-01T10:00:00Z'),
      userId: '550e8400-e29b-41d4-a716-446655440003',
      assessmentId: '550e8400-e29b-41d4-a716-446655440004',
      createdAt: new Date('2023-01-01T10:00:00Z'),
      updatedAt: new Date('2023-01-01T10:00:00Z'),
    },
  });

  static readonly mockStartAttemptResponseWithTimeLimit = (): StartAttemptResponse => ({
    attempt: {
      id: '550e8400-e29b-41d4-a716-446655440011',
      status: 'IN_PROGRESS',
      startedAt: new Date('2023-01-01T10:00:00Z'),
      timeLimitExpiresAt: new Date('2023-01-01T12:00:00Z'), // 2 hours later
      userId: '550e8400-e29b-41d4-a716-446655440005',
      assessmentId: '550e8400-e29b-41d4-a716-446655440006',
      createdAt: new Date('2023-01-01T10:00:00Z'),
      updatedAt: new Date('2023-01-01T10:00:00Z'),
    },
  });

  static readonly expectedErrorResponses = {
    invalidInput: {
      error: 'INVALID_INPUT',
      message: 'Invalid input data',
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
      message: 'Unexpected error occurred',
    },

    repositoryError: {
      error: 'INTERNAL_ERROR',
      message: 'Database connection failed',
    },
  };

  // SubmitAnswer test data
  static readonly validSubmitAnswerDto = {
    multipleChoice: (): SubmitAnswerDto => ({
      questionId: '550e8400-e29b-41d4-a716-446655440020',
      selectedOptionId: '550e8400-e29b-41d4-a716-446655440021',
    }),

    openQuestion: (): SubmitAnswerDto => ({
      questionId: '550e8400-e29b-41d4-a716-446655440022',
      textAnswer: 'This is my answer to the open question.',
    }),
  };

  static readonly invalidSubmitAnswerDto = {
    invalidQuestionId: (): any => ({
      questionId: 'invalid-uuid',
      selectedOptionId: '550e8400-e29b-41d4-a716-446655440021',
    }),

    missingQuestionId: (): any => ({
      selectedOptionId: '550e8400-e29b-41d4-a716-446655440021',
    }),

    neitherAnswerType: (): any => ({
      questionId: '550e8400-e29b-41d4-a716-446655440020',
    }),
  };

  static readonly mockSubmitAnswerResponse = {
    multipleChoice: (): SubmitAnswerResponse => ({
      attemptAnswer: {
        id: '550e8400-e29b-41d4-a716-446655440030',
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440021',
        status: 'IN_PROGRESS',
        isCorrect: true,
        attemptId: '550e8400-e29b-41d4-a716-446655440010',
        questionId: '550e8400-e29b-41d4-a716-446655440020',
        createdAt: new Date('2023-01-01T10:05:00Z'),
        updatedAt: new Date('2023-01-01T10:05:00Z'),
      },
    }),

    openQuestion: (): SubmitAnswerResponse => ({
      attemptAnswer: {
        id: '550e8400-e29b-41d4-a716-446655440031',
        textAnswer: 'This is my answer to the open question.',
        status: 'IN_PROGRESS',
        attemptId: '550e8400-e29b-41d4-a716-446655440010',
        questionId: '550e8400-e29b-41d4-a716-446655440022',
        createdAt: new Date('2023-01-01T10:06:00Z'),
        updatedAt: new Date('2023-01-01T10:06:00Z'),
      },
    }),
  };

  static readonly submitAnswerErrorResponses = {
    invalidInput: {
      error: 'INVALID_INPUT',
      message: 'Invalid input data',
    },

    attemptNotFound: {
      error: 'ATTEMPT_NOT_FOUND',
      message: 'Attempt not found',
    },

    attemptNotActive: {
      error: 'ATTEMPT_NOT_ACTIVE',
      message: 'Attempt is not active',
    },

    questionNotFound: {
      error: 'QUESTION_NOT_FOUND',
      message: 'Question not found',
    },

    invalidAnswerType: {
      error: 'INVALID_ANSWER_TYPE',
      message: 'Multiple choice questions require selectedOptionId',
    },
  };
}