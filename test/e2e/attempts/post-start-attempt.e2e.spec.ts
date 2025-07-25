// test/e2e/attempts/post-start-attempt.e2e.spec.ts
import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import { AttemptTestSetup } from './shared/attempt-test-setup';
import { AttemptTestHelpers } from './shared/attempt-test-helpers';
import { AttemptTestData } from './shared/attempt-test-data';

describe('[E2E] POST /attempts/start - Start Attempt', () => {
  let testSetup: AttemptTestSetup;
  let testHelpers: AttemptTestHelpers;
  let studentToken: string;
  let tutorToken: string;

  beforeAll(async () => {
    testSetup = new AttemptTestSetup();
    await testSetup.initialize();
    testHelpers = new AttemptTestHelpers(testSetup);
  });

  beforeEach(async () => {
    // Setup fresh test data for each test to ensure isolation
    await testSetup.setupTestData();

    // Generate tokens for common users
    const tutorUser = await testSetup.findUserById(testSetup.tutorUserId);
    const studentUser = await testSetup.findUserById(testSetup.studentUserId);
    tutorToken = testSetup.generateJwtToken(tutorUser);
    studentToken = testSetup.generateJwtToken(studentUser);
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  describe('Success Cases', () => {
    it('should start a quiz attempt successfully for student', async () => {
      const requestData = AttemptTestData.validRequests.studentQuiz(
        testSetup.studentUserId,
        testSetup.quizAssessmentId,
      );

      const response = await testHelpers.startAttemptExpectSuccess(
        requestData,
        studentToken,
      );

      // Verify response format
      testHelpers.verifyStartAttemptSuccessResponseFormat(
        response.body,
        testSetup.studentUserId,
        testSetup.quizAssessmentId,
      );

      // Verify data integrity between API and database
      await testHelpers.verifyAttemptDataIntegrity(
        response.body,
        testSetup.studentUserId,
        testSetup.quizAssessmentId,
      );

      // Verify database state
      await testHelpers.verifyDatabaseState(1);
    });

    it('should start a simulado attempt with time limit for student', async () => {
      const requestData = AttemptTestData.validRequests.studentSimulado(
        testSetup.studentUserId,
        testSetup.simuladoAssessmentId,
      );

      const response = await testHelpers.startAttemptExpectSuccess(
        requestData,
        studentToken,
      );

      // Verify response includes time limit
      testHelpers.verifyStartAttemptResponseWithTimeLimit(
        response.body,
        testSetup.studentUserId,
        testSetup.simuladoAssessmentId,
      );

      // Verify attempt in database
      await testHelpers.verifyAttemptCreatedInDatabase(
        response.body.attempt.id,
        testSetup.studentUserId,
        testSetup.simuladoAssessmentId,
      );
    });

    it('should start a prova aberta attempt for student', async () => {
      const requestData = AttemptTestData.validRequests.studentProvaAberta(
        testSetup.studentUserId,
        testSetup.provaAbertaAssessmentId,
      );

      const response = await testHelpers.startAttemptExpectSuccess(
        requestData,
        studentToken,
      );

      testHelpers.verifyStartAttemptSuccessResponseFormat(
        response.body,
        testSetup.studentUserId,
        testSetup.provaAbertaAssessmentId,
      );

      await testHelpers.verifyDatabaseState(1);
    });

    it('should start a quiz attempt for tutor', async () => {
      const requestData = AttemptTestData.validRequests.tutorQuiz(
        testSetup.tutorUserId,
        testSetup.quizAssessmentId,
      );

      const response = await testHelpers.startAttemptExpectSuccess(
        requestData,
        tutorToken,
      );

      testHelpers.verifyStartAttemptSuccessResponseFormat(
        response.body,
        testSetup.tutorUserId,
        testSetup.quizAssessmentId,
      );
    });
  });

  describe('Validation Error Cases', () => {
    const validationErrorCases = [
      {
        name: 'invalid user ID',
        testFn: () => AttemptTestData.invalidRequests.invalidIdentityId(),
      },
      {
        name: 'invalid assessment ID',
        testFn: () => AttemptTestData.invalidRequests.invalidAssessmentId(),
      },
      {
        name: 'both invalid IDs',
        testFn: () => AttemptTestData.invalidRequests.bothInvalid(),
      },
      {
        name: 'empty user ID',
        testFn: () => AttemptTestData.invalidRequests.emptyIdentityId(),
      },
      {
        name: 'empty assessment ID',
        testFn: () => AttemptTestData.invalidRequests.emptyAssessmentId(),
      },
      {
        name: 'missing user ID',
        testFn: () => AttemptTestData.invalidRequests.missingIdentityId(),
      },
      {
        name: 'missing assessment ID',
        testFn: () => AttemptTestData.invalidRequests.missingAssessmentId(),
      },
      {
        name: 'null user ID',
        testFn: () => AttemptTestData.invalidRequests.nullIdentityId(),
      },
      {
        name: 'null assessment ID',
        testFn: () => AttemptTestData.invalidRequests.nullAssessmentId(),
      },
      {
        name: 'undefined user ID',
        testFn: () => AttemptTestData.invalidRequests.undefinedIdentityId(),
      },
      {
        name: 'undefined assessment ID',
        testFn: () => AttemptTestData.invalidRequests.undefinedAssessmentId(),
      },
      {
        name: 'number user ID',
        testFn: () => AttemptTestData.invalidRequests.numberIdentityId(),
      },
      {
        name: 'number assessment ID',
        testFn: () => AttemptTestData.invalidRequests.numberAssessmentId(),
      },
      {
        name: 'boolean user ID',
        testFn: () => AttemptTestData.invalidRequests.booleanIdentityId(),
      },
      {
        name: 'boolean assessment ID',
        testFn: () => AttemptTestData.invalidRequests.booleanAssessmentId(),
      },
      {
        name: 'object user ID',
        testFn: () => AttemptTestData.invalidRequests.objectIdentityId(),
      },
      {
        name: 'object assessment ID',
        testFn: () => AttemptTestData.invalidRequests.objectAssessmentId(),
      },
      {
        name: 'array user ID',
        testFn: () => AttemptTestData.invalidRequests.arrayIdentityId(),
      },
      {
        name: 'array assessment ID',
        testFn: () => AttemptTestData.invalidRequests.arrayAssessmentId(),
      },
      {
        name: 'UUID with spaces',
        testFn: () => AttemptTestData.invalidRequests.uuidWithSpaces(),
      },
      {
        name: 'UUID with tabs',
        testFn: () => AttemptTestData.invalidRequests.uuidWithTabs(),
      },
      {
        name: 'UUID with newlines',
        testFn: () => AttemptTestData.invalidRequests.uuidWithNewlines(),
      },
      {
        name: 'too short UUID',
        testFn: () => AttemptTestData.invalidRequests.tooShortUuid(),
      },
      {
        name: 'too long UUID',
        testFn: () => AttemptTestData.invalidRequests.tooLongUuid(),
      },
      {
        name: 'wrong hyphens in UUID',
        testFn: () => AttemptTestData.invalidRequests.wrongHyphens(),
      },
      {
        name: 'missing hyphens in UUID',
        testFn: () => AttemptTestData.invalidRequests.missingHyphens(),
      },
      {
        name: 'special characters in UUID',
        testFn: () => AttemptTestData.invalidRequests.specialChars(),
      },
      {
        name: 'invalid hex characters',
        testFn: () => AttemptTestData.invalidRequests.invalidHexChars(),
      },
      {
        name: 'unicode characters',
        testFn: () => AttemptTestData.invalidRequests.unicodeChars(),
      },
      {
        name: 'emojis in UUID',
        testFn: () => AttemptTestData.invalidRequests.emojis(),
      },
    ];

    validationErrorCases.forEach(({ name, testFn }) => {
      it(`should return 400 for ${name}`, async () => {
        const invalidData = testFn();

        const response = await testHelpers.startAttemptExpectValidationError(
          invalidData,
          tutorToken,
        );

        testHelpers.verifyValidationErrorResponseFormat(response.body);

        // Verify no attempt was created in database
        await testHelpers.verifyDatabaseState(0);
      });
    });
  });

  describe('Not Found Error Cases', () => {
    it('should return 404 for non-existent user', async () => {
      const requestData = AttemptTestData.nonExistentRequests.nonExistentUser(
        testSetup.quizAssessmentId,
      );

      await testHelpers.startAttemptExpectNotFound(
        requestData,
        'USER_NOT_FOUND',
        studentToken,
      );

      await testHelpers.verifyDatabaseState(0);
    });

    it('should return 404 for non-existent assessment', async () => {
      const requestData =
        AttemptTestData.nonExistentRequests.nonExistentAssessment(
          testSetup.studentUserId,
        );

      await testHelpers.startAttemptExpectNotFound(
        requestData,
        'ASSESSMENT_NOT_FOUND',
        studentToken,
      );

      await testHelpers.verifyDatabaseState(0);
    });

    it('should return 404 for both non-existent user and assessment', async () => {
      const requestData = AttemptTestData.nonExistentRequests.bothNonExistent();

      // Should return USER_NOT_FOUND first (checked first in use case)
      await testHelpers.startAttemptExpectNotFound(
        requestData,
        'USER_NOT_FOUND',
        studentToken,
      );

      await testHelpers.verifyDatabaseState(0);
    });

    it('should return 404 for random user UUID', async () => {
      const requestData = AttemptTestData.nonExistentRequests.randomUser(
        testSetup.quizAssessmentId,
      );

      await testHelpers.startAttemptExpectNotFound(
        requestData,
        'USER_NOT_FOUND',
        studentToken,
      );
    });

    it('should return 404 for random assessment UUID', async () => {
      const requestData = AttemptTestData.nonExistentRequests.randomAssessment(
        testSetup.studentUserId,
      );

      await testHelpers.startAttemptExpectNotFound(
        requestData,
        'ASSESSMENT_NOT_FOUND',
        studentToken,
      );
    });
  });

  describe('Conflict Error Cases', () => {
    it('should return 409 when user already has active attempt for quiz', async () => {
      const requestData = AttemptTestData.validRequests.studentQuiz(
        testSetup.studentUserId,
        testSetup.quizAssessmentId,
      );

      // Create first attempt successfully
      await testHelpers.startAttemptExpectSuccess(requestData, studentToken);

      // Try to create second attempt - should fail
      await testHelpers.startAttemptExpectConflict(requestData, studentToken);

      // Verify only one attempt exists
      await testHelpers.verifyDatabaseState(1);
    });

    it('should return 409 when user already has active attempt for simulado', async () => {
      const requestData = AttemptTestData.validRequests.studentSimulado(
        testSetup.studentUserId,
        testSetup.simuladoAssessmentId,
      );

      // Create first attempt
      await testHelpers.startAttemptExpectSuccess(requestData, studentToken);

      // Try to create second attempt
      await testHelpers.startAttemptExpectConflict(requestData, studentToken);

      await testHelpers.verifyDatabaseState(1);
    });

    it('should return 409 when tutor already has active attempt', async () => {
      const requestData = AttemptTestData.validRequests.tutorQuiz(
        testSetup.tutorUserId,
        testSetup.quizAssessmentId,
      );

      // Create first attempt
      await testHelpers.startAttemptExpectSuccess(requestData, tutorToken);

      // Try to create second attempt
      await testHelpers.startAttemptExpectConflict(requestData, tutorToken);

      await testHelpers.verifyDatabaseState(1);
    });
  });

  describe('Performance Tests', () => {
    it('should complete start attempt request within time limit', async () => {
      const requestData = testHelpers.createValidStartAttemptRequest();
      const { maxExecutionTime } =
        AttemptTestData.performanceTests.singleRequest;

      await testHelpers.testStartAttemptPerformance(
        'Single start attempt request',
        requestData,
        maxExecutionTime,
        studentToken,
      );
    });

    it('should handle concurrent start attempt requests efficiently', async () => {
      const { requestCount, maxExecutionTime } =
        AttemptTestData.performanceTests.concurrentRequests;

      // Create different request data for each concurrent request to avoid conflicts
      const requests = Array.from({ length: requestCount }, (_, index) => ({
        identityId: testSetup.studentUserId,
        assessmentId:
          index % 2 === 0
            ? testSetup.quizAssessmentId
            : testSetup.simuladoAssessmentId,
      }));

      const startTime = Date.now();

      // Since we can't have multiple active attempts per user-assessment pair,
      // we'll test with different assessment types alternating
      const promises = requests.map(async (request, index) => {
        // Wait a small amount to avoid exact timing conflicts
        await testHelpers.waitForDatabase(index * 10);
        try {
          const result = await testHelpers.startAttempt(
            request.identityId,
            request.assessmentId,
            'test-jwt-token',
          );
          return { status: 201, body: result };
        } catch (error) {
          // Handle expected conflicts (409) and other errors
          return { status: 409, error };
        }
      });

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      console.log(
        `Concurrent requests test: ${executionTime}ms (max: ${maxExecutionTime}ms)`,
      );
      expect(executionTime).toBeLessThan(maxExecutionTime);

      // Verify at least some requests succeeded
      const successfulResponses = responses.filter((res) => res.status === 201);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });

    it('should handle sequential start attempt requests efficiently', async () => {
      const { requestCount, maxExecutionTime } =
        AttemptTestData.performanceTests.sequentialRequests;

      const startTime = Date.now();

      for (let i = 0; i < requestCount; i++) {
        // Use different assessment types to avoid conflicts
        const assessmentId =
          i % 3 === 0
            ? testSetup.quizAssessmentId
            : i % 3 === 1
              ? testSetup.simuladoAssessmentId
              : testSetup.provaAbertaAssessmentId;

        const requestData = testHelpers.createValidStartAttemptRequest(
          testSetup.studentUserId,
          assessmentId,
        );

        await testHelpers.startAttempt(
          requestData.identityId,
          requestData.assessmentId,
          'test-jwt-token',
        );

        // Clean up between requests to allow new attempts
        await testSetup.cleanupDatabase();
        await testSetup.setupTestData();
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      console.log(
        `Sequential requests test: ${executionTime}ms (max: ${maxExecutionTime}ms)`,
      );
      expect(executionTime).toBeLessThan(maxExecutionTime);
    });
  });

  describe('Edge Cases', () => {
    it('should handle requests with exact UUID boundaries', async () => {
      // Test with valid UUID v4 formats that don't exist
      const minUuid = '10000000-0000-4000-8000-000000000001';
      const maxUuid = 'ffffffff-ffff-4fff-bfff-ffffffffffff';

      const requestData = {
        identityId: minUuid,
        assessmentId: maxUuid,
      };

      await testHelpers.startAttemptExpectNotFound(
        requestData,
        'USER_NOT_FOUND',
        studentToken,
      );
    });

    it('should handle mixed case UUIDs correctly', async () => {
      // PostgreSQL/Prisma appears to be case-sensitive for UUID lookups
      const requestData = {
        identityId: testSetup.studentUserId.toUpperCase(),
        assessmentId: testSetup.quizAssessmentId.toLowerCase(),
      };

      // Since UUIDs are case-sensitive in this implementation, expect USER_NOT_FOUND
      await testHelpers.startAttemptExpectNotFound(
        requestData,
        'USER_NOT_FOUND',
        studentToken,
      );
    });

    it('should handle exactly valid UUID v4 format', async () => {
      // Test with properly formatted UUID v4 (version 4, variant 10)
      const validV4Uuid = '550e8400-e29b-41d4-a716-446655440000';

      const requestData = testHelpers.createValidStartAttemptRequest(
        validV4Uuid,
        testSetup.quizAssessmentId,
      );

      // Should return USER_NOT_FOUND since we're using a non-existent but valid UUID
      await testHelpers.startAttemptExpectNotFound(
        requestData,
        'USER_NOT_FOUND',
        studentToken,
      );
    });

    it('should handle rapid successive requests with cleanup', async () => {
      const requestData = testHelpers.createValidStartAttemptRequest();

      // Start attempt
      const response1 = await testHelpers.startAttemptExpectSuccess(
        requestData,
        studentToken,
      );

      // Wait briefly
      await testHelpers.waitForDatabase(50);

      // Try again (should conflict)
      await testHelpers.startAttemptExpectConflict(requestData, studentToken);

      // Verify data integrity of first attempt
      await testHelpers.verifyAttemptDataIntegrity(
        response1.body,
        testSetup.studentUserId,
        testSetup.quizAssessmentId,
      );
    });

    it('should maintain data consistency under stress', async () => {
      const requestData = testHelpers.createValidStartAttemptRequest();

      // Perform multiple operations rapidly
      const response = await testHelpers.startAttemptExpectSuccess(
        requestData,
        studentToken,
      );

      // Verify attempt exists
      const attemptId = response.body.attempt.id;
      const dbAttempt = await testSetup.findAttemptById(attemptId);
      expect(dbAttempt).toBeDefined();

      // Verify user and assessment still exist
      const user = await testSetup.findUserById(testSetup.studentUserId);
      const assessment = await testSetup.findAssessmentById(
        testSetup.quizAssessmentId,
      );

      expect(user).toBeDefined();
      expect(assessment).toBeDefined();
    });
  });

  describe('Response Format Validation', () => {
    it('should return properly formatted success response for quiz', async () => {
      const requestData = testHelpers.createValidStartAttemptRequest(
        testSetup.studentUserId,
        testSetup.quizAssessmentId,
      );

      const response = await testHelpers.startAttemptExpectSuccess(
        requestData,
        studentToken,
      );

      // Verify exact response structure matches expected
      expect(response.body).toMatchObject(
        AttemptTestData.expectedSuccessResponse,
      );
    });

    it('should return properly formatted success response with time limit for simulado', async () => {
      const requestData = testHelpers.createValidStartAttemptRequest(
        testSetup.studentUserId,
        testSetup.simuladoAssessmentId,
      );

      const response = await testHelpers.startAttemptExpectSuccess(
        requestData,
        studentToken,
      );

      // Verify response includes time limit
      expect(response.body).toMatchObject(
        AttemptTestData.expectedSuccessResponseWithTimeLimit,
      );
    });

    it('should return properly formatted error responses', async () => {
      // Test invalid input error
      const invalidRequest = AttemptTestData.invalidRequests.invalidIdentityId();
      const invalidResponse =
        await testHelpers.startAttemptExpectValidationError(
          invalidRequest,
          studentToken,
        );
      expect(invalidResponse.body).toMatchObject(
        AttemptTestData.expectedErrorResponses.invalidInput,
      );

      // Test user not found error
      const userNotFoundRequest =
        AttemptTestData.nonExistentRequests.nonExistentUser(
          testSetup.quizAssessmentId,
        );
      const userNotFoundResponse = await testHelpers.startAttemptExpectNotFound(
        userNotFoundRequest,
        'USER_NOT_FOUND',
        studentToken,
      );
      expect(userNotFoundResponse.body).toMatchObject(
        AttemptTestData.expectedErrorResponses.userNotFound,
      );

      // Test assessment not found error
      const assessmentNotFoundRequest =
        AttemptTestData.nonExistentRequests.nonExistentAssessment(
          testSetup.studentUserId,
        );
      const assessmentNotFoundResponse =
        await testHelpers.startAttemptExpectNotFound(
          assessmentNotFoundRequest,
          'ASSESSMENT_NOT_FOUND',
          studentToken,
        );
      expect(assessmentNotFoundResponse.body).toMatchObject(
        AttemptTestData.expectedErrorResponses.assessmentNotFound,
      );

      // Test returning existing attempt (no longer a conflict error)
      const conflictRequest = testHelpers.createValidStartAttemptRequest();
      const firstResponse = await testHelpers.startAttemptExpectSuccess(
        conflictRequest,
        studentToken,
      );
      expect(firstResponse.body.isNew).toBe(true);

      const secondResponse = await testHelpers.startAttemptExpectConflict(
        conflictRequest,
        studentToken,
      );
      expect(secondResponse.body.isNew).toBe(false);
      expect(secondResponse.body.attempt.id).toBe(
        firstResponse.body.attempt.id,
      );
    });
  });
});
