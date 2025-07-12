// src/domain/assessment/application/use-cases/create-argument.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Either, left, right } from '@/core/either';
import { CreateArgumentUseCase } from './create-argument.use-case';
import { CreateArgumentRequest } from '../dtos/create-argument-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { DuplicateArgumentError } from './errors/duplicate-argument-error';
import { RepositoryError } from './errors/repository-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { Argument } from '@/domain/assessment/enterprise/entities/argument.entity';
import { IArgumentRepository } from '../repositories/i-argument-repository';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';

class MockArgumentRepository implements IArgumentRepository {
  findById = vi.fn();
  findByTitle = vi.fn();
  findByAssessmentId = vi.fn();
  create = vi.fn();
  findAll = vi.fn();
  findAllPaginated = vi.fn();
  update = vi.fn();
  delete = vi.fn();
  findByTitleAndAssessmentId = vi.fn();
}

class MockAssessmentRepository implements IAssessmentRepository {
  findById = vi.fn();
  findByTitle = vi.fn();
  findByLessonId = vi.fn();
  create = vi.fn();
  findAll = vi.fn();
  findAllPaginated = vi.fn();
  update = vi.fn();
  delete = vi.fn();
  findByTitleExcludingId = vi.fn();
}

describe('CreateArgumentUseCase', () => {
  let useCase: CreateArgumentUseCase;
  let argumentRepo: MockArgumentRepository;
  let assessmentRepo: MockAssessmentRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    argumentRepo = new MockArgumentRepository();
    assessmentRepo = new MockAssessmentRepository();
    useCase = new CreateArgumentUseCase(argumentRepo, assessmentRepo);
  });

  describe('Success Cases', () => {
    const createSuccess = async (request: CreateArgumentRequest) => {
      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      if (request.assessmentId) {
        assessmentRepo.findById.mockResolvedValueOnce(right({} as Assessment));
      }
      argumentRepo.create.mockResolvedValueOnce(right(undefined));
      return useCase.execute(request);
    };

    it('creates argument with assessmentId', async () => {
      const request: CreateArgumentRequest = {
        title: 'Test Argument',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      };

      const result = await createSuccess(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { argument } = result.value;
        expect(argument.title).toBe('Test Argument');
        expect(argument.assessmentId).toBe(
          '11111111-1111-1111-1111-111111111111',
        );
        expect(argument.id).toBeDefined();
        expect(argument.createdAt).toBeDefined();
        expect(argument.updatedAt).toBeDefined();
      }
    });

    it('creates argument without assessmentId', async () => {
      const request: CreateArgumentRequest = {
        title: 'Standalone Argument',
      };

      const result = await createSuccess(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { argument } = result.value;
        expect(argument.title).toBe('Standalone Argument');
        expect(argument.assessmentId).toBeUndefined();
        expect(argument.id).toBeDefined();
        expect(argument.createdAt).toBeDefined();
        expect(argument.updatedAt).toBeDefined();
      }
    });

    it('creates argument with long title', async () => {
      const longTitle = 'A'.repeat(200);
      const request: CreateArgumentRequest = {
        title: longTitle,
        assessmentId: '22222222-2222-2222-2222-222222222222',
      };

      const result = await createSuccess(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { argument } = result.value;
        expect(argument.title).toBe(longTitle);
      }
    });

    it('creates argument with special characters in title', async () => {
      const request: CreateArgumentRequest = {
        title: 'Título com Acentos & Símbolos!',
        assessmentId: '33333333-3333-3333-3333-333333333333',
      };

      const result = await createSuccess(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { argument } = result.value;
        expect(argument.title).toBe('Título com Acentos & Símbolos!');
      }
    });

    it('creates argument with exactly 3 characters (minimum)', async () => {
      const request: CreateArgumentRequest = {
        title: 'Min',
        assessmentId: '44444444-4444-4444-4444-444444444444',
      };

      const result = await createSuccess(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { argument } = result.value;
        expect(argument.title).toBe('Min');
        expect(argument.title.length).toBe(3);
      }
    });

    it('creates argument with exactly 255 characters (maximum)', async () => {
      const maxTitle = 'A'.repeat(255);
      const request: CreateArgumentRequest = {
        title: maxTitle,
        assessmentId: '55555555-5555-5555-5555-555555555555',
      };

      const result = await createSuccess(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { argument } = result.value;
        expect(argument.title).toBe(maxTitle);
        expect(argument.title.length).toBe(255);
      }
    });

    it('creates argument with emojis in title', async () => {
      const request: CreateArgumentRequest = {
        title: 'Argument with 🚀 emojis 🎯',
        assessmentId: '66666666-6666-6666-6666-666666666666',
      };

      const result = await createSuccess(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { argument } = result.value;
        expect(argument.title).toBe('Argument with 🚀 emojis 🎯');
      }
    });

    it('creates argument with only numbers in title', async () => {
      const request: CreateArgumentRequest = {
        title: '123456789',
        assessmentId: '77777777-7777-7777-7777-777777777777',
      };

      const result = await createSuccess(request);

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { argument } = result.value;
        expect(argument.title).toBe('123456789');
      }
    });
  });

  describe('Validation Errors', () => {
    type ErrCase = [string, any, string[]];
    const cases: ErrCase[] = [
      [
        'title too short',
        {
          title: 'Ab',
          assessmentId: '11111111-1111-1111-1111-111111111111',
        },
        ['title: Argument title must be at least 3 characters long'],
      ],
      [
        'title too long',
        {
          title: 'A'.repeat(300),
          assessmentId: '11111111-1111-1111-1111-111111111111',
        },
        ['title: Argument title must be at most 255 characters long'],
      ],
      [
        'invalid assessmentId UUID',
        {
          title: 'Valid Title',
          assessmentId: 'invalid-uuid',
        },
        ['assessmentId: Assessment ID must be a valid UUID'],
      ],
      [
        'empty title',
        {
          title: '',
          assessmentId: '11111111-1111-1111-1111-111111111111',
        },
        ['title: Argument title must be at least 3 characters long'],
      ],
      [
        'whitespace only title',
        {
          title: '   ',
          assessmentId: '11111111-1111-1111-1111-111111111111',
        },
        ['title: Argument title must be at least 3 characters long'],
      ],
      [
        'title with only numbers',
        {
          title: '12',
          assessmentId: '11111111-1111-1111-1111-111111111111',
        },
        ['title: Argument title must be at least 3 characters long'],
      ],
      [
        'title with newlines',
        {
          title: 'Title\nWith\nNewlines',
          assessmentId: '11111111-1111-1111-1111-111111111111',
        },
        [],
      ],
      [
        'empty assessmentId string',
        {
          title: 'Valid Title',
          assessmentId: '',
        },
        ['assessmentId: Assessment ID must be a valid UUID'],
      ],
      [
        'title with control characters',
        {
          title: 'Title\x00\x01\x02',
          assessmentId: '11111111-1111-1111-1111-111111111111',
        },
        [],
      ],
    ];

    it.each(cases)('%s', async (_name, req, expected) => {
      const result = await useCase.execute(req as CreateArgumentRequest);
      expect(result.isLeft()).toBe(true);
      if (result.isLeft() && result.value instanceof InvalidInputError) {
        const error = result.value;
        expected.forEach((msg) => expect(error.details).toContain(msg));
      }
    });
  });

  describe('Business Logic Errors', () => {
    it('duplicate title', async () => {
      const req: CreateArgumentRequest = {
        title: 'Duplicate Title',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      };

      const existing = Argument.create({
        title: 'Duplicate Title',
        assessmentId: undefined,
      });

      argumentRepo.findByTitle.mockResolvedValueOnce(right(existing));

      const result = await useCase.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(DuplicateArgumentError);
    });

    it('duplicate title with different case', async () => {
      const req: CreateArgumentRequest = {
        title: 'Duplicate Title',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      };

      const existing = Argument.create({
        title: 'DUPLICATE TITLE',
        assessmentId: undefined,
      });

      argumentRepo.findByTitle.mockResolvedValueOnce(right(existing));

      const result = await useCase.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(DuplicateArgumentError);
    });

    it('assessment not found', async () => {
      const req: CreateArgumentRequest = {
        title: 'Valid Title',
        assessmentId: '99999999-9999-9999-9999-999999999999',
      };

      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.findById.mockResolvedValueOnce(
        left(new Error('not found')),
      );

      const result = await useCase.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
    });

    it('assessment exists but is soft deleted', async () => {
      const req: CreateArgumentRequest = {
        title: 'Valid Title',
        assessmentId: '88888888-8888-8888-8888-888888888888',
      };

      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.findById.mockResolvedValueOnce(
        left(new Error('Assessment not found')),
      );

      const result = await useCase.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
    });
  });

  describe('Repository Errors', () => {
    it('throws on findByTitle', async () => {
      argumentRepo.findByTitle.mockRejectedValueOnce(new Error('DB down'));

      const result = await useCase.execute({
        title: 'Test',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('error on create', async () => {
      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.findById.mockResolvedValueOnce(right({} as Assessment));
      argumentRepo.create.mockResolvedValueOnce(left(new Error('fail')));

      const result = await useCase.execute({
        title: 'Test',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('throws on create', async () => {
      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.findById.mockResolvedValueOnce(right({} as Assessment));
      argumentRepo.create.mockRejectedValueOnce(new Error('constraint'));

      const result = await useCase.execute({
        title: 'Test',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('throws on assessment repository findById', async () => {
      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.findById.mockRejectedValueOnce(
        new Error('Assessment DB error'),
      );

      const result = await useCase.execute({
        title: 'Test',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) expect(result.value).toBeInstanceOf(RepositoryError);
    });
  });

  describe('Edge Cases', () => {
    it('minimum title length', async () => {
      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.findById.mockResolvedValueOnce(right({} as Assessment));
      argumentRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        title: 'Min',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe('Min');
      }
    });

    it('maximum title length', async () => {
      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.findById.mockResolvedValueOnce(right({} as Assessment));
      argumentRepo.create.mockResolvedValueOnce(right(undefined));

      const maxTitle = 'A'.repeat(255);
      const result = await useCase.execute({
        title: maxTitle,
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(maxTitle);
      }
    });

    it('unicode characters in title', async () => {
      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.findById.mockResolvedValueOnce(right({} as Assessment));
      argumentRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        title: 'Test 中文 العربية',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe('Test 中文 العربية');
      }
    });

    it('creates argument without assessmentId when not provided', async () => {
      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      argumentRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        title: 'Standalone Argument',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.assessmentId).toBeUndefined();
      }
    });

    it('verifies generated ID is valid UUID', async () => {
      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.findById.mockResolvedValueOnce(right({} as Assessment));
      argumentRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        title: 'Test ID Generation',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { argument } = result.value;
        expect(argument.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
      }
    });

    it('verifies created and updated dates are set', async () => {
      const beforeTest = new Date();
      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.findById.mockResolvedValueOnce(right({} as Assessment));
      argumentRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        title: 'Test Dates',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { argument } = result.value;
        expect(argument.createdAt).toBeInstanceOf(Date);
        expect(argument.updatedAt).toBeInstanceOf(Date);
        expect(argument.createdAt.getTime()).toBeGreaterThanOrEqual(
          beforeTest.getTime(),
        );
        expect(argument.updatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeTest.getTime(),
        );
      }
    });

    it('handles title with mixed whitespace', async () => {
      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.findById.mockResolvedValueOnce(right({} as Assessment));
      argumentRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        title: '  Title  with  spaces  ',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe('  Title  with  spaces  ');
      }
    });

    it('handles title with tabs and newlines', async () => {
      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.findById.mockResolvedValueOnce(right({} as Assessment));
      argumentRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        title: 'Title\twith\ttabs\nand\nnewlines',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(
          'Title\twith\ttabs\nand\nnewlines',
        );
      }
    });
  });

  describe('Concurrency and Race Conditions', () => {
    it('handles simultaneous creation with same title', async () => {
      const req: CreateArgumentRequest = {
        title: 'Concurrent Title',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      };

      // First call succeeds
      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.findById.mockResolvedValueOnce(right({} as Assessment));
      argumentRepo.create.mockResolvedValueOnce(right(undefined));

      const result1 = await useCase.execute(req);
      expect(result1.isRight()).toBe(true);

      // Second call finds duplicate
      const existing = Argument.create({
        title: 'Concurrent Title',
        assessmentId: undefined,
      });
      argumentRepo.findByTitle.mockResolvedValueOnce(right(existing));

      const result2 = await useCase.execute(req);
      expect(result2.isLeft()).toBe(true);
      expect(result2.value).toBeInstanceOf(DuplicateArgumentError);
    });

    it('handles assessment deletion between validation and creation', async () => {
      const req: CreateArgumentRequest = {
        title: 'Test Title',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      };

      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.findById.mockResolvedValueOnce(right({} as Assessment));
      // Assessment gets deleted between validation and creation
      argumentRepo.create.mockResolvedValueOnce(
        left(new Error('Foreign key constraint failed')),
      );

      const result = await useCase.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });
  });

  describe('Domain Behavior Verification', () => {
    it('maintains argument integrity with assessment relationship', async () => {
      const assessmentId = '11111111-1111-1111-1111-111111111111';
      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      assessmentRepo.findById.mockResolvedValueOnce(right({} as Assessment));
      argumentRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        title: 'Test Argument',
        assessmentId,
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { argument } = result.value;
        expect(argument.assessmentId).toBe(assessmentId);
        expect(argument.title).toBe('Test Argument');
      }
    });

    it('maintains argument integrity without assessment relationship', async () => {
      argumentRepo.findByTitle.mockResolvedValueOnce(left(new Error()));
      argumentRepo.create.mockResolvedValueOnce(right(undefined));

      const result = await useCase.execute({
        title: 'Standalone Argument',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const { argument } = result.value;
        expect(argument.assessmentId).toBeUndefined();
        expect(argument.title).toBe('Standalone Argument');
      }
    });

    it('ensures argument title uniqueness across system', async () => {
      const req: CreateArgumentRequest = {
        title: 'Unique Title',
        assessmentId: '11111111-1111-1111-1111-111111111111',
      };

      const existing = Argument.create({
        title: 'Unique Title',
        assessmentId: undefined,
      });

      argumentRepo.findByTitle.mockResolvedValueOnce(right(existing));

      const result = await useCase.execute(req);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(DuplicateArgumentError);
    });
  });
});
