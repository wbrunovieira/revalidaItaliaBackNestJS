// test/e2e/assessment/shared/assessment-test-data.ts

export class AssessmentTestData {
  static readonly TEST_USER_ID = 'test-user-001';
  static readonly TEST_LESSON_ID = 'test-lesson-001';
  static readonly TEST_QUIZ_ID = 'test-quiz-001';
  static readonly TEST_SIMULADO_ID = 'test-simulado-001';
  static readonly TEST_PROVA_ABERTA_ID = 'test-prova-001';
  static readonly TEST_EMPTY_ASSESSMENT_ID = 'test-empty-001';

  static readonly INVALID_UUID = 'invalid-uuid';
  static readonly NON_EXISTENT_UUID = '00000000-0000-0000-0000-000000000000';
  static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  static readonly QUIZ_DATA = {
    slug: 'test-quiz',
    title: 'Test Quiz',
    description: 'A test quiz for E2E testing',
    type: 'QUIZ',
    passingScore: 70,
    randomizeQuestions: false,
    randomizeOptions: false,
  };

  static readonly SIMULADO_DATA = {
    slug: 'test-simulado',
    title: 'Test Simulado',
    description: 'A comprehensive medical exam simulation',
    type: 'SIMULADO',
    passingScore: 80,
    timeLimitInMinutes: 120,
    randomizeQuestions: true,
    randomizeOptions: true,
  };

  static readonly PROVA_ABERTA_DATA = {
    slug: 'test-prova-aberta',
    title: 'Test Prova Aberta',
    description: 'An open-ended exam',
    type: 'PROVA_ABERTA',
    randomizeQuestions: false,
    randomizeOptions: false,
  };

  static readonly EMPTY_ASSESSMENT_DATA = {
    slug: 'empty-assessment',
    title: 'Empty Assessment',
    description: 'An assessment with no questions',
    type: 'QUIZ',
    passingScore: 70,
    randomizeQuestions: false,
    randomizeOptions: false,
  };

  static readonly QUESTION_MULTIPLE_CHOICE = {
    text: 'What is 2+2?',
    type: 'MULTIPLE_CHOICE',
    options: [{ text: '3' }, { text: '4' }, { text: '5' }],
    correctAnswer: {
      explanation: 'Two plus two equals four',
      translations: [
        { locale: 'pt', explanation: 'Dois mais dois é igual a quatro' },
        { locale: 'it', explanation: 'Due più due fa quattro' },
      ],
    },
  };

  static readonly QUESTION_SIMULADO = {
    text: 'What is the normal heart rate?',
    type: 'MULTIPLE_CHOICE',
    options: [{ text: '40-60 bpm' }, { text: '60-100 bpm' }],
    correctAnswer: {
      explanation: 'Normal adult resting heart rate is 60-100 bpm',
    },
  };

  static readonly QUESTION_OPEN = {
    text: 'Explain the cardiovascular system',
    type: 'OPEN',
  };

  static readonly ARGUMENT_CARDIOLOGY = {
    title: 'Cardiology',
  };

  static readonly LESSON_DATA = {
    slug: 'test-lesson',
    moduleId: 'test-module-id',
    order: 1,
    translations: [
      {
        locale: 'pt',
        title: 'Aula de Teste',
        description: 'Descrição da aula de teste',
      },
    ],
  };

  // Payload generators for POST /assessments
  static createQuizPayload(overrides?: Partial<any>) {
    const base = {
      title: 'JavaScript Fundamentals Quiz',
      description: 'Test your knowledge of JavaScript basics',
      type: 'QUIZ',
      quizPosition: 'AFTER_LESSON',
      passingScore: 70,
      randomizeQuestions: false,
      randomizeOptions: false,
    };
    
    // Handle explicit undefined description by not including it
    if (overrides && 'description' in overrides && overrides.description === undefined) {
      const { description, ...baseWithoutDescription } = base;
      return { ...baseWithoutDescription, ...overrides };
    }
    
    return { ...base, ...overrides };
  }

  static createSimuladoPayload(overrides?: Partial<any>) {
    const base = {
      title: 'Programming Simulation Exam',
      description: 'Comprehensive programming simulation',
      type: 'SIMULADO',
      passingScore: 80,
      timeLimitInMinutes: 120,
      randomizeQuestions: true,
      randomizeOptions: true,
    };
    
    // Handle explicit undefined description by not including it
    if (overrides && 'description' in overrides && overrides.description === undefined) {
      const { description, ...baseWithoutDescription } = base;
      return { ...baseWithoutDescription, ...overrides };
    }
    
    return { ...base, ...overrides };
  }

  static createProvaAbertaPayload(overrides?: Partial<any>) {
    const base = {
      title: 'Advanced Programming Essay',
      description: 'Open-ended programming assessment',
      type: 'PROVA_ABERTA',
      passingScore: 75,
      randomizeQuestions: false,
      randomizeOptions: false,
    };
    
    // Handle explicit undefined description by not including it
    if (overrides && 'description' in overrides && overrides.description === undefined) {
      const { description, ...baseWithoutDescription } = base;
      return { ...baseWithoutDescription, ...overrides };
    }
    
    return { ...base, ...overrides };
  }

  static createInvalidPayloads() {
    return {
      missingTitle: {
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      shortTitle: {
        title: 'AB',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      invalidType: {
        title: 'Valid Title',
        type: 'INVALID_TYPE',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      negativeScore: {
        title: 'Valid Title',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: -10,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      scoreAbove100: {
        title: 'Valid Title',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 150,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      invalidLessonId: {
        title: 'Quiz With Invalid Lesson',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: 'invalid-uuid',
      },
    };
  }

  static createEdgeCasePayloads() {
    return {
      longTitle: {
        title: 'A'.repeat(255),
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      longDescription: {
        title: 'Assessment With Long Description',
        description: 'B'.repeat(1000),
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      unicodeTitle: {
        title: 'Avaliação 中文 العربية русский 🎯',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
      specialCharsTitle: {
        title: 'Avaliação de Programação & Lógica!',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
    };
  }
}
