// requests/dev-setup/dev-ids.ts
// UUIDs fixos para desenvolvimento - sempre os mesmos após reset

export const DEV_IDS = {
  // Auth
  userId: '550e8400-e29b-41d4-a716-446655440001',
  addressId: '550e8400-e29b-41d4-a716-446655440002',

  // Course Catalog - Course 1
  courseId: '550e8400-e29b-41d4-a716-446655440010',
  trackId: '550e8400-e29b-41d4-a716-446655440011',
  moduleId: '550e8400-e29b-41d4-a716-446655440012',
  lessonId: '550e8400-e29b-41d4-a716-446655440013',
  videoId: '550e8400-e29b-41d4-a716-446655440014',
  documentId: '550e8400-e29b-41d4-a716-446655440015',

  // Course Catalog - Course 2
  courseId2: '550e8400-e29b-41d4-a716-446655440030',
  trackId2: '550e8400-e29b-41d4-a716-446655440031',
  moduleId2: '550e8400-e29b-41d4-a716-446655440032',
  lessonId2: '550e8400-e29b-41d4-a716-446655440033',
  videoId2: '550e8400-e29b-41d4-a716-446655440034',
  documentId2: '550e8400-e29b-41d4-a716-446655440035',

  // Course Catalog - Course 3
  courseId3: '550e8400-e29b-41d4-a716-446655440040',
  trackId3: '550e8400-e29b-41d4-a716-446655440041',
  moduleId3: '550e8400-e29b-41d4-a716-446655440042',
  lessonId3: '550e8400-e29b-41d4-a716-446655440043',
  videoId3: '550e8400-e29b-41d4-a716-446655440044',
  documentId3: '550e8400-e29b-41d4-a716-446655440045',

  // Assessment - Quiz
  assessmentId: '550e8400-e29b-41d4-a716-446655440020',
  argumentId: '550e8400-e29b-41d4-a716-446655440021',
  questionId: '550e8400-e29b-41d4-a716-446655440022',
  answerId: '550e8400-e29b-41d4-a716-446655440023',

  // Assessment - Simulado
  assessmentId2: '550e8400-e29b-41d4-a716-446655440050',
  argumentId2: '550e8400-e29b-41d4-a716-446655440051',
  questionId2: '550e8400-e29b-41d4-a716-446655440052',
  answerId2: '550e8400-e29b-41d4-a716-446655440053',

  // Assessment - Perguntas Abertas
  assessmentId3: '550e8400-e29b-41d4-a716-446655440060',
  argumentId3: '550e8400-e29b-41d4-a716-446655440061',
  questionId3: '550e8400-e29b-41d4-a716-446655440062',
  answerId3: '550e8400-e29b-41d4-a716-446655440063',

  // Attempts
  attemptId: '550e8400-e29b-41d4-a716-446655440024',
  attemptAnswerId: '550e8400-e29b-41d4-a716-446655440025',

  // Flashcard Tags
  flashcardTagId1: '550e8400-e29b-41d4-a716-446655440070',
  flashcardTagId2: '550e8400-e29b-41d4-a716-446655440071',
  flashcardTagId3: '550e8400-e29b-41d4-a716-446655440072',
  flashcardTagId4: '550e8400-e29b-41d4-a716-446655440073',
  flashcardTagId5: '550e8400-e29b-41d4-a716-446655440074',
} as const;

// Dados de seed para desenvolvimento
export const DEV_DATA = {
  user: {
    id: DEV_IDS.userId,
    name: 'Dev User',
    email: 'dev@example.com',
    password: 'dev123456',
    cpf: '12345678901',
    role: 'student' as const,
  },
  
  // Course 1
  course: {
    id: DEV_IDS.courseId,
    title: 'Revalida Italia - Medicina',
    slug: 'revalida-italia-medicina',
    description: 'Curso preparatório para revalidação do diploma de medicina na Itália',
    imageUrl: '/images/capa-track.avif',
  },

  track: {
    id: DEV_IDS.trackId,
    title: 'Track Medicina Legal',
    slug: 'track-medicina-legal',
    courseId: DEV_IDS.courseId,
  },

  module: {
    id: DEV_IDS.moduleId,
    title: 'Módulo 1 - Medicina Legal',
    slug: 'modulo-1-medicina-legal',
    description: 'Conceitos fundamentais de medicina legal',
    order: 1,
    trackId: DEV_IDS.trackId,
    imageUrl: '/images/capa-track.avif',
  },

  lesson: {
    id: DEV_IDS.lessonId,
    title: 'Aula 1 - Introdução à Medicina Legal',
    slug: 'aula-1-introducao-medicina-legal',
    description: 'Conceitos básicos e fundamentais da medicina legal',
    order: 1,
    moduleId: DEV_IDS.moduleId,
    imageUrl: '/images/capa-track.avif',
  },

  video: {
    id: DEV_IDS.videoId,
    slug: 'video-medicina-legal-1',
    providerVideoId: 'f9bef333-f884-4e0c-86ae-6291afe1a8dc',
    durationInSeconds: 3600,
    lessonId: DEV_IDS.lessonId,
    imageUrl: '/images/capa-track.avif',
  },

  document: {
    id: DEV_IDS.documentId,
    filename: 'medicina-legal-apostila.pdf',
    lessonId: DEV_IDS.lessonId,
  },

  // Course 2
  course2: {
    id: DEV_IDS.courseId2,
    title: 'Revalida Italia - Clínica Médica',
    slug: 'revalida-italia-clinica-medica',
    description: 'Curso preparatório de clínica médica para revalidação na Itália',
    imageUrl: '/images/capa-track.avif',
  },

  track2: {
    id: DEV_IDS.trackId2,
    title: 'Track Clínica Médica',
    slug: 'track-clinica-medica',
    courseId: DEV_IDS.courseId2,
  },

  module2: {
    id: DEV_IDS.moduleId2,
    title: 'Módulo 1 - Diagnóstico Clínico',
    slug: 'modulo-1-diagnostico-clinico',
    description: 'Fundamentos do diagnóstico clínico',
    order: 1,
    trackId: DEV_IDS.trackId2,
    imageUrl: '/images/capa-track.avif',
  },

  lesson2: {
    id: DEV_IDS.lessonId2,
    title: 'Aula 1 - Anamnese e Exame Físico',
    slug: 'aula-1-anamnese-exame-fisico',
    description: 'Técnicas de anamnese e exame físico',
    order: 1,
    moduleId: DEV_IDS.moduleId2,
    imageUrl: '/images/capa-track.avif',
  },

  video2: {
    id: DEV_IDS.videoId2,
    slug: 'video-clinica-medica-1',
    providerVideoId: '34342247-065b-4330-9185-6841f12da817',
    durationInSeconds: 4200,
    lessonId: DEV_IDS.lessonId2,
    imageUrl: '/images/capa-track.avif',
  },

  document2: {
    id: DEV_IDS.documentId2,
    filename: 'clinica-medica-protocolos.pdf',
    lessonId: DEV_IDS.lessonId2,
  },

  // Course 3
  course3: {
    id: DEV_IDS.courseId3,
    title: 'Revalida Italia - Cirurgia Geral',
    slug: 'revalida-italia-cirurgia-geral',
    description: 'Curso preparatório de cirurgia geral para revalidação na Itália',
    imageUrl: '/images/capa-track.avif',
  },

  track3: {
    id: DEV_IDS.trackId3,
    title: 'Track Cirurgia Geral',
    slug: 'track-cirurgia-geral',
    courseId: DEV_IDS.courseId3,
  },

  module3: {
    id: DEV_IDS.moduleId3,
    title: 'Módulo 1 - Técnicas Cirúrgicas',
    slug: 'modulo-1-tecnicas-cirurgicas',
    description: 'Fundamentos das técnicas cirúrgicas',
    order: 1,
    trackId: DEV_IDS.trackId3,
    imageUrl: '/images/capa-track.avif',
  },

  lesson3: {
    id: DEV_IDS.lessonId3,
    title: 'Aula 1 - Princípios da Cirurgia',
    slug: 'aula-1-principios-cirurgia',
    description: 'Princípios básicos da cirurgia',
    order: 1,
    moduleId: DEV_IDS.moduleId3,
    imageUrl: '/images/capa-track.avif',
  },

  video3: {
    id: DEV_IDS.videoId3,
    slug: 'video-cirurgia-geral-1',
    providerVideoId: '2da57e3d-e40f-4261-b5b7-ad7c4dcd7a8a',
    durationInSeconds: 3900,
    lessonId: DEV_IDS.lessonId3,
    imageUrl: '/images/capa-track.avif',
  },

  document3: {
    id: DEV_IDS.documentId3,
    filename: 'cirurgia-geral-manual.pdf',
    lessonId: DEV_IDS.lessonId3,
  },

  // Assessment 1 - Quiz
  assessment: {
    id: DEV_IDS.assessmentId,
    slug: 'quiz-medicina-legal',
    title: 'Quiz - Medicina Legal',
    description: 'Quiz de verificação sobre medicina legal',
    type: 'QUIZ' as const,
    passingScore: 70,
    randomizeQuestions: false,
    randomizeOptions: false,
    lessonId: DEV_IDS.lessonId,
  },

  argument: {
    id: DEV_IDS.argumentId,
    title: 'Conceitos Fundamentais de Medicina Legal',
    assessmentId: DEV_IDS.assessmentId,
  },

  question: {
    id: DEV_IDS.questionId,
    text: 'Qual é a principal função da medicina legal?',
    type: 'MULTIPLE_CHOICE' as const,
    assessmentId: DEV_IDS.assessmentId,
    argumentId: DEV_IDS.argumentId,
  },

  answer: {
    id: DEV_IDS.answerId,
    explanation: 'A medicina legal é responsável pela aplicação dos conhecimentos médicos ao direito',
    questionId: DEV_IDS.questionId,
  },

  // Assessment 2 - Simulado
  assessment2: {
    id: DEV_IDS.assessmentId2,
    slug: 'simulado-clinica-medica',
    title: 'Simulado - Clínica Médica',
    description: 'Simulado completo de clínica médica',
    type: 'SIMULADO' as const,
    passingScore: 80,
    randomizeQuestions: true,
    randomizeOptions: true,
    lessonId: DEV_IDS.lessonId2,
  },

  argument2: {
    id: DEV_IDS.argumentId2,
    title: 'Diagnóstico Diferencial',
    assessmentId: DEV_IDS.assessmentId2,
  },

  question2: {
    id: DEV_IDS.questionId2,
    text: 'Paciente de 45 anos apresenta dor torácica súbita. Qual o primeiro exame a ser solicitado?',
    type: 'MULTIPLE_CHOICE' as const,
    assessmentId: DEV_IDS.assessmentId2,
    argumentId: DEV_IDS.argumentId2,
  },

  answer2: {
    id: DEV_IDS.answerId2,
    explanation: 'O ECG é o primeiro exame a ser realizado em pacientes com dor torácica',
    questionId: DEV_IDS.questionId2,
  },

  // Assessment 3 - Perguntas Abertas
  assessment3: {
    id: DEV_IDS.assessmentId3,
    slug: 'perguntas-abertas-cirurgia',
    title: 'Perguntas Abertas - Cirurgia',
    description: 'Avaliação com perguntas abertas sobre cirurgia',
    type: 'PROVA_ABERTA' as const,
    passingScore: 75,
    randomizeQuestions: false,
    randomizeOptions: false,
    lessonId: DEV_IDS.lessonId3,
  },

  argument3: {
    id: DEV_IDS.argumentId3,
    title: 'Técnicas Cirúrgicas Básicas',
    assessmentId: DEV_IDS.assessmentId3,
  },

  question3: {
    id: DEV_IDS.questionId3,
    text: 'Descreva os passos principais de uma cirurgia abdominal exploratória.',
    type: 'OPEN' as const,
    assessmentId: DEV_IDS.assessmentId3,
    argumentId: DEV_IDS.argumentId3,
  },

  answer3: {
    id: DEV_IDS.answerId3,
    explanation: 'A cirurgia abdominal exploratória envolve incisão, exploração sistemática, identificação da patologia e correção',
    questionId: DEV_IDS.questionId3,
  },

  // Flashcard Tags
  flashcardTag1: {
    id: DEV_IDS.flashcardTagId1,
    name: 'Farmacologia',
    slug: 'farmacologia',
  },

  flashcardTag2: {
    id: DEV_IDS.flashcardTagId2,
    name: 'Anatomia',
    slug: 'anatomia',
  },

  flashcardTag3: {
    id: DEV_IDS.flashcardTagId3,
    name: 'Fisiologia',
    slug: 'fisiologia',
  },

  flashcardTag4: {
    id: DEV_IDS.flashcardTagId4,
    name: 'Patologia',
    slug: 'patologia',
  },

  flashcardTag5: {
    id: DEV_IDS.flashcardTagId5,
    name: 'Medicina Legal',
    slug: 'medicina-legal',
  },
};