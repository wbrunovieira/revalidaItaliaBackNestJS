// src/infra/controllers/tests/question/create-question.controller.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { QuestionControllerTestSetup } from './shared/question-controller-test-setup';
import { QuestionControllerTestData } from './shared/question-controller-test-data';
import { QuestionControllerTestHelpers } from './shared/question-controller-test-helpers';

describe('QuestionController - Create', () => {
  let testSetup: QuestionControllerTestSetup;
  let testHelpers: QuestionControllerTestHelpers;

  beforeEach(() => {
    testSetup = new QuestionControllerTestSetup();
    testHelpers = new QuestionControllerTestHelpers(testSetup);
  });

  describe('Success Cases', () => {
    it('should create multiple choice question successfully', async () => {
      const dto = QuestionControllerTestData.validDtos.multipleChoiceQuiz();
      const result = await testHelpers.executeCreateExpectSuccess(dto);

      testHelpers.verifySuccessResponseStructure(result, dto);
      expect(result.question.type).toBe('MULTIPLE_CHOICE');
    });

    it('should create multiple choice question with argument', async () => {
      const dto =
        QuestionControllerTestData.validDtos.multipleChoiceWithArgument();
      const result = await testHelpers.executeCreateExpectSuccess(dto);

      testHelpers.verifySuccessResponseStructure(result, dto);
      expect(result.question.type).toBe('MULTIPLE_CHOICE');
      expect(result.question.argumentId).toBe(dto.argumentId);
    });

    it('should create open question successfully', async () => {
      const dto = QuestionControllerTestData.validDtos.openQuestion();
      const result = await testHelpers.executeCreateExpectSuccess(dto);

      testHelpers.verifySuccessResponseStructure(result, dto);
      expect(result.question.type).toBe('OPEN');
    });

    it('should create open question with argument', async () => {
      const dto =
        QuestionControllerTestData.validDtos.openQuestionWithArgument();
      const result = await testHelpers.executeCreateExpectSuccess(dto);

      testHelpers.verifySuccessResponseStructure(result, dto);
      expect(result.question.type).toBe('OPEN');
      expect(result.question.argumentId).toBe(dto.argumentId);
    });

    it('should create question with minimum text length', async () => {
      const dto = QuestionControllerTestData.validDtos.minLength();
      const result = await testHelpers.executeCreateExpectSuccess(dto);

      testHelpers.verifySuccessResponseStructure(result, dto);
      expect(result.question.text.length).toBe(10);
    });

    it('should create question with maximum text length', async () => {
      const dto = QuestionControllerTestData.validDtos.maxLength();
      const result = await testHelpers.executeCreateExpectSuccess(dto);

      testHelpers.verifySuccessResponseStructure(result, dto);
      expect(result.question.text.length).toBe(1000);
    });

    it('should create question with special characters', async () => {
      const dto = QuestionControllerTestData.validDtos.specialChars();
      const result = await testHelpers.executeCreateExpectSuccess(dto);

      testHelpers.verifySuccessResponseStructure(result, dto);
      expect(result.question.text).toContain('@#$%^&*()!');
    });

    it('should create question with unicode characters', async () => {
      const dto = QuestionControllerTestData.validDtos.unicode();
      const result = await testHelpers.executeCreateExpectSuccess(dto);

      testHelpers.verifySuccessResponseStructure(result, dto);
      expect(result.question.text).toContain('中文');
      expect(result.question.text).toContain('🎯');
    });

    it('should create question with newlines and formatting', async () => {
      const dto = QuestionControllerTestData.validDtos.withNewlines();
      const result = await testHelpers.executeCreateExpectSuccess(dto);

      testHelpers.verifySuccessResponseStructure(result, dto);
      expect(result.question.text).toContain('\n');
      expect(result.question.text).toContain('\t');
    });

    it('should create medical context question', async () => {
      const dto = QuestionControllerTestData.validDtos.medical();
      const result = await testHelpers.executeCreateExpectSuccess(dto);

      testHelpers.verifySuccessResponseStructure(result, dto);
      expect(result.question.text).toContain('dyspnea');
      expect(result.question.text).toContain('differential diagnosis');
    });
  });

  describe('Validation Errors', () => {
    it('should throw BadRequestException for text too short', async () => {
      const dto = QuestionControllerTestData.invalidDtos.textTooShort();
      await testHelpers.executeCreateExpectBadRequest(dto, () =>
        testHelpers.mockValidationError([
          'text: Question text must be at least 10 characters long',
        ]),
      );
    });

    it('should throw BadRequestException for text too long', async () => {
      const dto = QuestionControllerTestData.invalidDtos.textTooLong();
      await testHelpers.executeCreateExpectBadRequest(dto, () =>
        testHelpers.mockValidationError([
          'text: Question text must be at most 1000 characters long',
        ]),
      );
    });

    it('should throw BadRequestException for empty text', async () => {
      const dto = QuestionControllerTestData.invalidDtos.emptyText();
      await testHelpers.executeCreateExpectBadRequest(dto, () =>
        testHelpers.mockValidationError([
          'text: Question text must be at least 10 characters long',
        ]),
      );
    });

    it('should throw BadRequestException for whitespace-only text', async () => {
      const dto = QuestionControllerTestData.invalidDtos.whitespaceText();
      await testHelpers.executeCreateExpectBadRequest(dto, () =>
        testHelpers.mockValidationError([
          'Question creation failed: Question text cannot be empty',
        ]),
      );
    });

    it('should throw BadRequestException for invalid question type', async () => {
      const dto = QuestionControllerTestData.invalidDtos.invalidType();
      await testHelpers.executeCreateExpectBadRequest(dto, () =>
        testHelpers.mockValidationError([
          'type: Type must be MULTIPLE_CHOICE or OPEN',
        ]),
      );
    });

    it('should throw BadRequestException for missing type', async () => {
      const dto = QuestionControllerTestData.invalidDtos.missingType();
      await testHelpers.executeCreateExpectBadRequest(dto, () =>
        testHelpers.mockValidationError([
          'type: Type must be MULTIPLE_CHOICE or OPEN',
        ]),
      );
    });

    it('should throw BadRequestException for invalid assessmentId UUID', async () => {
      const dto = QuestionControllerTestData.invalidDtos.invalidAssessmentId();
      await testHelpers.executeCreateExpectBadRequest(dto, () =>
        testHelpers.mockValidationError([
          'assessmentId: Assessment ID must be a valid UUID',
        ]),
      );
    });

    it('should throw BadRequestException for missing assessmentId', async () => {
      const dto = QuestionControllerTestData.invalidDtos.missingAssessmentId();
      await testHelpers.executeCreateExpectBadRequest(dto, () =>
        testHelpers.mockValidationError(['assessmentId: Required']),
      );
    });

    it('should throw BadRequestException for invalid argumentId UUID', async () => {
      const dto = QuestionControllerTestData.invalidDtos.invalidArgumentId();
      await testHelpers.executeCreateExpectBadRequest(dto, () =>
        testHelpers.mockValidationError([
          'argumentId: Argument ID must be a valid UUID',
        ]),
      );
    });

    it('should throw BadRequestException for multiple validation errors', async () => {
      const dto = QuestionControllerTestData.invalidDtos.multipleErrors();
      await testHelpers.executeCreateExpectBadRequest(dto, () =>
        testHelpers.mockValidationError([
          'text: Question text must be at least 10 characters long',
          'type: Type must be MULTIPLE_CHOICE or OPEN',
          'assessmentId: Assessment ID must be a valid UUID',
          'argumentId: Argument ID must be a valid UUID',
        ]),
      );
    });

    it('should throw BadRequestException for null values', async () => {
      const dto = QuestionControllerTestData.invalidDtos.nullValues();
      await testHelpers.executeCreateExpectBadRequest(dto, () =>
        testHelpers.mockValidationError([
          'text: Expected string, received null',
          'type: Type must be MULTIPLE_CHOICE or OPEN',
          'assessmentId: Expected string, received null',
        ]),
      );
    });

    it('should throw BadRequestException for number values', async () => {
      const dto = QuestionControllerTestData.invalidDtos.numberValues();
      await testHelpers.executeCreateExpectBadRequest(dto, () =>
        testHelpers.mockValidationError([
          'text: Expected string, received number',
          'type: Type must be MULTIPLE_CHOICE or OPEN',
          'assessmentId: Expected string, received number',
        ]),
      );
    });
  });

  describe('Business Logic Errors', () => {
    it('should throw ConflictException for duplicate question', async () => {
      const { first, second } =
        QuestionControllerTestData.getDuplicateScenario();

      // First creation succeeds
      await testHelpers.executeCreateExpectSuccess(first);
      testHelpers.reset();

      // Second creation fails with conflict
      await testHelpers.executeCreateExpectConflict(second);
    });

    it('should throw NotFoundException for assessment not found', async () => {
      const dto = QuestionControllerTestData.validDtos.multipleChoiceQuiz();
      await testHelpers.executeCreateExpectNotFound(dto, 'assessment');
    });

    it('should throw NotFoundException for argument not found', async () => {
      const dto =
        QuestionControllerTestData.validDtos.multipleChoiceWithArgument();
      await testHelpers.executeCreateExpectNotFound(dto, 'argument');
    });

    it('should throw BadRequestException for question type mismatch - QUIZ with OPEN', async () => {
      const dto = QuestionControllerTestData.getTypeMismatchScenario('QUIZ');
      testHelpers.mockTypeMismatchError('QUIZ', 'MULTIPLE_CHOICE');

      await expect(testSetup.controller.create(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for question type mismatch - SIMULADO with OPEN', async () => {
      const dto =
        QuestionControllerTestData.getTypeMismatchScenario('SIMULADO');
      testHelpers.mockTypeMismatchError('SIMULADO', 'MULTIPLE_CHOICE');

      await expect(testSetup.controller.create(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for question type mismatch - PROVA_ABERTA with MULTIPLE_CHOICE', async () => {
      const dto =
        QuestionControllerTestData.getTypeMismatchScenario('PROVA_ABERTA');
      testHelpers.mockTypeMismatchError('PROVA_ABERTA', 'OPEN');

      await expect(testSetup.controller.create(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Repository Errors', () => {
    it('should throw InternalServerErrorException for repository error', async () => {
      const dto = QuestionControllerTestData.validDtos.multipleChoiceQuiz();
      await testHelpers.executeCreateExpectInternalError(dto, 'repository');
    });

    it('should throw InternalServerErrorException for database connection error', async () => {
      const dto = QuestionControllerTestData.validDtos.multipleChoiceQuiz();
      testHelpers.mockRepositoryError('Database connection failed');

      await expect(testSetup.controller.create(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException for constraint violation', async () => {
      const dto = QuestionControllerTestData.validDtos.multipleChoiceQuiz();
      testHelpers.mockRepositoryError('Foreign key constraint failed');

      await expect(testSetup.controller.create(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException for unknown error', async () => {
      const dto = QuestionControllerTestData.validDtos.multipleChoiceQuiz();
      await testHelpers.executeCreateExpectInternalError(dto, 'unknown');
    });
  });

  describe('Edge Cases', () => {
    it('should handle question creation with all valid edge cases', async () => {
      const edgeCaseDtos = [
        QuestionControllerTestData.validDtos.minLength(),
        QuestionControllerTestData.validDtos.maxLength(),
        QuestionControllerTestData.validDtos.specialChars(),
        QuestionControllerTestData.validDtos.unicode(),
        QuestionControllerTestData.validDtos.withNewlines(),
      ];

      for (const dto of edgeCaseDtos) {
        const result = await testHelpers.executeCreateExpectSuccess(dto);
        testHelpers.verifySuccessResponseStructure(result, dto);
        testHelpers.reset();
      }
    });

    it('should maintain data integrity across multiple creations', async () => {
      const dto1 = QuestionControllerTestData.validDtos.multipleChoiceQuiz();
      const dto2 = QuestionControllerTestData.validDtos.openQuestion();
      const dto3 =
        QuestionControllerTestData.validDtos.multipleChoiceWithArgument();

      const result1 = await testHelpers.executeCreateExpectSuccess(dto1);
      testHelpers.reset();

      const result2 = await testHelpers.executeCreateExpectSuccess(dto2);
      testHelpers.reset();

      const result3 = await testHelpers.executeCreateExpectSuccess(dto3);

      // Verify all have different IDs
      expect(result1.question.id).not.toBe(result2.question.id);
      expect(result2.question.id).not.toBe(result3.question.id);
      expect(result1.question.id).not.toBe(result3.question.id);
    });

    it('should handle concurrent creation requests', async () => {
      const concurrentDtos =
        QuestionControllerTestData.performance.concurrent(3);

      const promises = concurrentDtos.map(async (dto, index) => {
        const uniqueDto = {
          ...dto,
          text: `${dto.text} - ${index}`,
        };
        return testHelpers.executeCreateExpectSuccess(uniqueDto);
      });

      const results = await Promise.all(promises);

      // Verify all succeeded
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.question.text).toContain(`- ${index}`);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should complete question creation within reasonable time', async () => {
      const dto = QuestionControllerTestData.validDtos.multipleChoiceQuiz();

      const { result, executionTime } = await testHelpers.measureExecutionTime(
        async () => {
          return await testHelpers.executeCreateExpectSuccess(dto);
        },
      );

      expect(result).toBeDefined();
      testHelpers.verifyExecutionTime(executionTime, 100); // Should complete in < 100ms
    });

    it('should handle sequential question creations efficiently', async () => {
      const sequentialDtos =
        QuestionControllerTestData.performance.sequential(5);

      const { result: results, executionTime } =
        await testHelpers.measureExecutionTime(async () => {
          const outcomes: any[] = [];
          for (const dto of sequentialDtos) {
            const result = await testHelpers.executeCreateExpectSuccess(dto);
            outcomes.push(result);
            testHelpers.reset();
          }
          return outcomes;
        });

      expect(results).toHaveLength(5);
      testHelpers.verifyExecutionTime(executionTime, 500); // Should complete in < 500ms
    });
  });

  describe('Response Format Validation', () => {
    it('should return consistent response structure for all question types', async () => {
      const testCases = [
        {
          dto: QuestionControllerTestData.validDtos.multipleChoiceQuiz(),
          type: 'MULTIPLE_CHOICE',
        },
        {
          dto: QuestionControllerTestData.validDtos.openQuestion(),
          type: 'OPEN',
        },
        {
          dto: QuestionControllerTestData.validDtos.multipleChoiceWithArgument(),
          type: 'MULTIPLE_CHOICE',
        },
        {
          dto: QuestionControllerTestData.validDtos.openQuestionWithArgument(),
          type: 'OPEN',
        },
      ];

      for (const testCase of testCases) {
        const result = await testHelpers.executeCreateExpectSuccess(
          testCase.dto,
        );

        // Verify consistent structure
        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('question');
        expect(result.question).toHaveProperty('id');
        expect(result.question).toHaveProperty('text');
        expect(result.question).toHaveProperty('type', testCase.type);
        expect(result.question).toHaveProperty('assessmentId');
        expect(result.question).toHaveProperty('createdAt');
        expect(result.question).toHaveProperty('updatedAt');

        testHelpers.reset();
      }
    });

    it('should include argumentId in response when provided', async () => {
      const dto =
        QuestionControllerTestData.validDtos.multipleChoiceWithArgument();
      const result = await testHelpers.executeCreateExpectSuccess(dto);

      expect(result.question).toHaveProperty('argumentId', dto.argumentId);
    });

    it('should not include argumentId in response when not provided', async () => {
      const dto = QuestionControllerTestData.validDtos.multipleChoiceQuiz();
      const result = await testHelpers.executeCreateExpectSuccess(dto);

      expect(result.question.argumentId).toBeUndefined();
    });
  });
});
