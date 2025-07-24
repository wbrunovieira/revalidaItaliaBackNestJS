// test/e2e/answers/post-create-answer-simple.e2e.spec.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request, { Response } from 'supertest';

import { AnswerTestSetup } from './shared/answer-test-setup';
import { AnswerTestHelpers } from './shared/answer-test-helpers';

describe('CreateAnswer E2E - Simple Debug', () => {
  let testSetup: AnswerTestSetup;
  let helpers: AnswerTestHelpers;

  beforeAll(async () => {
    testSetup = new AnswerTestSetup();
    await testSetup.initialize();
    helpers = new AnswerTestHelpers(testSetup);
  });

  beforeEach(async () => {
    await testSetup.setupTestData();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  it('should create answer for open question (no correctOptionId needed)', async () => {
    // Create a unique open question for this test
    const { questionId } = await testSetup.createTestQuestionWithOptions({
      text: 'Simple test open question',
      type: 'OPEN',
      assessmentId: testSetup.provaAbertaAssessmentId,
    });

    const answerData = {
      explanation: 'Simple explanation for open question',
      questionId: questionId,
    };

    console.log('Test data:', answerData);
    console.log('Open question ID:', questionId);

    const response: Response = await request(testSetup.getHttpServer())
      .post('/answers')
      .send(answerData);

    console.log('Response status:', response.status);
    console.log('Response body:', response.body);

    if (response.status === 500) {
      console.log('500 Error details:', response.body);
    }

    expect(response.status).toBe(201);
  });

  it('should debug question setup', async () => {
    // Check if questions were created properly
    const mcQuestion = await testSetup.prisma.question.findUnique({
      where: { id: testSetup.multipleChoiceQuestionId },
      include: { assessment: true },
    });

    const openQuestion = await testSetup.prisma.question.findUnique({
      where: { id: testSetup.openQuestionId },
      include: { assessment: true },
    });

    console.log('Multiple choice question:', mcQuestion);
    console.log('Open question:', openQuestion);

    expect(mcQuestion).toBeDefined();
    expect(openQuestion).toBeDefined();
  });
}, 30000);
