// test/e2e/question-options/shared/question-option-test-data.ts

export class QuestionOptionTestData {
  static readonly MAX_EXECUTION_TIME = 2000; // 2 seconds max per operation
  static readonly TIMEOUTS = {
    SHORT: 10000,   // 10 seconds
    MEDIUM: 30000,  // 30 seconds
    LONG: 60000,    // 60 seconds
  };

  static readonly validQuestionOptions = {
    multipleChoice: {
      basic: ['Option A', 'Option B', 'Option C', 'Option D'],
      medical: [
        'Hypertension',
        'Diabetes mellitus',
        'Coronary artery disease',
        'Chronic kidney disease',
      ],
      portuguese: [
        'Aplicar conhecimentos médicos ao direito',
        'Realizar procedimentos cirúrgicos',
        'Diagnosticar doenças',
        'Prescrever medicamentos',
      ],
      italian: [
        'Applicare le conoscenze mediche al diritto',
        'Eseguire procedure chirurgiche',
        'Diagnosticare malattie',
        'Prescrivere farmaci',
      ],
      spanish: [
        'Aplicar conocimientos médicos al derecho',
        'Realizar procedimientos quirúrgicos',
        'Diagnosticar enfermedades',
        'Recetar medicamentos',
      ],
    },
    singleOption: ['Only option available'],
    emptyOptions: [],
    longText: [
      'A'.repeat(500), // Maximum length option
      'Very detailed medical explanation about the pathophysiology of cardiovascular diseases and their impact on patient outcomes',
    ],
    specialCharacters: [
      'Option with @#$%^&*()',
      'Math symbols: ±≤≥≠≈∞',
      'Currency: $€£¥₹',
      'Punctuation: "quotes" and \'apostrophes\' with (parentheses)',
    ],
    unicode: [
      'português: ção, ãe, ñ',
      '中文: 你好世界',
      'العربية: مرحبا بالعالم',
      'русский: Привет мир',
      'Emojis: 🎯🚀💡🔬⚕️',
    ],
    whitespace: [
      '  Option with leading spaces',
      'Option with trailing spaces  ',
      'Option\twith\ttabs',
      'Option\nwith\nnewlines',
      'Option\r\nwith\r\nCRLF',
    ],
    minLength: ['Min text.'], // 9 characters (minimum for option text)
    maxLength: ['A'.repeat(500)], // 500 characters (maximum for option text)
  };

  static readonly listQuestionOptions = {
    invalidIds: {
      invalidFormat: () => ({ id: 'invalid-uuid-format' }),
      notUuid: () => ({ id: 'not-a-uuid-at-all' }),
      tooShort: () => ({ id: '123' }),
      tooLong: () => ({ id: 'a'.repeat(100) }),
      wrongHyphens: () => ({ id: '550e8400e29b-41d4a716-446655440000' }),
      missingHyphens: () => ({ id: '550e8400e29b41d4a716446655440000' }),
      specialChars: () => ({ id: '550e8400-e29b-41d4-a716-44665544000@' }),
      invalidChars: () => ({ id: '550e8400-e29b-41d4-a716-44665544000g' }),
      emptyString: () => ({ id: '' }),
      withWhitespace: () => ({ id: ' 550e8400-e29b-41d4-a716-446655440000 ' }),
      withTabs: () => ({ id: '\t550e8400-e29b-41d4-a716-446655440000\t' }),
      withNewlines: () => ({ id: '\n550e8400-e29b-41d4-a716-446655440000\n' }),
      unicodeChars: () => ({ id: '550e8400-e29b-41d4-a716-44665544你好' }),
      emojis: () => ({ id: '550e8400-e29b-41d4-a716-446655440🎯🚀' }),
      sqlInjection: () => ({ id: "' OR '1'='1' --" }),
      xssAttempt: () => ({ id: '<script>alert("xss")</script>' }),
      longString: () => ({ id: 'a'.repeat(1000) }),
    },
    nonExistentIds: {
      zeros: () => ({ id: '00000000-0000-0000-0000-000000000000' }),
      notFound: () => ({ id: '11111111-1111-1111-1111-111111111111' }),
      deleted: () => ({ id: '99999999-9999-9999-9999-999999999999' }),
    },
  };

  static readonly createQuestionOption = {
    validPayloads: {
      basic: (questionId: string) => ({
        text: 'Basic option text',
        questionId,
      }),
      medical: (questionId: string) => ({
        text: 'Hypertension with diabetes complications',
        questionId,
      }),
      portuguese: (questionId: string) => ({
        text: 'Aplicar conhecimentos médicos ao direito',
        questionId,
      }),
      italian: (questionId: string) => ({
        text: 'Applicare le conoscenze mediche al diritto',
        questionId,
      }),
      spanish: (questionId: string) => ({
        text: 'Aplicar conocimientos médicos al derecho',
        questionId,
      }),
      specialChars: (questionId: string) => ({
        text: 'Option with @#$%^&*() special characters',
        questionId,
      }),
      unicode: (questionId: string) => ({
        text: 'Unicode: português 中文 العربية русский 🎯🚀',
        questionId,
      }),
      withNewlines: (questionId: string) => ({
        text: 'Option with\nnewlines and\ttabs',
        questionId,
      }),
      minLength: (questionId: string) => ({
        text: 'Min text.',
        questionId,
      }),
      maxLength: (questionId: string) => ({
        text: 'A'.repeat(500),
        questionId,
      }),
      clinicalCase: (questionId: string) => ({
        text: 'Patient presents with acute chest pain, diaphoresis, and ST-elevation on ECG',
        questionId,
      }),
    },
  };

  static readonly testScenarios = {
    performance: {
      singleOption: 1,
      fewOptions: 5,
      manyOptions: 20,
      maxOptions: 50,
    },
    concurrency: {
      lightLoad: 3,
      mediumLoad: 10,
      heavyLoad: 50,
    },
  };

  static readonly expectedResponses = {
    success: {
      emptyOptions: {
        options: [],
      },
      singleOption: (questionId: string, optionText: string) => ({
        options: [
          {
            id: expect.any(String),
            text: optionText,
            questionId: questionId,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        ],
      }),
      multipleOptions: (questionId: string, optionTexts: string[]) => ({
        options: optionTexts.map(text => ({
          id: expect.any(String),
          text: text,
          questionId: questionId,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })),
      }),
    },
    error: {
      invalidInput: {
        error: 'INVALID_INPUT',
        message: expect.any(String),
      },
      questionNotFound: {
        error: 'QUESTION_NOT_FOUND',
        message: 'Question not found',
      },
    },
  };

  static readonly validationRules = {
    questionId: {
      required: true,
      format: 'uuid',
      examples: {
        valid: [
          '550e8400-e29b-41d4-a716-446655440000',
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          'ffffffff-ffff-ffff-ffff-ffffffffffff',
        ],
        invalid: [
          'invalid-uuid',
          '123',
          '',
          null,
          undefined,
        ],
      },
    },
  };

  static readonly databaseConstraints = {
    questionOption: {
      text: {
        maxLength: 500,
        minLength: 1,
        required: true,
      },
      questionId: {
        required: true,
        foreignKey: 'question.id',
      },
    },
  };

  /**
   * Generate test data for load testing
   */
  static generateLoadTestData(questionCount: number, optionsPerQuestion: number): Array<{ text: string; options: string[] }> {
    const questions: Array<{ text: string; options: string[] }> = [];
    
    for (let i = 0; i < questionCount; i++) {
      const options: string[] = [];
      for (let j = 0; j < optionsPerQuestion; j++) {
        options.push(`Question ${i + 1} - Option ${String.fromCharCode(65 + j)}`);
      }
      
      questions.push({
        text: `Load test question ${i + 1} with ${optionsPerQuestion} options`,
        options,
      });
    }
    
    return questions;
  }

  /**
   * Generate test data for different languages
   */
  static generateMultiLanguageTestData() {
    return {
      portuguese: {
        question: 'Qual é o principal objetivo da medicina legal?',
        options: [
          'Aplicar conhecimentos médicos ao direito',
          'Realizar procedimentos cirúrgicos',
          'Diagnosticar doenças',
          'Prescrever medicamentos',
        ],
      },
      italian: {
        question: 'Qual è l\'obiettivo principale della medicina legale?',
        options: [
          'Applicare le conoscenze mediche al diritto',
          'Eseguire procedure chirurgiche',
          'Diagnosticare malattie',
          'Prescrivere farmaci',
        ],
      },
      spanish: {
        question: '¿Cuál es el objetivo principal de la medicina legal?',
        options: [
          'Aplicar conocimientos médicos al derecho',
          'Realizar procedimientos quirúrgicos',
          'Diagnosticar enfermedades',
          'Recetar medicamentos',
        ],
      },
    };
  }

  /**
   * Generate edge case test data
   */
  static generateEdgeCaseTestData() {
    return {
      extremeLengths: {
        veryShort: 'A',
        veryLong: 'A'.repeat(500),
      },
      specialContent: {
        onlyWhitespace: '   \t\n   ',
        mixedWhitespace: '  Option with  mixed   whitespace  ',
        onlyNumbers: '12345',
        onlySymbols: '@#$%^&*()',
      },
      boundaries: {
        exactMinLength: 'A',
        exactMaxLength: 'A'.repeat(500),
        justOverMin: 'AB',
        justUnderMax: 'A'.repeat(499),
      },
    };
  }
}