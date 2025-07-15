// test/e2e/flashcard-tag/shared/flashcard-tag-test-helpers.ts
import request, { Response } from 'supertest';
import { expect } from 'vitest';
import { FlashcardTagTestSetup } from './flashcard-tag-test-setup';
import { CreateFlashcardTagRequest, GetFlashcardTagByIdResponse } from './flashcard-tag-test-data';

export class FlashcardTagTestHelpers {
  constructor(private readonly testSetup: FlashcardTagTestSetup) {}

  /**
   * Make a GET request to retrieve a flashcard tag by ID
   */
  async getFlashcardTagById(id: string): Promise<Response> {
    return request(this.testSetup.getHttpServer()).get(`/flashcard-tags/${id}`);
  }

  /**
   * Make a POST request to create a flashcard tag
   */
  async createFlashcardTag(data: CreateFlashcardTagRequest): Promise<Response> {
    return request(this.testSetup.getHttpServer())
      .post('/flashcard-tags')
      .send(data);
  }

  /**
   * Get a flashcard tag and expect success
   */
  async getFlashcardTagExpectSuccess(
    id: string,
    expectedData?: Partial<any>,
  ): Promise<Response> {
    const res = await this.getFlashcardTagById(id);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('flashcardTag');

    if (expectedData) {
      expect(res.body.flashcardTag).toMatchObject(expectedData);
    }

    return res;
  }

  /**
   * Get a flashcard tag and expect failure
   */
  async getFlashcardTagExpectFailure(
    id: string,
    expectedStatusCode: number,
    expectedError?: string,
  ): Promise<Response> {
    const res = await this.getFlashcardTagById(id);

    expect(res.status).toBe(expectedStatusCode);

    if (expectedError) {
      expect(res.body).toHaveProperty('error', expectedError);
    }

    return res;
  }

  /**
   * Create a flashcard tag and expect success
   */
  async createFlashcardTagExpectSuccess(
    data: CreateFlashcardTagRequest,
    expectedData?: Partial<any>,
  ): Promise<Response> {
    const res = await this.createFlashcardTag(data);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('flashcardTag');

    if (expectedData) {
      expect(res.body.flashcardTag).toMatchObject(expectedData);
    }

    return res;
  }

  /**
   * Create a flashcard tag and expect failure
   */
  async createFlashcardTagExpectFailure(
    data: CreateFlashcardTagRequest,
    expectedStatusCode: number,
    expectedError?: string,
  ): Promise<Response> {
    const res = await this.createFlashcardTag(data);

    expect(res.status).toBe(expectedStatusCode);

    if (expectedError) {
      expect(res.body).toHaveProperty('error', expectedError);
    }

    return res;
  }

  /**
   * Verify the structure of a GET flashcard tag success response
   */
  verifyGetFlashcardTagSuccessResponseFormat(
    body: any,
    expectedId: string,
  ): void {
    expect(body).toHaveProperty('flashcardTag');
    expect(body.flashcardTag).toHaveProperty('id', expectedId);
    expect(body.flashcardTag).toHaveProperty('name');
    expect(body.flashcardTag).toHaveProperty('slug');
    expect(body.flashcardTag).toHaveProperty('createdAt');
    expect(body.flashcardTag).toHaveProperty('updatedAt');

    // Verify data types
    expect(typeof body.flashcardTag.id).toBe('string');
    expect(typeof body.flashcardTag.name).toBe('string');
    expect(typeof body.flashcardTag.slug).toBe('string');
    expect(typeof body.flashcardTag.createdAt).toBe('string');
    expect(typeof body.flashcardTag.updatedAt).toBe('string');

    // Verify UUID format
    expect(body.flashcardTag.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    // Verify slug format
    expect(body.flashcardTag.slug).toMatch(/^[a-z0-9-]+$/);

    // Verify dates are valid ISO strings
    expect(new Date(body.flashcardTag.createdAt)).toBeInstanceOf(Date);
    expect(new Date(body.flashcardTag.updatedAt)).toBeInstanceOf(Date);
  }

  /**
   * Verify the structure of a CREATE flashcard tag success response
   */
  verifyCreateFlashcardTagSuccessResponseFormat(
    body: any,
    expectedName: string,
  ): void {
    expect(body).toHaveProperty('flashcardTag');
    expect(body.flashcardTag).toHaveProperty('id');
    expect(body.flashcardTag).toHaveProperty('name', expectedName);
    expect(body.flashcardTag).toHaveProperty('slug');
    expect(body.flashcardTag).toHaveProperty('createdAt');
    expect(body.flashcardTag).toHaveProperty('updatedAt');

    // Verify data types
    expect(typeof body.flashcardTag.id).toBe('string');
    expect(typeof body.flashcardTag.name).toBe('string');
    expect(typeof body.flashcardTag.slug).toBe('string');
    expect(typeof body.flashcardTag.createdAt).toBe('string');
    expect(typeof body.flashcardTag.updatedAt).toBe('string');

    // Verify UUID format
    expect(body.flashcardTag.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    // Verify slug format
    expect(body.flashcardTag.slug).toMatch(/^[a-z0-9-]+$/);

    // Verify dates are valid ISO strings
    expect(new Date(body.flashcardTag.createdAt)).toBeInstanceOf(Date);
    expect(new Date(body.flashcardTag.updatedAt)).toBeInstanceOf(Date);
  }

  /**
   * Verify error response format
   */
  verifyErrorResponseFormat(
    body: any,
    expectedError: string,
    expectedMessage: string,
  ): void {
    expect(body).toHaveProperty('error', expectedError);
    expect(body).toHaveProperty('message', expectedMessage);
  }

  /**
   * Verify validation error response format
   */
  verifyValidationErrorResponseFormat(
    body: any,
    expectedError: string,
    expectedMessage: string,
  ): void {
    expect(body).toHaveProperty('error', expectedError);
    expect(body).toHaveProperty('message', expectedMessage);
    expect(body).toHaveProperty('details');
    expect(typeof body.details).toBe('object');
  }

  /**
   * Generate a random valid UUID
   */
  generateRandomUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Generate an invalid UUID
   */
  generateInvalidUUID(): string {
    return 'invalid-uuid-format';
  }

  /**
   * Generate a non-existent but valid UUID
   */
  generateNonExistentUUID(): string {
    return '550e8400-e29b-41d4-a716-446655440999';
  }
}