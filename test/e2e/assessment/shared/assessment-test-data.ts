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
    options: [
      { text: '3' },
      { text: '4' },
      { text: '5' },
    ],
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
    options: [
      { text: '40-60 bpm' },
      { text: '60-100 bpm' },
    ],
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
      { locale: 'pt', title: 'Aula de Teste', description: 'Descrição da aula de teste' },
    ],
  };
}