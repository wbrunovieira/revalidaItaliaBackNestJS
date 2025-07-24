// src/infra/controllers/tests/attempt/post-submit-answer.controller.spec.ts

import { describe, it, expect, beforeEach } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { left, right } from '@/core/either';

import { AttemptControllerTestSetup } from './shared/attempt-controller-test-setup';
import { AttemptControllerTestData } from './shared/attempt-controller-test-data';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AttemptNotFoundError } from '@/domain/assessment/application/use-cases/errors/attempt-not-found-error';
import { AttemptNotActiveError } from '@/domain/assessment/application/use-cases/errors/attempt-not-active-error';
import { QuestionNotFoundError } from '@/domain/assessment/application/use-cases/errors/question-not-found-error';
import { InvalidAnswerTypeError } from '@/domain/assessment/application/use-cases/errors/invalid-answer-type-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';

describe('[Unit] AttemptController - POST /:id/answers (submitAnswer)', () => {
  let testSetup: AttemptControllerTestSetup;
  let controller: AttemptControllerTestSetup['controller'];
  let submitAnswerUseCase: AttemptControllerTestSetup['submitAnswerUseCase'];

  beforeEach(() => {
    testSetup = new AttemptControllerTestSetup();
    const instances = testSetup.getTestInstances();
    controller = instances.controller;
    submitAnswerUseCase = instances.submitAnswerUseCase;
    testSetup.resetMocks();
  });

  describe('Success Cases', () => {
    it('should submit a multiple choice answer successfully', async () => {
      // Arrange
      const attemptId = '550e8400-e29b-41d4-a716-446655440010';
      const dto =
        AttemptControllerTestData.validSubmitAnswerDto.multipleChoice();
      const expectedResponse =
        AttemptControllerTestData.mockSubmitAnswerResponse.multipleChoice();

      submitAnswerUseCase.execute.mockResolvedValue(right(expectedResponse));

      // Act
      const result = await controller.submitAnswer(attemptId, dto);

      // Assert
      expect(submitAnswerUseCase.execute).toHaveBeenCalledWith({
        attemptId,
        questionId: dto.questionId,
        selectedOptionId: dto.selectedOptionId,
        textAnswer: dto.textAnswer,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should submit an open question answer successfully', async () => {
      // Arrange
      const attemptId = '550e8400-e29b-41d4-a716-446655440010';
      const dto = AttemptControllerTestData.validSubmitAnswerDto.openQuestion();
      const expectedResponse =
        AttemptControllerTestData.mockSubmitAnswerResponse.openQuestion();

      submitAnswerUseCase.execute.mockResolvedValue(right(expectedResponse));

      // Act
      const result = await controller.submitAnswer(attemptId, dto);

      // Assert
      expect(submitAnswerUseCase.execute).toHaveBeenCalledWith({
        attemptId,
        questionId: dto.questionId,
        selectedOptionId: dto.selectedOptionId,
        textAnswer: dto.textAnswer,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should handle undefined optional fields correctly', async () => {
      // Arrange
      const attemptId = '550e8400-e29b-41d4-a716-446655440010';
      const dto = {
        questionId: '550e8400-e29b-41d4-a716-446655440020',
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440021',
        // textAnswer is undefined
      };
      const expectedResponse =
        AttemptControllerTestData.mockSubmitAnswerResponse.multipleChoice();

      submitAnswerUseCase.execute.mockResolvedValue(right(expectedResponse));

      // Act
      const result = await controller.submitAnswer(attemptId, dto);

      // Assert
      expect(submitAnswerUseCase.execute).toHaveBeenCalledWith({
        attemptId,
        questionId: dto.questionId,
        selectedOptionId: dto.selectedOptionId,
        textAnswer: undefined,
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('Error Cases', () => {
    describe('InvalidInputError', () => {
      it('should throw BadRequestException when use case returns InvalidInputError', async () => {
        // Arrange
        const attemptId = '550e8400-e29b-41d4-a716-446655440010';
        const dto =
          AttemptControllerTestData.invalidSubmitAnswerDto.invalidQuestionId();
        const error = new InvalidInputError('Invalid input data', [
          'Invalid question ID format',
        ]);

        submitAnswerUseCase.execute.mockResolvedValue(left(error));

        // Act & Assert
        await expect(controller.submitAnswer(attemptId, dto)).rejects.toThrow(
          new BadRequestException({
            error: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: error.details,
          }),
        );

        expect(submitAnswerUseCase.execute).toHaveBeenCalledWith({
          attemptId,
          questionId: dto.questionId,
          selectedOptionId: dto.selectedOptionId,
          textAnswer: dto.textAnswer,
        });
      });
    });

    describe('AttemptNotFoundError', () => {
      it('should throw NotFoundException when attempt is not found', async () => {
        // Arrange
        const attemptId = '550e8400-e29b-41d4-a716-446655440999'; // Non-existent
        const dto =
          AttemptControllerTestData.validSubmitAnswerDto.multipleChoice();
        const error = new AttemptNotFoundError();

        submitAnswerUseCase.execute.mockResolvedValue(left(error));

        // Act & Assert
        await expect(controller.submitAnswer(attemptId, dto)).rejects.toThrow(
          new NotFoundException({
            error: 'ATTEMPT_NOT_FOUND',
            message: 'Attempt not found',
          }),
        );
      });
    });

    describe('AttemptNotActiveError', () => {
      it('should throw BadRequestException when attempt is not active', async () => {
        // Arrange
        const attemptId = '550e8400-e29b-41d4-a716-446655440010';
        const dto =
          AttemptControllerTestData.validSubmitAnswerDto.multipleChoice();
        const error = new AttemptNotActiveError();

        submitAnswerUseCase.execute.mockResolvedValue(left(error));

        // Act & Assert
        await expect(controller.submitAnswer(attemptId, dto)).rejects.toThrow(
          new BadRequestException({
            error: 'ATTEMPT_NOT_ACTIVE',
            message: 'Attempt is not active',
          }),
        );
      });
    });

    describe('QuestionNotFoundError', () => {
      it('should throw NotFoundException when question is not found', async () => {
        // Arrange
        const attemptId = '550e8400-e29b-41d4-a716-446655440010';
        const dto = {
          questionId: '550e8400-e29b-41d4-a716-446655440999', // Non-existent
          selectedOptionId: '550e8400-e29b-41d4-a716-446655440021',
        };
        const error = new QuestionNotFoundError();

        submitAnswerUseCase.execute.mockResolvedValue(left(error));

        // Act & Assert
        await expect(controller.submitAnswer(attemptId, dto)).rejects.toThrow(
          new NotFoundException({
            error: 'QUESTION_NOT_FOUND',
            message: 'Question not found',
          }),
        );
      });
    });

    describe('InvalidAnswerTypeError', () => {
      it('should throw BadRequestException when answer type is invalid', async () => {
        // Arrange
        const attemptId = '550e8400-e29b-41d4-a716-446655440010';
        const dto =
          AttemptControllerTestData.invalidSubmitAnswerDto.neitherAnswerType();
        const errorMessage =
          'Multiple choice questions require selectedOptionId';
        const error = new InvalidAnswerTypeError(errorMessage);

        submitAnswerUseCase.execute.mockResolvedValue(left(error));

        // Act & Assert
        await expect(controller.submitAnswer(attemptId, dto)).rejects.toThrow(
          new BadRequestException({
            error: 'INVALID_ANSWER_TYPE',
            message: errorMessage,
          }),
        );
      });

      it('should throw BadRequestException when open question has no text answer', async () => {
        // Arrange
        const attemptId = '550e8400-e29b-41d4-a716-446655440010';
        const dto = { questionId: '550e8400-e29b-41d4-a716-446655440022' }; // Open question, no answer
        const errorMessage = 'Open questions require textAnswer';
        const error = new InvalidAnswerTypeError(errorMessage);

        submitAnswerUseCase.execute.mockResolvedValue(left(error));

        // Act & Assert
        await expect(controller.submitAnswer(attemptId, dto)).rejects.toThrow(
          new BadRequestException({
            error: 'INVALID_ANSWER_TYPE',
            message: errorMessage,
          }),
        );
      });
    });

    describe('RepositoryError', () => {
      it('should throw InternalServerErrorException when repository fails', async () => {
        // Arrange
        const attemptId = '550e8400-e29b-41d4-a716-446655440010';
        const dto =
          AttemptControllerTestData.validSubmitAnswerDto.multipleChoice();
        const errorMessage = 'Failed to create answer';
        const error = new RepositoryError(errorMessage);

        submitAnswerUseCase.execute.mockResolvedValue(left(error));

        // Act & Assert
        await expect(controller.submitAnswer(attemptId, dto)).rejects.toThrow(
          new InternalServerErrorException({
            error: 'INTERNAL_ERROR',
            message: errorMessage,
          }),
        );
      });
    });

    describe('Unknown Error', () => {
      it('should throw InternalServerErrorException for unknown errors', async () => {
        // Arrange
        const attemptId = '550e8400-e29b-41d4-a716-446655440010';
        const dto =
          AttemptControllerTestData.validSubmitAnswerDto.multipleChoice();

        // Mock an unknown error type
        class UnknownError extends Error {
          constructor() {
            super('Unknown error');
          }
        }
        const error = new UnknownError();

        submitAnswerUseCase.execute.mockResolvedValue(left(error));

        // Act & Assert
        await expect(controller.submitAnswer(attemptId, dto)).rejects.toThrow(
          new InternalServerErrorException({
            error: 'INTERNAL_ERROR',
            message: 'Unexpected error occurred',
          }),
        );
      });
    });
  });

  describe('Integration with Use Case', () => {
    it('should pass correct parameters to use case for multiple choice', async () => {
      // Arrange
      const attemptId = '550e8400-e29b-41d4-a716-446655440010';
      const dto =
        AttemptControllerTestData.validSubmitAnswerDto.multipleChoice();
      const expectedResponse =
        AttemptControllerTestData.mockSubmitAnswerResponse.multipleChoice();

      submitAnswerUseCase.execute.mockResolvedValue(right(expectedResponse));

      // Act
      await controller.submitAnswer(attemptId, dto);

      // Assert
      expect(submitAnswerUseCase.execute).toHaveBeenCalledTimes(1);
      expect(submitAnswerUseCase.execute).toHaveBeenCalledWith({
        attemptId: attemptId,
        questionId: dto.questionId,
        selectedOptionId: dto.selectedOptionId,
        textAnswer: undefined, // Not provided for multiple choice
      });
    });

    it('should pass correct parameters to use case for open question', async () => {
      // Arrange
      const attemptId = '550e8400-e29b-41d4-a716-446655440010';
      const dto = AttemptControllerTestData.validSubmitAnswerDto.openQuestion();
      const expectedResponse =
        AttemptControllerTestData.mockSubmitAnswerResponse.openQuestion();

      submitAnswerUseCase.execute.mockResolvedValue(right(expectedResponse));

      // Act
      await controller.submitAnswer(attemptId, dto);

      // Assert
      expect(submitAnswerUseCase.execute).toHaveBeenCalledTimes(1);
      expect(submitAnswerUseCase.execute).toHaveBeenCalledWith({
        attemptId: attemptId,
        questionId: dto.questionId,
        selectedOptionId: undefined, // Not provided for open question
        textAnswer: dto.textAnswer,
      });
    });

    it('should handle both answer types being provided', async () => {
      // Arrange
      const attemptId = '550e8400-e29b-41d4-a716-446655440010';
      const dto = {
        questionId: '550e8400-e29b-41d4-a716-446655440020',
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440021',
        textAnswer: 'Some text',
      };
      const expectedResponse =
        AttemptControllerTestData.mockSubmitAnswerResponse.multipleChoice();

      submitAnswerUseCase.execute.mockResolvedValue(right(expectedResponse));

      // Act
      await controller.submitAnswer(attemptId, dto);

      // Assert
      expect(submitAnswerUseCase.execute).toHaveBeenCalledWith({
        attemptId: attemptId,
        questionId: dto.questionId,
        selectedOptionId: dto.selectedOptionId,
        textAnswer: dto.textAnswer,
      });
    });
  });

  describe('Response Format', () => {
    it('should return the exact response from use case for multiple choice', async () => {
      // Arrange
      const attemptId = '550e8400-e29b-41d4-a716-446655440010';
      const dto =
        AttemptControllerTestData.validSubmitAnswerDto.multipleChoice();
      const expectedResponse =
        AttemptControllerTestData.mockSubmitAnswerResponse.multipleChoice();

      submitAnswerUseCase.execute.mockResolvedValue(right(expectedResponse));

      // Act
      const result = await controller.submitAnswer(attemptId, dto);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(result.attemptAnswer).toHaveProperty('id');
      expect(result.attemptAnswer).toHaveProperty('selectedOptionId');
      expect(result.attemptAnswer).toHaveProperty('status', 'IN_PROGRESS');
      expect(result.attemptAnswer).toHaveProperty('isCorrect');
      expect(result.attemptAnswer).toHaveProperty('attemptId');
      expect(result.attemptAnswer).toHaveProperty('questionId');
      expect(result.attemptAnswer).toHaveProperty('createdAt');
      expect(result.attemptAnswer).toHaveProperty('updatedAt');
      expect(result.attemptAnswer.textAnswer).toBeUndefined();
    });

    it('should return the exact response from use case for open question', async () => {
      // Arrange
      const attemptId = '550e8400-e29b-41d4-a716-446655440010';
      const dto = AttemptControllerTestData.validSubmitAnswerDto.openQuestion();
      const expectedResponse =
        AttemptControllerTestData.mockSubmitAnswerResponse.openQuestion();

      submitAnswerUseCase.execute.mockResolvedValue(right(expectedResponse));

      // Act
      const result = await controller.submitAnswer(attemptId, dto);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(result.attemptAnswer).toHaveProperty('id');
      expect(result.attemptAnswer).toHaveProperty('textAnswer');
      expect(result.attemptAnswer).toHaveProperty('status', 'IN_PROGRESS');
      expect(result.attemptAnswer).toHaveProperty('attemptId');
      expect(result.attemptAnswer).toHaveProperty('questionId');
      expect(result.attemptAnswer).toHaveProperty('createdAt');
      expect(result.attemptAnswer).toHaveProperty('updatedAt');
      expect(result.attemptAnswer.selectedOptionId).toBeUndefined();
      expect(result.attemptAnswer.isCorrect).toBeUndefined();
    });
  });
});
