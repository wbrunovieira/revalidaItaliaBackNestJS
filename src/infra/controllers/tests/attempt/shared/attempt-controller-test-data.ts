// src/infra/controllers/tests/attempt/shared/attempt-controller-test-data.ts
import { StartAttemptDto } from '@/domain/assessment/application/dtos/start-attempt.dto';
import { SubmitAnswerDto } from '@/domain/assessment/application/dtos/submit-answer.dto';
import { SubmitAttemptParamDto } from '@/domain/assessment/application/dtos/submit-attempt-param.dto';
import { StartAttemptResponse } from '@/domain/assessment/application/dtos/start-attempt-response.dto';
import { SubmitAnswerResponse } from '@/domain/assessment/application/dtos/submit-answer-response.dto';
import { SubmitAttemptResponse } from '@/domain/assessment/application/dtos/submit-attempt-response.dto';
import { GetAttemptResultsResponse, ArgumentResult } from '@/domain/assessment/application/dtos/get-attempt-results-response.dto';

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

  // SubmitAttempt test data
  static readonly validSubmitAttemptParams = {
    withActiveAttempt: (): SubmitAttemptParamDto => ({
      id: '550e8400-e29b-41d4-a716-446655440010',
    }),
  };

  static readonly mockSubmitAttemptResponse = {
    autoGraded: (): SubmitAttemptResponse => ({
      attempt: {
        id: '550e8400-e29b-41d4-a716-446655440010',
        status: 'GRADED',
        score: 85.5,
        startedAt: new Date('2023-01-01T10:00:00Z'),
        submittedAt: new Date('2023-01-01T10:15:00Z'),
        gradedAt: new Date('2023-01-01T10:15:00Z'),
        userId: '550e8400-e29b-41d4-a716-446655440001',
        assessmentId: '550e8400-e29b-41d4-a716-446655440002',
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T10:15:00Z'),
      },
      summary: {
        totalQuestions: 10,
        answeredQuestions: 10,
        correctAnswers: 8,
        scorePercentage: 80.0,
      },
    }),

    manualGrading: (): SubmitAttemptResponse => ({
      attempt: {
        id: '550e8400-e29b-41d4-a716-446655440011',
        status: 'SUBMITTED',
        startedAt: new Date('2023-01-01T10:00:00Z'),
        submittedAt: new Date('2023-01-01T10:20:00Z'),
        userId: '550e8400-e29b-41d4-a716-446655440003',
        assessmentId: '550e8400-e29b-41d4-a716-446655440004',
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T10:20:00Z'),
      },
      summary: {
        totalQuestions: 5,
        answeredQuestions: 5,
        correctAnswers: undefined,
        scorePercentage: undefined,
      },
    }),

    partialAnswers: (): SubmitAttemptResponse => ({
      attempt: {
        id: '550e8400-e29b-41d4-a716-446655440012',
        status: 'GRADED',
        score: 50.0,
        startedAt: new Date('2023-01-01T10:00:00Z'),
        submittedAt: new Date('2023-01-01T10:10:00Z'),
        gradedAt: new Date('2023-01-01T10:10:00Z'),
        userId: '550e8400-e29b-41d4-a716-446655440005',
        assessmentId: '550e8400-e29b-41d4-a716-446655440006',
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T10:10:00Z'),
      },
      summary: {
        totalQuestions: 8,
        answeredQuestions: 4,
        correctAnswers: 2,
        scorePercentage: 50.0,
      },
    }),
  };

  // GetAttemptResults test data
  readonly validAttemptId = '550e8400-e29b-41d4-a716-446655440010';
  readonly nonExistentAttemptId = '550e8400-e29b-41d4-a716-446655440000';

  createGetAttemptResultsResponse(
    assessmentType: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA',
    hasPendingReview = false
  ): GetAttemptResultsResponse {
    const baseResponse = {
      attempt: {
        id: this.validAttemptId,
        status: 'GRADED' as const,
        score: assessmentType === 'PROVA_ABERTA' && hasPendingReview ? undefined : 85.5,
        startedAt: new Date('2023-01-01T10:00:00Z'),
        submittedAt: new Date('2023-01-01T10:15:00Z'),
        gradedAt: assessmentType === 'PROVA_ABERTA' && hasPendingReview ? undefined : new Date('2023-01-01T10:15:00Z'),
        timeLimitExpiresAt: assessmentType === 'SIMULADO' ? new Date('2023-01-01T12:00:00Z') : undefined,
        userId: '550e8400-e29b-41d4-a716-446655440001',
        assessmentId: '550e8400-e29b-41d4-a716-446655440002',
      },
      assessment: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: `Test ${assessmentType} Assessment`,
        type: assessmentType,
        passingScore: 70,
        timeLimitInMinutes: assessmentType === 'SIMULADO' ? 120 : undefined,
      },
      results: this.createResultsByType(assessmentType, hasPendingReview),
      answers: this.createAnswerDetails(assessmentType),
    };

    return baseResponse;
  }

  private createResultsByType(
    assessmentType: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA',
    hasPendingReview: boolean
  ) {
    const baseResults = {
      totalQuestions: 10,
      answeredQuestions: 10,
      timeSpent: 15,
    };

    if (assessmentType === 'PROVA_ABERTA') {
      return {
        ...baseResults,
        reviewedQuestions: hasPendingReview ? 7 : 10,
        pendingReview: hasPendingReview ? 3 : 0,
        correctAnswers: hasPendingReview ? undefined : 8,
        scorePercentage: hasPendingReview ? undefined : 80,
        passed: hasPendingReview ? undefined : true,
      };
    }

    const results = {
      ...baseResults,
      correctAnswers: 8,
      scorePercentage: 80,
      passed: true,
    };

    if (assessmentType === 'SIMULADO') {
      return {
        ...results,
        argumentResults: this.createArgumentResults(),
      };
    }

    return results;
  }

  private createArgumentResults(): ArgumentResult[] {
    return [
      {
        argumentId: '550e8400-e29b-41d4-a716-446655440021',
        argumentTitle: 'Clínica Médica',
        totalQuestions: 5,
        correctAnswers: 4,
        scorePercentage: 80,
      },
      {
        argumentId: '550e8400-e29b-41d4-a716-446655440022',
        argumentTitle: 'Cirurgia Geral',
        totalQuestions: 5,
        correctAnswers: 4,
        scorePercentage: 80,
      },
    ];
  }

  private createAnswerDetails(assessmentType: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA') {
    const baseAnswers = [
      {
        questionId: '550e8400-e29b-41d4-a716-446655440020',
        questionText: 'Qual é o principal objetivo da medicina legal?',
        questionType: 'MULTIPLE_CHOICE' as const,
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440021',
        selectedOptionText: 'Aplicar conhecimentos médicos ao direito',
        correctOptionId: '550e8400-e29b-41d4-a716-446655440021',
        correctOptionText: 'Aplicar conhecimentos médicos ao direito',
        explanation: 'A medicina legal é a aplicação dos conhecimentos médicos na resolução de questões jurídicas.',
        isCorrect: true,
        status: 'GRADED' as const,
      },
      {
        questionId: '550e8400-e29b-41d4-a716-446655440023',
        questionText: 'Como tratar hipertensão arterial?',
        questionType: 'OPEN' as const,
        textAnswer: 'O tratamento da hipertensão envolve mudanças no estilo de vida e medicamentos anti-hipertensivos.',
        teacherComment: 'Resposta correta e completa.',
        submittedAt: new Date('2023-01-01T10:10:00Z'),
        reviewedAt: new Date('2023-01-01T10:15:00Z'),
        isCorrect: true,
        status: 'GRADED' as const,
      },
    ];

    if (assessmentType === 'SIMULADO') {
      return baseAnswers.map(answer => ({
        ...answer,
        argumentId: '550e8400-e29b-41d4-a716-446655440021',
        argumentTitle: 'Clínica Médica',
      }));
    }

    return baseAnswers;
  }

  static readonly getAttemptResultsErrorResponses = {
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
      message: 'Unexpected error occurred',
    },

    repositoryError: {
      error: 'INTERNAL_ERROR',
      message: 'Database connection failed',
    },
  };
}