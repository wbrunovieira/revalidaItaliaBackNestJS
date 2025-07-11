// test/e2e/arguments/list-arguments.e2e.spec.ts
import request, { Response } from 'supertest';
import { ArgumentTestSetup } from './shared/argument-test-setup';
import { ArgumentTestData } from './shared/argument-test-data';
import { ArgumentTestHelpers } from './shared/argument-test-helpers';

describe('Arguments - LIST (E2E)', () => {
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

  describe('[GET] /arguments - List Arguments', () => {
    describe('✅ Success Cases', () => {
      // Note: Pagination object includes: page, limit, total, totalPages, hasNext, hasPrevious

      it('should return empty list when no arguments exist', async () => {
        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .expect(200);

        expect(res.body).toEqual({
          success: true,
          arguments: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          },
        });
      });

      it('should list arguments with default pagination', async () => {
        // Create 5 arguments
        const titles = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
        for (const title of titles) {
          await testHelpers.createArgumentExpectSuccess({ title });
        }

        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.arguments).toHaveLength(5);
        expect(res.body.pagination).toEqual({
          page: 1,
          limit: 10,
          total: 5,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        });

        // Verify all arguments are returned with correct structure
        res.body.arguments.forEach((arg: any) => {
          expect(arg).toHaveProperty('id');
          expect(arg).toHaveProperty('title');
          expect(arg).toHaveProperty('createdAt');
          expect(arg).toHaveProperty('updatedAt');
          expect(titles).toContain(arg.title);
        });
      });

      it('should paginate results correctly', async () => {
        // Create 15 arguments
        for (let i = 1; i <= 15; i++) {
          await testHelpers.createArgumentExpectSuccess({
            title: `Argument ${i.toString().padStart(2, '0')}`,
          });
        }

        // Get first page with limit 5
        const page1 = await request(testSetup.getHttpServer())
          .get('/arguments')
          .query({ page: 1, limit: 5 })
          .expect(200);

        expect(page1.body.arguments).toHaveLength(5);
        expect(page1.body.pagination).toEqual({
          page: 1,
          limit: 5,
          total: 15,
          totalPages: 3,
          hasNext: true,
          hasPrevious: false,
        });

        // Get second page
        const page2 = await request(testSetup.getHttpServer())
          .get('/arguments')
          .query({ page: 2, limit: 5 })
          .expect(200);

        expect(page2.body.arguments).toHaveLength(5);
        expect(page2.body.pagination.page).toBe(2);

        // Get third page
        const page3 = await request(testSetup.getHttpServer())
          .get('/arguments')
          .query({ page: 3, limit: 5 })
          .expect(200);

        expect(page3.body.arguments).toHaveLength(5);
        expect(page3.body.pagination.page).toBe(3);

        // Verify no duplicate arguments across pages
        const allIds = [
          ...page1.body.arguments.map((a: any) => a.id),
          ...page2.body.arguments.map((a: any) => a.id),
          ...page3.body.arguments.map((a: any) => a.id),
        ];
        const uniqueIds = new Set(allIds);
        expect(uniqueIds.size).toBe(15);
      });

      it('should filter by assessmentId successfully', async () => {
        // Create another assessment
        const otherAssessmentId = await testSetup.createTestAssessment({
          title: 'Other Assessment',
        });

        // Create arguments for different assessments
        await testHelpers.createArgumentExpectSuccess({
          title: 'Arg for main assessment',
          assessmentId: testSetup.assessmentId,
        });
        await testHelpers.createArgumentExpectSuccess({
          title: 'Another for main',
          assessmentId: testSetup.assessmentId,
        });
        await testHelpers.createArgumentExpectSuccess({
          title: 'Arg for other assessment',
          assessmentId: otherAssessmentId,
        });
        await testHelpers.createArgumentExpectSuccess({
          title: 'Arg without assessment',
        });

        // Filter by main assessment
        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .query({ assessmentId: testSetup.assessmentId })
          .expect(200);

        expect(res.body.arguments).toHaveLength(2);
        expect(res.body.pagination.total).toBe(2);
        expect(res.body.pagination.hasNext).toBe(false);
        expect(res.body.pagination.hasPrevious).toBe(false);
        res.body.arguments.forEach((arg: any) => {
          expect(arg.assessmentId).toBe(testSetup.assessmentId);
        });
      });

      it('should return arguments ordered by createdAt (most recent first)', async () => {
        // Create arguments with delays to ensure different timestamps
        const arg1 = await testHelpers.createArgumentExpectSuccess({
          title: 'First created',
        });
        await testHelpers.waitForDatabase(100);

        const arg2 = await testHelpers.createArgumentExpectSuccess({
          title: 'Second created',
        });
        await testHelpers.waitForDatabase(100);

        const arg3 = await testHelpers.createArgumentExpectSuccess({
          title: 'Third created',
        });

        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .expect(200);

        // Should be ordered most recent first
        expect(res.body.arguments[0].title).toBe('Third created');
        expect(res.body.arguments[1].title).toBe('Second created');
        expect(res.body.arguments[2].title).toBe('First created');
      });

      it('should handle large limit values', async () => {
        // Create 5 arguments
        for (let i = 1; i <= 5; i++) {
          await testHelpers.createArgumentExpectSuccess({
            title: `Argument ${i}`,
          });
        }

        // Note: API has a maximum limit validation (e.g., 1000 returns 400)
        // Using 100 as a reasonable large value
        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .query({ limit: 100 })
          .expect(200);

        expect(res.body.arguments).toHaveLength(5);
        expect(res.body.pagination.limit).toBe(100);
        expect(res.body.pagination.totalPages).toBe(1);
        expect(res.body.pagination.hasNext).toBe(false);
        expect(res.body.pagination.hasPrevious).toBe(false);
      });

      it('should handle page beyond total pages', async () => {
        // Create 3 arguments
        for (let i = 1; i <= 3; i++) {
          await testHelpers.createArgumentExpectSuccess({
            title: `Argument ${i}`,
          });
        }

        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .query({ page: 10, limit: 5 })
          .expect(200);

        expect(res.body.arguments).toHaveLength(0);
        expect(res.body.pagination).toEqual({
          page: 10,
          limit: 5,
          total: 3,
          totalPages: 1,
          hasNext: false,
          hasPrevious: true,
        });
      });
    });

    describe('❌ Error Cases', () => {
      it('should return 400 for invalid page parameter', async () => {
        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .query({ page: 'invalid' })
          .expect(400);

        expect(res.body).toHaveProperty('statusCode', 400);
        expect(res.body).toHaveProperty('message');
      });

      it('should return 400 for invalid limit parameter', async () => {
        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .query({ limit: 'abc' })
          .expect(400);

        expect(res.body).toHaveProperty('statusCode', 400);
        expect(res.body).toHaveProperty('message');
      });

      it('should return 400 for negative page', async () => {
        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .query({ page: -1 })
          .expect(400);

        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
      });

      it('should return 400 for negative limit', async () => {
        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .query({ limit: -10 })
          .expect(400);

        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
      });

      it('should return 400 for zero limit', async () => {
        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .query({ limit: 0 })
          .expect(400);

        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
      });

      it('should return 400 for limit exceeding maximum allowed', async () => {
        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .query({ limit: 1000 })
          .expect(400);

        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
      });

      it('should return 404 for non-existent assessmentId filter', async () => {
        const nonExistentId = testSetup.getNonExistentUUID();

        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .query({ assessmentId: nonExistentId })
          .expect(404);

        expect(res.body).toHaveProperty('error', 'ASSESSMENT_NOT_FOUND');
        expect(res.body).toHaveProperty('message', 'Assessment not found');
      });

      it('should return 400 for invalid assessmentId format', async () => {
        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .query({ assessmentId: 'invalid-uuid' })
          .expect(400);

        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
      });
    });

    describe('🔍 Edge Cases', () => {
      it('should handle special characters in argument titles', async () => {
        const specialPayloads = [
          ArgumentTestData.validPayloads.specialChars(),
          ArgumentTestData.validPayloads.unicode(),
          ArgumentTestData.validPayloads.emoji(),
        ];

        for (const payload of specialPayloads) {
          await testHelpers.createArgumentExpectSuccess(payload);
        }

        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .expect(200);

        expect(res.body.arguments).toHaveLength(3);

        const titles = res.body.arguments.map((a: any) => a.title);
        expect(titles).toContain('Argument with special chars: @#$%^&*()!');
        expect(titles).toContain('Argumento 中文 العربية русский 🎯');
        expect(titles).toContain('Argument with emoji 💡 and more 🚀');
      });

      it('should handle maximum integer values for pagination', async () => {
        await testHelpers.createArgumentExpectSuccess({ title: 'Test' });

        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .query({ page: Number.MAX_SAFE_INTEGER, limit: 10 })
          .expect(200);

        expect(res.body.arguments).toHaveLength(0);
        expect(res.body.pagination.page).toBe(Number.MAX_SAFE_INTEGER);
        expect(res.body.pagination.hasNext).toBe(false);
        expect(res.body.pagination.hasPrevious).toBe(true);
      });

      it('should exclude assessmentId when null in list response', async () => {
        await testHelpers.createArgumentExpectSuccess({
          title: 'Without assessment',
        });
        await testHelpers.createArgumentExpectSuccess({
          title: 'With assessment',
          assessmentId: testSetup.assessmentId,
        });

        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .expect(200);

        const withoutAssessment = res.body.arguments.find(
          (a: any) => a.title === 'Without assessment',
        );
        const withAssessment = res.body.arguments.find(
          (a: any) => a.title === 'With assessment',
        );

        expect(withoutAssessment).not.toHaveProperty('assessmentId');
        expect(withAssessment).toHaveProperty(
          'assessmentId',
          testSetup.assessmentId,
        );
      });

      it('should handle mixed query parameters correctly', async () => {
        // Create 20 arguments with mixed assessments
        for (let i = 1; i <= 20; i++) {
          await testHelpers.createArgumentExpectSuccess({
            title: `Argument ${i}`,
            ...(i % 3 === 0 ? { assessmentId: testSetup.assessmentId } : {}),
          });
        }

        // Filter by assessment with pagination
        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .query({
            assessmentId: testSetup.assessmentId,
            page: 2,
            limit: 3,
          })
          .expect(200);

        expect(res.body.arguments).toHaveLength(3);
        expect(res.body.pagination.page).toBe(2);
        expect(res.body.pagination.limit).toBe(3);
        expect(res.body.pagination.hasNext).toBe(false);
        expect(res.body.pagination.hasPrevious).toBe(true);
        res.body.arguments.forEach((arg: any) => {
          expect(arg.assessmentId).toBe(testSetup.assessmentId);
        });
      });
    });

    describe('⚡ Performance', () => {
      it('should handle listing large number of arguments efficiently', async () => {
        // Create 100 arguments
        const payloads = ArgumentTestData.performance.sequential(100);
        await testHelpers.createArgumentsSequentially(payloads);

        const { result, executionTime } =
          await testHelpers.measureExecutionTime(async () => {
            return await request(testSetup.getHttpServer())
              .get('/arguments')
              .query({ limit: 50 });
          });

        expect(result.status).toBe(200);
        expect(result.body.arguments).toHaveLength(50);
        expect(result.body.pagination.total).toBe(100);
        expect(result.body.pagination.hasNext).toBe(true);
        expect(result.body.pagination.hasPrevious).toBe(false);
        expect(executionTime).toBeLessThan(ArgumentTestData.MAX_EXECUTION_TIME);
      });

      it('should handle concurrent list requests', async () => {
        // Create 10 arguments
        for (let i = 1; i <= 10; i++) {
          await testHelpers.createArgumentExpectSuccess({
            title: `Concurrent List Test ${i}`,
          });
        }

        // Make concurrent requests with different parameters
        const requests = [
          request(testSetup.getHttpServer()).get('/arguments'),
          request(testSetup.getHttpServer())
            .get('/arguments')
            .query({ page: 1, limit: 5 }),
          request(testSetup.getHttpServer())
            .get('/arguments')
            .query({ page: 2, limit: 5 }),
          request(testSetup.getHttpServer())
            .get('/arguments')
            .query({ assessmentId: testSetup.assessmentId }),
        ];

        const responses = await Promise.all(requests);

        // All should succeed
        responses.forEach((res) => {
          expect(res.status).toBe(200);
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('arguments');
          expect(res.body).toHaveProperty('pagination');
        });
      });
    });

    describe('🔧 Response Format Validation', () => {
      it('should return consistent response structure for all list queries', async () => {
        // Create some test data
        await testHelpers.createArgumentExpectSuccess({
          title: 'Format Test 1',
        });
        await testHelpers.createArgumentExpectSuccess({
          title: 'Format Test 2',
          assessmentId: testSetup.assessmentId,
        });

        const testCases = [
          { query: {} }, // Default
          { query: { page: 1, limit: 10 } }, // With pagination
          { query: { assessmentId: testSetup.assessmentId } }, // With filter
          { query: { page: 100 } }, // Empty results
        ];

        for (const testCase of testCases) {
          const res = await request(testSetup.getHttpServer())
            .get('/arguments')
            .query(testCase.query)
            .expect(200);

          // Verify structure
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('arguments');
          expect(Array.isArray(res.body.arguments)).toBe(true);
          expect(res.body).toHaveProperty('pagination');
          expect(res.body.pagination).toHaveProperty('page');
          expect(res.body.pagination).toHaveProperty('limit');
          expect(res.body.pagination).toHaveProperty('total');
          expect(res.body.pagination).toHaveProperty('totalPages');
          expect(res.body.pagination).toHaveProperty('hasNext');
          expect(res.body.pagination).toHaveProperty('hasPrevious');

          // Verify types
          expect(typeof res.body.pagination.page).toBe('number');
          expect(typeof res.body.pagination.limit).toBe('number');
          expect(typeof res.body.pagination.total).toBe('number');
          expect(typeof res.body.pagination.totalPages).toBe('number');
          expect(typeof res.body.pagination.hasNext).toBe('boolean');
          expect(typeof res.body.pagination.hasPrevious).toBe('boolean');
        }
      });

      it('should not include undefined fields in list response', async () => {
        await testHelpers.createArgumentExpectSuccess({
          title: 'No undefined fields test',
        });

        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .expect(200);

        // Check each argument
        res.body.arguments.forEach((arg: any) => {
          testHelpers.verifyNoUndefinedFields(arg, ['assessmentId']);
        });

        // Check pagination
        testHelpers.verifyNoUndefinedFields(res.body.pagination);
      });

      it('should return valid ISO date strings for all timestamps', async () => {
        await testHelpers.createArgumentExpectSuccess({
          title: 'Date validation',
        });

        const res = await request(testSetup.getHttpServer())
          .get('/arguments')
          .expect(200);

        res.body.arguments.forEach((arg: any) => {
          expect(new Date(arg.createdAt).toISOString()).toBe(arg.createdAt);
          expect(new Date(arg.updatedAt).toISOString()).toBe(arg.updatedAt);
        });
      });

      it('should calculate totalPages correctly for different scenarios', async () => {
        // Test various total/limit combinations
        const scenarios = [
          { total: 0, limit: 10, expectedPages: 0 },
          { total: 1, limit: 10, expectedPages: 1 },
          { total: 10, limit: 10, expectedPages: 1 },
          { total: 11, limit: 10, expectedPages: 2 },
          { total: 25, limit: 5, expectedPages: 5 },
          { total: 26, limit: 5, expectedPages: 6 },
        ];

        for (const scenario of scenarios) {
          // Clear and create exact number of arguments
          await testSetup.cleanupDatabase();
          await testSetup.setupTestData();

          for (let i = 0; i < scenario.total; i++) {
            await testHelpers.createArgumentExpectSuccess({
              title: `Item ${i + 1}`,
            });
          }

          const res = await request(testSetup.getHttpServer())
            .get('/arguments')
            .query({ limit: scenario.limit })
            .expect(200);

          expect(res.body.pagination.totalPages).toBe(scenario.expectedPages);
          expect(res.body.pagination.total).toBe(scenario.total);
        }
      });
    });
  });
});
