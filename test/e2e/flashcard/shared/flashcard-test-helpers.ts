// test/e2e/flashcard/shared/flashcard-test-helpers.ts
import request from 'supertest';
import { HttpStatus } from '@nestjs/common';

export class FlashcardTestHelpers {
  constructor(private httpServer: any) {}

  // POST methods
  async createFlashcard(data: any): Promise<request.Response> {
    return request(this.httpServer)
      .post('/flashcards')
      .send(data);
  }

  async createFlashcardExpectSuccess(data: any): Promise<request.Response> {
    const response = await this.createFlashcard(data);
    expect(response.status).toBe(HttpStatus.CREATED);
    return response;
  }

  async createFlashcardExpectBadRequest(data: any): Promise<request.Response> {
    const response = await this.createFlashcard(data);
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    return response;
  }

  async createFlashcardExpectNotFound(data: any): Promise<request.Response> {
    const response = await this.createFlashcard(data);
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
    return response;
  }

  async createFlashcardExpectConflict(data: any): Promise<request.Response> {
    const response = await this.createFlashcard(data);
    expect(response.status).toBe(HttpStatus.CONFLICT);
    return response;
  }

  async createFlashcardExpectInternalError(data: any): Promise<request.Response> {
    const response = await this.createFlashcard(data);
    expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    return response;
  }

  // GET methods
  async getFlashcardById(id: string, query?: Record<string, any>): Promise<request.Response> {
    return request(this.httpServer)
      .get(`/flashcards/${id}`)
      .query(query || {});
  }

  async getFlashcardByIdExpectSuccess(id: string, query?: Record<string, any>): Promise<request.Response> {
    const response = await this.getFlashcardById(id, query);
    expect(response.status).toBe(HttpStatus.OK);
    return response;
  }

  async getFlashcardByIdExpectBadRequest(id: string, query?: Record<string, any>): Promise<request.Response> {
    const response = await this.getFlashcardById(id, query);
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    return response;
  }

  async getFlashcardByIdExpectNotFound(id: string, query?: Record<string, any>): Promise<request.Response> {
    const response = await this.getFlashcardById(id, query);
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
    return response;
  }

  async getFlashcardByIdExpectInternalError(id: string, query?: Record<string, any>): Promise<request.Response> {
    const response = await this.getFlashcardById(id, query);
    expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    return response;
  }
}