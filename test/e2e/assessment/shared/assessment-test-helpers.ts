// test/e2e/assessment/shared/assessment-test-helpers.ts

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from 'supertest';

export class AssessmentTestHelpers {
  constructor(private app: INestApplication) {}

  async getQuestionsDetailed(assessmentId: string): Promise<request.Response> {
    return request(this.app.getHttpServer()).get(
      `/assessments/${assessmentId}/questions/detailed`,
    );
  }

  expectValidationError(response: any, expectedDetails?: string[]) {
    expect(response.status).toBe(400);
    expect(response.body.type).toBe('https://api.portalrevalida.com/errors/http-error');
    expect(response.body.title).toBe('Bad Request');
    expect(response.body.status).toBe(400);
    if (expectedDetails) {
      expect(response.body.detail).toContain(expectedDetails[0]);
    }
  }

  expectNotFoundError(response: any) {
    expect(response.status).toBe(404);
    expect(response.body.type).toBe('https://api.portalrevalida.com/errors/http-error');
    expect(response.body.title).toBe('Not Found');
    expect(response.body.status).toBe(404);
  }

  expectRepositoryError(response: any, expectedMessage?: string) {
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('REPOSITORY_ERROR');
    if (expectedMessage) {
      expect(response.body.message).toBe(expectedMessage);
    }
  }

  validateQuizResponse(response: any, expectedData: any) {
    expect(response.status).toBe(200);

    // Validate assessment
    expect(response.body.assessment).toBeDefined();
    expect(response.body.assessment.id).toBe(expectedData.quizId);
    expect(response.body.assessment.type).toBe('QUIZ');
    expect(response.body.assessment.passingScore).toBe(70);
    expect(response.body.assessment.randomizeQuestions).toBe(false);
    expect(response.body.assessment.randomizeOptions).toBe(false);

    // Validate lesson
    expect(response.body.lesson).toBeDefined();
    expect(response.body.lesson.id).toBe(expectedData.lessonId);
    expect(response.body.lesson.title).toBe('Aula de Teste');

    // Validate questions
    expect(response.body.questions).toHaveLength(1);
    expect(response.body.questions[0].text).toBe('What is 2+2?');
    expect(response.body.questions[0].type).toBe('MULTIPLE_CHOICE');
    expect(response.body.questions[0].options).toHaveLength(3);

    // Validate answer
    expect(response.body.questions[0].answer).toBeDefined();
    expect(response.body.questions[0].answer.correctOptionId).toBe(
      expectedData.option2Id,
    );
    expect(response.body.questions[0].answer.explanation).toBe(
      'Two plus two equals four',
    );
    expect(response.body.questions[0].answer.translations).toHaveLength(2);

    // Validate totals
    expect(response.body.totalQuestions).toBe(1);
    expect(response.body.totalQuestionsWithAnswers).toBe(1);

    // No arguments for QUIZ
    expect(response.body.arguments).toEqual([]);
  }

  validateSimuladoResponse(response: any, expectedData: any) {
    expect(response.status).toBe(200);

    // Validate assessment
    expect(response.body.assessment).toBeDefined();
    expect(response.body.assessment.id).toBe(expectedData.simuladoId);
    expect(response.body.assessment.type).toBe('SIMULADO');
    expect(response.body.assessment.passingScore).toBe(80);
    expect(response.body.assessment.timeLimitInMinutes).toBe(120);
    expect(response.body.assessment.randomizeQuestions).toBe(true);
    expect(response.body.assessment.randomizeOptions).toBe(true);

    // No lesson for SIMULADO
    expect(response.body.lesson).toBeUndefined();

    // Validate arguments
    expect(response.body.arguments).toHaveLength(1);
    expect(response.body.arguments[0].id).toBe(expectedData.argumentId);
    expect(response.body.arguments[0].title).toBe('Cardiology');
    expect(response.body.arguments[0].questions).toHaveLength(1);

    // Validate questions
    expect(response.body.questions).toHaveLength(1);
    expect(response.body.questions[0].text).toBe(
      'What is the normal heart rate?',
    );
    expect(response.body.questions[0].argumentId).toBe(expectedData.argumentId);

    // Validate answer
    expect(response.body.questions[0].answer).toBeDefined();
    expect(response.body.questions[0].answer.correctOptionId).toBe(
      expectedData.simOption2Id,
    );
  }

  validateProvaAbertaResponse(response: any, expectedData: any) {
    expect(response.status).toBe(200);

    // Validate assessment
    expect(response.body.assessment).toBeDefined();
    expect(response.body.assessment.id).toBe(expectedData.provaAbertaId);
    expect(response.body.assessment.type).toBe('PROVA_ABERTA');
    expect(response.body.assessment.passingScore).toBeUndefined();
    expect(response.body.assessment.randomizeQuestions).toBe(false);
    expect(response.body.assessment.randomizeOptions).toBe(false);

    // No lesson or arguments
    expect(response.body.lesson).toBeUndefined();
    expect(response.body.arguments).toEqual([]);

    // Validate questions
    expect(response.body.questions).toHaveLength(1);
    expect(response.body.questions[0].text).toBe(
      'Explain the cardiovascular system',
    );
    expect(response.body.questions[0].type).toBe('OPEN');
    expect(response.body.questions[0].options).toHaveLength(0);
    expect(response.body.questions[0].answer).toBeUndefined();

    // Validate totals
    expect(response.body.totalQuestions).toBe(1);
    expect(response.body.totalQuestionsWithAnswers).toBe(0);
  }

  validateEmptyAssessmentResponse(response: any, expectedData: any) {
    expect(response.status).toBe(200);

    // Validate assessment
    expect(response.body.assessment).toBeDefined();
    expect(response.body.assessment.id).toBe(expectedData.emptyAssessmentId);
    expect(response.body.assessment.type).toBe('QUIZ');

    // No questions
    expect(response.body.questions).toHaveLength(0);
    expect(response.body.totalQuestions).toBe(0);
    expect(response.body.totalQuestionsWithAnswers).toBe(0);
  }
}
