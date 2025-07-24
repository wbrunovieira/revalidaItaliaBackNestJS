// test/e2e/answers/shared/answer-test-data.ts
import { randomUUID } from 'crypto';

export interface GetAnswerRequest {
  id: string;
}

export interface ListAnswersRequest {
  page?: number;
  limit?: number;
  questionId?: string;
}

export interface ListAnswersResponse {
  answers: Array<{
    id: string;
    explanation: string;
    questionId: string;
    correctOptionId?: string;
    translations: Array<{
      locale: string;
      explanation: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface ExpectedError {
  statusCode: number;
  error?: string;
  message?: string | string[];
}

export interface AnswerResponse {
  answer: {
    id: string;
    explanation: string;
    questionId: string;
    correctOptionId?: string;
    translations: Array<{
      locale: string;
      explanation: string;
    }>;
    createdAt: string;
    updatedAt: string;
  };
}

export class AnswerTestData {
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
      id: '00000000-0000-0000-0000-000000000001',
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

    randomUuid: (): GetAnswerRequest => ({
      id: randomUUID(),
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
    ): AnswerResponse => ({
      answer: {
        id,
        explanation: expect.any(String),
        questionId,
        correctOptionId,
        translations: expect.arrayContaining([
          expect.objectContaining({
            locale: expect.any(String),
            explanation: expect.any(String),
          }),
        ]),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    }),

    openQuestion: (id: string, questionId: string): AnswerResponse => ({
      answer: {
        id,
        explanation: expect.any(String),
        questionId,
        correctOptionId: undefined,
        translations: expect.arrayContaining([
          expect.objectContaining({
            locale: expect.any(String),
            explanation: expect.any(String),
          }),
        ]),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    }),

    withSpecificData: (answerData: {
      id: string;
      explanation: string;
      questionId: string;
      correctOptionId?: string;
      translations: Array<{
        locale: string;
        explanation: string;
      }>;
      createdAt: string;
      updatedAt: string;
    }): AnswerResponse => ({
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

    internalError: (): ExpectedError => ({
      statusCode: 500,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error',
    }),
  };

  /**
   * Sample answer data for testing
   */
  static readonly sampleAnswers = {
    standard: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      explanation:
        'This is a standard answer explanation for testing purposes.',
      questionId: 'question-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      correctOptionId: 'option-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      translations: [
        {
          locale: 'pt',
          explanation: 'Esta é uma explicação padrão para fins de teste.',
        },
        {
          locale: 'it',
          explanation: 'Questa è una spiegazione standard per scopi di test.',
        },
        {
          locale: 'es',
          explanation: 'Esta es una explicación estándar para fines de prueba.',
        },
      ],
    },

    multipleChoiceQuiz: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      explanation: 'Brasília is the capital of Brazil, established in 1960.',
      questionId: 'question-bbbb-cccc-dddd-eeee-ffffffffffff',
      correctOptionId: 'option-bbbb-cccc-dddd-eeee-ffffffffffff',
      translations: [
        {
          locale: 'pt',
          explanation: 'Brasília é a capital do Brasil, estabelecida em 1960.',
        },
        {
          locale: 'it',
          explanation:
            'Brasília è la capitale del Brasile, stabilita nel 1960.',
        },
        {
          locale: 'es',
          explanation: 'Brasília es la capital de Brasil, establecida en 1960.',
        },
      ],
    },

    openQuestionAnswer: {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      explanation:
        'Hypertension is characterized by elevated blood pressure (≥140/90 mmHg). The pathophysiology involves increased peripheral resistance, reduced arterial compliance, and endothelial dysfunction. Treatment includes lifestyle modifications and antihypertensive medications.',
      questionId: 'question-cccc-dddd-eeee-ffff-aaaaaaaaaaaa',
      correctOptionId: undefined,
      translations: [
        {
          locale: 'pt',
          explanation:
            'A hipertensão é caracterizada por pressão arterial elevada (≥140/90 mmHg). A fisiopatologia envolve aumento da resistência periférica, redução da complacência arterial e disfunção endotelial. O tratamento inclui modificações no estilo de vida e medicamentos anti-hipertensivos.',
        },
      ],
    },

    medicalContent: {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      explanation:
        'Acute myocardial infarction (AMI) is diagnosed based on clinical presentation, ECG changes, and elevated cardiac biomarkers. The pathophysiology involves coronary artery occlusion leading to myocardial necrosis. Treatment includes reperfusion therapy, antiplatelet agents, and supportive care.',
      questionId: 'question-dddd-eeee-ffff-aaaa-bbbbbbbbbbbb',
      correctOptionId: 'option-dddd-eeee-ffff-aaaa-bbbbbbbbbbbb',
      translations: [
        {
          locale: 'pt',
          explanation:
            'O infarto agudo do miocárdio (IAM) é diagnosticado com base na apresentação clínica, alterações no ECG e biomarcadores cardíacos elevados. A fisiopatologia envolve oclusão da artéria coronária levando à necrose miocárdica. O tratamento inclui terapia de reperfusão, agentes antiplaquetários e cuidados de suporte.',
        },
        {
          locale: 'it',
          explanation:
            "L'infarto miocardico acuto (IMA) è diagnosticato sulla base della presentazione clinica, dei cambiamenti ECG e dei biomarcatori cardiaci elevati. La fisiopatologia coinvolge l'occlusione dell'arteria coronaria che porta alla necrosi miocardica. Il trattamento include terapia di riperfusione, agenti antipiastrinici e cure di supporto.",
        },
        {
          locale: 'es',
          explanation:
            'El infarto agudo de miocardio (IAM) se diagnostica basándose en la presentación clínica, cambios en el ECG y biomarcadores cardíacos elevados. La fisiopatología involucra oclusión de la arteria coronaria que lleva a necrosis miocárdica. El tratamiento incluye terapia de reperfusión, agentes antiplaquetarios y cuidado de apoyo.',
        },
      ],
    },

    withSpecialChars: {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      explanation:
        'Answer with special characters: @#$%^&*()! and symbols: ±≤≥≠≈',
      questionId: 'question-eeee-ffff-aaaa-bbbb-cccccccccccc',
      correctOptionId: undefined,
      translations: [
        {
          locale: 'pt',
          explanation:
            'Resposta com caracteres especiais: @#$%^&*()! e símbolos: ±≤≥≠≈',
        },
      ],
    },

    withUnicode: {
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      explanation:
        'Answer in multiple languages: português 中文 العربية русский with emojis 🎯🚀',
      questionId: 'question-ffff-aaaa-bbbb-cccc-dddddddddddd',
      correctOptionId: undefined,
      translations: [
        {
          locale: 'pt',
          explanation:
            'Resposta em múltiplas línguas: português 中文 العربية русский com emojis 🎯🚀',
        },
        {
          locale: 'zh',
          explanation:
            '多语言答案：português 中文 العربية русский 带表情符号 🎯🚀',
        },
      ],
    },

    longExplanation: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      explanation: 'A'.repeat(500), // Long explanation
      questionId: 'question-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      correctOptionId: 'option-aaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      translations: [
        {
          locale: 'pt',
          explanation: 'B'.repeat(500), // Long explanation in Portuguese
        },
      ],
    },

    minimalExplanation: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      explanation: 'A',
      questionId: 'question-bbbb-cccc-dddd-eeee-ffffffffffff',
      correctOptionId: 'option-bbbb-cccc-dddd-eeee-ffffffffffff',
      translations: [
        {
          locale: 'pt',
          explanation: 'B',
        },
      ],
    },

    emptyTranslations: {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      explanation: 'Answer with no translations',
      questionId: 'question-cccc-dddd-eeee-ffff-aaaaaaaaaaaa',
      correctOptionId: undefined,
      translations: [],
    },

    singleTranslation: {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      explanation: 'Answer with single translation',
      questionId: 'question-dddd-eeee-ffff-aaaa-bbbbbbbbbbbb',
      correctOptionId: 'option-dddd-eeee-ffff-aaaa-bbbbbbbbbbbb',
      translations: [
        {
          locale: 'pt',
          explanation: 'Resposta com tradução única',
        },
      ],
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

  /**
   * Generate test data for different scenarios
   */
  static readonly testScenarios = {
    happyPath: {
      description: 'Standard successful retrieval',
      requests: [
        AnswerTestData.validIds.standard(),
        AnswerTestData.validIds.multipleChoice(),
        AnswerTestData.validIds.openQuestion(),
      ],
    },

    errorCases: {
      description: 'Various error conditions',
      requests: [
        AnswerTestData.nonExistentIds.notFound(),
        AnswerTestData.invalidIds.invalidFormat(),
        AnswerTestData.invalidIds.emptyString(),
      ],
    },

    edgeCases: {
      description: 'Edge cases and special scenarios',
      requests: [
        AnswerTestData.validIds.withTranslations(),
        AnswerTestData.validIds.withoutTranslations(),
        AnswerTestData.validIds.medicalContent(),
      ],
    },

    validationTests: {
      description: 'Input validation tests',
      requests: [
        AnswerTestData.invalidIds.nullValue(),
        AnswerTestData.invalidIds.undefinedValue(),
        AnswerTestData.invalidIds.numberValue(),
        AnswerTestData.invalidIds.booleanValue(),
        AnswerTestData.invalidIds.arrayValue(),
        AnswerTestData.invalidIds.objectValue(),
      ],
    },

    performanceTests: {
      description: 'Performance and load tests',
      requests: [
        ...AnswerTestData.performance.concurrent(5),
        ...AnswerTestData.performance.sequential(3),
      ],
    },
  };

  /**
   * Get all invalid ID test cases
   */
  static getAllInvalidIds(): any[] {
    return Object.values(this.invalidIds).map((fn) => fn());
  }

  /**
   * Get all valid ID test cases
   */
  static getAllValidIds(): GetAnswerRequest[] {
    return Object.values(this.validIds).map((fn) => fn());
  }

  /**
   * Get all non-existent ID test cases
   */
  static getAllNonExistentIds(): GetAnswerRequest[] {
    return Object.values(this.nonExistentIds).map((fn) => fn());
  }

  /**
   * Create test data for pagination testing
   */
  static createPaginationTestData(count: number): GetAnswerRequest[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `${i.toString().padStart(8, '0')}-test-page-data-${i.toString(16).padStart(8, '0')}`,
    }));
  }

  /**
   * Validation helper methods
   */
  static isValidUUID(id: string): boolean {
    return this.UUID_REGEX.test(id);
  }

  static isValidAnswerResponse(response: any): boolean {
    return (
      response &&
      response.answer &&
      typeof response.answer.id === 'string' &&
      typeof response.answer.explanation === 'string' &&
      typeof response.answer.questionId === 'string' &&
      Array.isArray(response.answer.translations) &&
      typeof response.answer.createdAt === 'string' &&
      typeof response.answer.updatedAt === 'string'
    );
  }
}
