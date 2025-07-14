// src/infra/controllers/tests/answer/shared/answer-controller-test-data.ts
import { GetAnswerRequest } from '@/domain/assessment/application/dtos/get-answer-request.dto';

export interface AnswerControllerResponse {
  answer: {
    id: string;
    correctOptionId?: string;
    explanation: string;
    questionId: string;
    translations: Array<{
      locale: string;
      explanation: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface ExpectedError {
  statusCode: number;
  error?: string;
  message?: string | string[];
}

export class AnswerControllerTestData {
  /**
   * Valid IDs for GetAnswer requests
   */
  static readonly validIds = {
    standard: (): GetAnswerRequest => ({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    }),

    multipleChoice: (): GetAnswerRequest => ({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    }),

    openQuestion: (): GetAnswerRequest => ({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    }),

    withTranslations: (): GetAnswerRequest => ({
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    }),

    withoutTranslations: (): GetAnswerRequest => ({
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    }),

    medicalContent: (): GetAnswerRequest => ({
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    }),

    edgeCase: (): GetAnswerRequest => ({
      id: '00000000-0000-0000-0000-000000000000',
    }),
  };

  /**
   * Invalid IDs for GetAnswer requests
   */
  static readonly invalidIds = {
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
  };

  /**
   * Special request scenarios
   */
  static readonly invalidRequests = {
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
  };

  /**
   * Non-existent answer IDs
   */
  static readonly nonExistentIds = {
    zeros: (): GetAnswerRequest => ({
      id: '00000000-0000-0000-0000-000000000000',
    }),

    notFound: (): GetAnswerRequest => ({
      id: 'aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
    }),

    deleted: (): GetAnswerRequest => ({
      id: 'ddddeeee-ffff-aaaa-bbbb-ccccddddeeee',
    }),
  };

  /**
   * Expected success responses
   */
  static readonly expectedResponses = {
    multipleChoice: (
      id: string,
      questionId: string,
      correctOptionId: string,
    ): AnswerControllerResponse => ({
      answer: {
        id,
        correctOptionId,
        explanation: expect.any(String),
        questionId,
        translations: expect.arrayContaining([
          expect.objectContaining({
            locale: expect.any(String),
            explanation: expect.any(String),
          }),
        ]),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    }),

    openQuestion: (
      id: string,
      questionId: string,
    ): AnswerControllerResponse => ({
      answer: {
        id,
        correctOptionId: undefined,
        explanation: expect.any(String),
        questionId,
        translations: expect.arrayContaining([
          expect.objectContaining({
            locale: expect.any(String),
            explanation: expect.any(String),
          }),
        ]),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    }),

    withSpecificData: (answerData: {
      id: string;
      correctOptionId?: string;
      explanation: string;
      questionId: string;
      translations: Array<{
        locale: string;
        explanation: string;
      }>;
      createdAt: Date;
      updatedAt: Date;
    }): AnswerControllerResponse => ({
      answer: answerData,
    }),
  };

  /**
   * Expected error responses
   */
  static readonly expectedErrors = {
    invalidInput: (): ExpectedError => ({
      statusCode: 400,
      error: 'INVALID_INPUT',
      message: 'Invalid input data',
    }),

    answerNotFound: (): ExpectedError => ({
      statusCode: 404,
      error: 'ANSWER_NOT_FOUND',
      message: 'Answer not found',
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
   * Sample answer data for testing
   */
  static readonly sampleAnswers = {
    standard: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      correctOptionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      explanation: 'This is the correct answer because it follows the medical guidelines.',
      questionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      translations: [
        {
          locale: 'pt',
          explanation: 'Esta é a resposta correta porque segue as diretrizes médicas.',
        },
        {
          locale: 'it',
          explanation: 'Questa è la risposta corretta perché segue le linee guida mediche.',
        },
      ],
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      updatedAt: new Date('2023-01-01T00:00:00.000Z'),
    },

    multipleChoiceQuiz: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      correctOptionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      explanation: 'This is the correct answer because it follows the medical guidelines.',
      questionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      translations: [
        {
          locale: 'pt',
          explanation: 'Esta é a resposta correta porque segue as diretrizes médicas.',
        },
        {
          locale: 'it',
          explanation: 'Questa è la risposta corretta perché segue le linee guida mediche.',
        },
      ],
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      updatedAt: new Date('2023-01-01T00:00:00.000Z'),
    },

    openQuestionAnswer: {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      correctOptionId: undefined,
      explanation: 'A comprehensive answer should include patient history, physical examination, differential diagnosis, and treatment plan.',
      questionId: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890',
      translations: [
        {
          locale: 'pt',
          explanation: 'Uma resposta abrangente deve incluir história do paciente, exame físico, diagnóstico diferencial e plano de tratamento.',
        },
      ],
      createdAt: new Date('2023-01-02T00:00:00.000Z'),
      updatedAt: new Date('2023-01-02T00:00:00.000Z'),
    },

    medicalContent: {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      correctOptionId: 'c1b2c3d4-e5f6-7890-abcd-ef1234567890',
      explanation: 'Hypertension is diagnosed when systolic BP ≥140 mmHg or diastolic BP ≥90 mmHg on two separate occasions.',
      questionId: 'c1b2c3d4-e5f6-7890-abcd-ef1234567890',
      translations: [
        {
          locale: 'pt',
          explanation: 'A hipertensão é diagnosticada quando a PA sistólica ≥140 mmHg ou PA diastólica ≥90 mmHg em duas ocasiões separadas.',
        },
        {
          locale: 'it',
          explanation: 'L\'ipertensione è diagnosticata quando la PA sistolica ≥140 mmHg o la PA diastolica ≥90 mmHg in due occasioni separate.',
        },
        {
          locale: 'es',
          explanation: 'La hipertensión se diagnostica cuando la PA sistólica ≥140 mmHg o la PA diastólica ≥90 mmHg en dos ocasiones separadas.',
        },
      ],
      createdAt: new Date('2023-01-03T00:00:00.000Z'),
      updatedAt: new Date('2023-01-03T00:00:00.000Z'),
    },

    withSpecialChars: {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      correctOptionId: undefined,
      explanation: 'Answer with special characters: @#$%^&*()! and symbols: ±≤≥≠≈',
      questionId: 'd1b2c3d4-e5f6-7890-abcd-ef1234567890',
      translations: [
        {
          locale: 'pt',
          explanation: 'Resposta com caracteres especiais: @#$%^&*()! e símbolos: ±≤≥≠≈',
        },
      ],
      createdAt: new Date('2023-01-04T00:00:00.000Z'),
      updatedAt: new Date('2023-01-04T00:00:00.000Z'),
    },

    withUnicode: {
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      correctOptionId: undefined,
      explanation: 'Answer in multiple languages: português 中文 العربية русский with emojis 🎯🚀',
      questionId: 'e1b2c3d4-e5f6-7890-abcd-ef1234567890',
      translations: [
        {
          locale: 'pt',
          explanation: 'Resposta em múltiplas línguas: português 中文 العربية русский com emojis 🎯🚀',
        },
      ],
      createdAt: new Date('2023-01-05T00:00:00.000Z'),
      updatedAt: new Date('2023-01-05T00:00:00.000Z'),
    },

    longExplanation: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      correctOptionId: 'f1b2c3d4-e5f6-7890-abcd-ef1234567890',
      explanation: 'A'.repeat(500), // Long explanation
      questionId: 'f1b2c3d4-e5f6-7890-abcd-ef1234567890',
      translations: [
        {
          locale: 'pt',
          explanation: 'B'.repeat(500), // Long explanation in Portuguese
        },
      ],
      createdAt: new Date('2023-01-06T00:00:00.000Z'),
      updatedAt: new Date('2023-01-06T00:00:00.000Z'),
    },
  };

  /**
   * Performance test data
   */
  static readonly performance = {
    concurrent: (count: number): GetAnswerRequest[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: `${i.toString(16).padStart(8, '0')}-aaaa-bbbb-cccc-dddddddddddd`,
      }));
    },

    sequential: (count: number): GetAnswerRequest[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: `${i.toString(16).padStart(8, '0')}-bbbb-cccc-dddd-eeeeeeeeeeee`,
      }));
    },
  };

  /**
   * UUID regex pattern for validation
   */
  static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /**
   * Get random valid ID
   */
  static getRandomValidId(): GetAnswerRequest {
    const keys = Object.keys(this.validIds);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return (this.validIds as any)[randomKey]();
  }

  /**
   * Get random invalid ID
   */
  static getRandomInvalidId(): any {
    const keys = Object.keys(this.invalidIds);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return (this.invalidIds as any)[randomKey]();
  }

  /**
   * Get random sample answer
   */
  static getRandomSampleAnswer(): any {
    const keys = Object.keys(this.sampleAnswers);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return (this.sampleAnswers as any)[randomKey];
  }
}