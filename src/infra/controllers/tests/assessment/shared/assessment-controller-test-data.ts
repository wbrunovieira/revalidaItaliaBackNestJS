// src/infra/controllers/tests/assessment/shared/assessment-controller-test-data.ts

import { GetQuestionsDetailedResponse } from '@/domain/assessment/application/dtos/get-questions-detailed-response.dto';

export class AssessmentControllerTestData {
  static createQuestionsDetailedResponse(): GetQuestionsDetailedResponse {
    return {
      assessment: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'test-quiz',
        title: 'Test Quiz',
        description: 'A test quiz for unit testing',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        timeLimitInMinutes: undefined,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: '456e7890-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      lesson: {
        id: '456e7890-e89b-12d3-a456-426614174000',
        slug: 'test-lesson',
        title: 'Test Lesson',
        order: 1,
        moduleId: 'module-123',
      },
      arguments: [],
      questions: [
        {
          id: '789e0123-e89b-12d3-a456-426614174000',
          text: 'What is 2+2?',
          type: 'MULTIPLE_CHOICE',
          argumentId: undefined,
          options: [
            {
              id: 'opt1-0123-e89b-12d3-a456-426614174000',
              text: '3',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
            {
              id: 'opt2-0123-e89b-12d3-a456-426614174000',
              text: '4',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
            {
              id: 'opt3-0123-e89b-12d3-a456-426614174000',
              text: '5',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
          ],
          answer: {
            id: 'ans1-0123-e89b-12d3-a456-426614174000',
            correctOptionId: 'opt2-0123-e89b-12d3-a456-426614174000',
            explanation: 'Two plus two equals four',
            translations: [
              {
                locale: 'pt',
                explanation: 'Dois mais dois é igual a quatro',
              },
              {
                locale: 'it',
                explanation: 'Due più due fa quattro',
              },
            ],
          },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
      totalQuestions: 1,
      totalQuestionsWithAnswers: 1,
    };
  }

  static createSimuladoDetailedResponse(): GetQuestionsDetailedResponse {
    return {
      assessment: {
        id: '123e4567-e89b-12d3-a456-426614174001',
        slug: 'test-simulado',
        title: 'Test Simulado',
        description: 'A comprehensive medical exam simulation',
        type: 'SIMULADO',
        quizPosition: undefined,
        passingScore: 80,
        timeLimitInMinutes: 120,
        randomizeQuestions: true,
        randomizeOptions: true,
        lessonId: undefined,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      lesson: undefined,
      arguments: [
        {
          id: 'arg1-0123-e89b-12d3-a456-426614174000',
          title: 'Cardiology',
          description: undefined,
          assessmentId: '123e4567-e89b-12d3-a456-426614174001',
          questions: [
            {
              id: '789e0124-e89b-12d3-a456-426614174000',
              text: 'What is the normal heart rate?',
              type: 'MULTIPLE_CHOICE',
              argumentId: 'arg1-0123-e89b-12d3-a456-426614174000',
              options: [
                {
                  id: 'opt4-0123-e89b-12d3-a456-426614174000',
                  text: '40-60 bpm',
                  createdAt: new Date('2024-01-01'),
                  updatedAt: new Date('2024-01-01'),
                },
                {
                  id: 'opt5-0123-e89b-12d3-a456-426614174000',
                  text: '60-100 bpm',
                  createdAt: new Date('2024-01-01'),
                  updatedAt: new Date('2024-01-01'),
                },
                {
                  id: 'opt6-0123-e89b-12d3-a456-426614174000',
                  text: '100-120 bpm',
                  createdAt: new Date('2024-01-01'),
                  updatedAt: new Date('2024-01-01'),
                },
              ],
              answer: {
                id: 'ans2-0123-e89b-12d3-a456-426614174000',
                correctOptionId: 'opt5-0123-e89b-12d3-a456-426614174000',
                explanation: 'Normal adult resting heart rate is 60-100 bpm',
                translations: [
                  {
                    locale: 'pt',
                    explanation: 'A frequência cardíaca normal de repouso em adultos é 60-100 bpm',
                  },
                  {
                    locale: 'it',
                    explanation: 'La frequenza cardiaca normale a riposo negli adulti è 60-100 bpm',
                  },
                ],
              },
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
          ],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
      questions: [
        {
          id: '789e0124-e89b-12d3-a456-426614174000',
          text: 'What is the normal heart rate?',
          type: 'MULTIPLE_CHOICE',
          argumentId: 'arg1-0123-e89b-12d3-a456-426614174000',
          options: [
            {
              id: 'opt4-0123-e89b-12d3-a456-426614174000',
              text: '40-60 bpm',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
            {
              id: 'opt5-0123-e89b-12d3-a456-426614174000',
              text: '60-100 bpm',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
            {
              id: 'opt6-0123-e89b-12d3-a456-426614174000',
              text: '100-120 bpm',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
          ],
          answer: {
            id: 'ans2-0123-e89b-12d3-a456-426614174000',
            correctOptionId: 'opt5-0123-e89b-12d3-a456-426614174000',
            explanation: 'Normal adult resting heart rate is 60-100 bpm',
            translations: [
              {
                locale: 'pt',
                explanation: 'A frequência cardíaca normal de repouso em adultos é 60-100 bpm',
              },
              {
                locale: 'it',
                explanation: 'La frequenza cardiaca normale a riposo negli adulti è 60-100 bpm',
              },
            ],
          },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
      totalQuestions: 1,
      totalQuestionsWithAnswers: 1,
    };
  }

  static createProvaAbertaDetailedResponse(): GetQuestionsDetailedResponse {
    return {
      assessment: {
        id: '123e4567-e89b-12d3-a456-426614174002',
        slug: 'test-prova-aberta',
        title: 'Test Prova Aberta',
        description: 'An open-ended exam',
        type: 'PROVA_ABERTA',
        quizPosition: undefined,
        passingScore: undefined,
        timeLimitInMinutes: undefined,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: undefined,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      lesson: undefined,
      arguments: [],
      questions: [
        {
          id: '789e0125-e89b-12d3-a456-426614174000',
          text: 'Explain the cardiovascular system',
          type: 'OPEN',
          argumentId: undefined,
          options: [],
          answer: undefined,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
      totalQuestions: 1,
      totalQuestionsWithAnswers: 0,
    };
  }

  static createEmptyAssessmentResponse(): GetQuestionsDetailedResponse {
    return {
      assessment: {
        id: '123e4567-e89b-12d3-a456-426614174003',
        slug: 'empty-assessment',
        title: 'Empty Assessment',
        description: 'An assessment with no questions',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 70,
        timeLimitInMinutes: undefined,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: undefined,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      lesson: undefined,
      arguments: [],
      questions: [],
      totalQuestions: 0,
      totalQuestionsWithAnswers: 0,
    };
  }
}