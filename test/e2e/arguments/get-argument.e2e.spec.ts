// test/e2e/arguments/get-argument.e2e.spec.ts
import request, { Response } from 'supertest';
import { ArgumentTestSetup } from './shared/argument-test-setup';
import { ArgumentTestData } from './shared/argument-test-data';
import { ArgumentTestHelpers } from './shared/argument-test-helpers';

describe('Arguments - GET (E2E)', () => {
  let testSetup: ArgumentTestSetup;
  let testHelpers: ArgumentTestHelpers;
  let createdArgumentIds: string[] = [];

  beforeAll(async () => {
    testSetup = new ArgumentTestSetup();
    await testSetup.initialize();
    testHelpers = new ArgumentTestHelpers(testSetup);
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  beforeEach(async () => {
    await testSetup.setupTestData();
    createdArgumentIds = [];
  });

  describe('[GET] /arguments/:id - Get Argument by ID', () => {
    describe('✅ Success Cases', () => {
      it('should get argument by ID successfully', async () => {
        // Create an argument first
        const createPayload = ArgumentTestData.validPayloads.minimal();
        const createRes = await testHelpers.createArgumentExpectSuccess(
          createPayload,
          'Valid argument title',
        );
        const argumentId = createRes.body.argument.id;

        // Get the argument by ID
        const res = await request(testSetup.getHttpServer())
          .get(`/arguments/${argumentId}`)
          .expect(200);

        expect(res.body).toEqual({
          success: true,
          argument: {
            id: argumentId,
            title: 'Valid argument title',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        });

        // Verify timestamps are valid ISO strings
        expect(new Date(res.body.argument.createdAt).toISOString()).toBe(
          res.body.argument.createdAt,
        );
        expect(new Date(res.body.argument.updatedAt).toISOString()).toBe(
          res.body.argument.updatedAt,
        );
      });

      it('should get argument with assessmentId successfully', async () => {
        // Create an argument with assessment
        const createPayload = ArgumentTestData.validPayloads.withAssessment(
          testSetup.assessmentId,
        );
        const createRes = await testHelpers.createArgumentExpectSuccess(
          createPayload,
          'Argument with assessment',
        );
        const argumentId = createRes.body.argument.id;

        // Get the argument by ID
        const res = await request(testSetup.getHttpServer())
          .get(`/arguments/${argumentId}`)
          .expect(200);

        expect(res.body).toEqual({
          success: true,
          argument: {
            id: argumentId,
            title: 'Argument with assessment',
            assessmentId: testSetup.assessmentId,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        });
      });

      it('should handle special characters in retrieved argument', async () => {
        // Create argument with special chars
        const createPayload = ArgumentTestData.validPayloads.specialChars();
        const createRes =
          await testHelpers.createArgumentExpectSuccess(createPayload);
        const argumentId = createRes.body.argument.id;

        // Get the argument
        const res = await request(testSetup.getHttpServer())
          .get(`/arguments/${argumentId}`)
          .expect(200);

        expect(res.body.argument.title).toBe(
          'Argument with special chars: @#$%^&*()!',
        );
      });

      it('should handle unicode characters in retrieved argument', async () => {
        // Create argument with unicode
        const createPayload = ArgumentTestData.validPayloads.unicode();
        const createRes =
          await testHelpers.createArgumentExpectSuccess(createPayload);
        const argumentId = createRes.body.argument.id;

        // Get the argument
        const res = await request(testSetup.getHttpServer())
          .get(`/arguments/${argumentId}`)
          .expect(200);

        expect(res.body.argument.title).toBe(
          'Argumento 中文 العربية русский 🎯',
        );
      });
    });

    describe('❌ Error Cases', () => {
      it('should return 404 when argument ID does not exist', async () => {
        const nonExistentId = testSetup.getNonExistentUUID();

        const res = await request(testSetup.getHttpServer())
          .get(`/arguments/${nonExistentId}`)
          .expect(404);

        expect(res.body).toHaveProperty('error', 'ARGUMENT_NOT_FOUND');
        expect(res.body).toHaveProperty('message', 'Argument not found');
      });

      it('should return 400 when ID is not a valid UUID', async () => {
        const invalidId = 'invalid-uuid-format';

        const res = await request(testSetup.getHttpServer())
          .get(`/arguments/${invalidId}`)
          .expect(400);

        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('details');
      });
    });
  });

  describe('🔍 Edge Cases', () => {
    it('should handle arguments with very long titles', async () => {
      const longTitle = 'A'.repeat(255);
      const createRes = await testHelpers.createArgumentExpectSuccess({
        title: longTitle,
      });

      const res = await request(testSetup.getHttpServer())
        .get(`/arguments/${createRes.body.argument.id}`)
        .expect(200);

      expect(res.body.argument.title).toBe(longTitle);
      expect(res.body.argument.title.length).toBe(255);
    });

    it('should correctly exclude assessmentId when null', async () => {
      // Create argument without assessment
      const createRes = await testHelpers.createArgumentExpectSuccess({
        title: 'Argument without assessment',
      });

      const res = await request(testSetup.getHttpServer())
        .get(`/arguments/${createRes.body.argument.id}`)
        .expect(200);

      expect(res.body.argument).not.toHaveProperty('assessmentId');
      expect(res.body.argument.assessmentId).toBeUndefined();
    });
  });

  describe('⚡ Performance', () => {
    it('should handle concurrent GET requests for same argument', async () => {
      // Create an argument
      const createRes = await testHelpers.createArgumentExpectSuccess({
        title: 'Concurrent Test Argument',
      });
      const argumentId = createRes.body.argument.id;

      // Make concurrent requests for the same argument
      const requests: Promise<Response>[] = Array(10)
        .fill(null)
        .map(() =>
          request(testSetup.getHttpServer()).get(`/arguments/${argumentId}`),
        );

      const responses = await Promise.all(requests);

      // All should succeed with same data
      responses.forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.body.argument.id).toBe(argumentId);
        expect(res.body.argument.title).toBe('Concurrent Test Argument');
      });
    });
  });

  describe('🔧 Response Format Validation', () => {
    it('should not include undefined fields in get by ID response', async () => {
      // Create argument without assessmentId
      const createRes = await testHelpers.createArgumentExpectSuccess({
        title: 'Without Assessment',
      });

      const res = await request(testSetup.getHttpServer())
        .get(`/arguments/${createRes.body.argument.id}`)
        .expect(200);

      // Verify no undefined fields
      testHelpers.verifyNoUndefinedFields(res.body.argument, ['assessmentId']);
    });

    it('should return consistent date formats', async () => {
      const createRes = await testHelpers.createArgumentExpectSuccess({
        title: 'Date Format Test',
      });

      await testHelpers.waitForDatabase(100);

      const res = await request(testSetup.getHttpServer())
        .get(`/arguments/${createRes.body.argument.id}`)
        .expect(200);

      // Verify ISO 8601 format
      const createdAt = new Date(res.body.argument.createdAt);
      const updatedAt = new Date(res.body.argument.updatedAt);

      expect(createdAt.toISOString()).toBe(res.body.argument.createdAt);
      expect(updatedAt.toISOString()).toBe(res.body.argument.updatedAt);
    });
  });
});
