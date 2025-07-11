//src/domain/assessment/application/use-cases/update-argument.use-case.spec.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { left, right } from '@/core/either';
import { UpdateArgumentUseCase } from './update-argument.use-case';
import { IArgumentRepository } from '../repositories/i-argument-repository';
import { Argument } from '@/domain/assessment/enterprise/entities/argument.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { InvalidInputError } from './errors/invalid-input-error';
import { ArgumentNotFoundError } from './errors/argument-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { DuplicateArgumentError } from './errors/duplicate-argument-error';

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

// Helper function to create test argument entities
function createTestArgument(props: { title: string; id?: string }) {
  return Argument.create(
    { title: props.title },
    new UniqueEntityID(props.id || '11111111-1111-1111-1111-111111111111'),
  );
}

// Helper function to create mock repository error
function createMockRepositoryError(message: string = 'Repository error') {
  const error = new Error(message);
  error.name = 'RepositoryError';
  return error;
}

describe('UpdateArgumentUseCase', () => {
  let repository: MockArgumentRepository;
  let useCase: UpdateArgumentUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new MockArgumentRepository();
    useCase = new UpdateArgumentUseCase(repository);
  });

  describe('✅ Success Cases', () => {
    it('should update argument title successfully', async () => {
      const argumentId = '11111111-1111-1111-1111-111111111111';
      const argument = createTestArgument({ title: 'Old Title', id: argumentId });

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(right(undefined));

      const result = await useCase.execute({
        id: argumentId,
        title: 'New Title',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe('New Title');
        expect(repository.update).toHaveBeenCalledWith(argument);
      }
    });

    it('should handle update with only id (no title change)', async () => {
      const argumentId = '11111111-1111-1111-1111-111111111111';
      const argument = createTestArgument({ title: 'Original Title', id: argumentId });

      repository.findById.mockResolvedValue(right(argument));
      repository.update.mockResolvedValue(right(undefined));

      const result = await useCase.execute({ id: argumentId });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe('Original Title');
      }
    });

    it('should trim title before updating', async () => {
      const argumentId = '11111111-1111-1111-1111-111111111111';
      const argument = createTestArgument({ title: 'Old Title', id: argumentId });

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(right(undefined));

      const result = await useCase.execute({
        id: argumentId,
        title: '  New Title  ',
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe('New Title');
      }
    });

    it('should handle title with special characters', async () => {
      const argumentId = '11111111-1111-1111-1111-111111111111';
      const argument = createTestArgument({ title: 'Old Title', id: argumentId });
      const specialTitle = 'Title with émojis 🎯 and speciál chars!';

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(right(undefined));

      const result = await useCase.execute({
        id: argumentId,
        title: specialTitle,
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(specialTitle);
      }
    });

    it('should handle maximum length title', async () => {
      const argumentId = '11111111-1111-1111-1111-111111111111';
      const argument = createTestArgument({ title: 'Old Title', id: argumentId });
      const maxTitle = 'A'.repeat(255);

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(right(undefined));

      const result = await useCase.execute({
        id: argumentId,
        title: maxTitle,
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(maxTitle);
      }
    });

    it('should handle minimum length title', async () => {
      const argumentId = '11111111-1111-1111-1111-111111111111';
      const argument = createTestArgument({ title: 'Old Title', id: argumentId });
      const minTitle = 'ABC';

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(right(undefined));

      const result = await useCase.execute({
        id: argumentId,
        title: minTitle,
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(minTitle);
      }
    });
  });

  describe('❌ Validation Error Tests', () => {
    describe('UUID Validation Errors', () => {
      it('should return InvalidInputError for invalid UUID format', async () => {
        const result = await useCase.execute({ id: 'invalid-uuid' });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for empty string UUID', async () => {
        const result = await useCase.execute({ id: '' });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for UUID with spaces', async () => {
        const result = await useCase.execute({ id: '   ' });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for non-string UUID (number)', async () => {
        const result = await useCase.execute({ id: 123 as any });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for non-string UUID (object)', async () => {
        const result = await useCase.execute({ id: {} as any });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for non-string UUID (array)', async () => {
        const result = await useCase.execute({ id: [] as any });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for UUID with special characters', async () => {
        const result = await useCase.execute({ id: '11111111-1111-1111-1111-11111111111@' });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for UUID without hyphens', async () => {
        const result = await useCase.execute({ id: '111111111111111111111111111111111111' });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for UUID with wrong hyphen positions', async () => {
        const result = await useCase.execute({ id: '1111111-11111-111-11111-111111111111' });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for UUID too short', async () => {
        const result = await useCase.execute({ id: '11111111-1111-1111-1111-11111111111' });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for UUID too long', async () => {
        const result = await useCase.execute({ id: '11111111-1111-1111-1111-111111111111-extra' });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for UUID with Unicode characters', async () => {
        const result = await useCase.execute({ id: '11111111-1111-1111-1111-11111111111α' });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for null UUID', async () => {
        const result = await useCase.execute({ id: null as any });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for undefined UUID', async () => {
        const result = await useCase.execute({ id: undefined as any });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });
    });

    describe('Title Validation Errors', () => {
      const validId = '11111111-1111-1111-1111-111111111111';

      it('should return InvalidInputError for title too short', async () => {
        const result = await useCase.execute({ id: validId, title: 'AB' });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for title too long', async () => {
        const result = await useCase.execute({ id: validId, title: 'A'.repeat(256) });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for empty title', async () => {
        const result = await useCase.execute({ id: validId, title: '' });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.isLeft()) {
          expect(result.value.message).toBe('Validation failed');
        }
      });

      it('should return InvalidInputError for title with only spaces (schema validation)', async () => {
        const result = await useCase.execute({ id: validId, title: '  ' });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.isLeft()) {
          expect(result.value.message).toBe('Validation failed');
        }
      });

      it('should return InvalidInputError for title that becomes empty after trimming (business logic)', async () => {
        const argument = createTestArgument({ title: 'Old Title', id: validId });
        repository.findById.mockResolvedValue(right(argument));

        // Title passes schema validation (5 chars meets min 3) but becomes empty after trim
        const result = await useCase.execute({ id: validId, title: '     ' });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.isLeft() && result.value instanceof InvalidInputError) {
          expect(result.value.message).toBe('Validation failed');
          expect(result.value.details).toContain('title: Title cannot be empty');
        }
      });

      it('should return InvalidInputError for non-string title (number)', async () => {
        const result = await useCase.execute({ id: validId, title: 123 as any });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for non-string title (object)', async () => {
        const result = await useCase.execute({ id: validId, title: {} as any });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for non-string title (array)', async () => {
        const result = await useCase.execute({ id: validId, title: [] as any });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });

      it('should return InvalidInputError for null title', async () => {
        const result = await useCase.execute({ id: validId, title: null as any });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });
    });

    describe('Multiple Validation Errors', () => {
      it('should return InvalidInputError for multiple invalid fields', async () => {
        const result = await useCase.execute({ id: 'invalid', title: 'AB' });
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
        if (result.isLeft() && result.value instanceof InvalidInputError) {
          expect(result.value.details.length).toBeGreaterThan(1);
        }
      });

      it('should return InvalidInputError for missing required id field', async () => {
        const result = await useCase.execute({} as any);
        expect(result.isLeft()).toBe(true);
        expect(result.value).toBeInstanceOf(InvalidInputError);
      });
    });
  });

  describe('🔍 Business Logic Error Tests', () => {
    const validId = '11111111-1111-1111-1111-111111111111';

    it('should return ArgumentNotFoundError when argument does not exist', async () => {
      repository.findById.mockResolvedValue(left(new Error('not found')));
      const result = await useCase.execute({
        id: validId,
        title: 'Any',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ArgumentNotFoundError);
    });

    it('should return ArgumentNotFoundError when findById returns repository error', async () => {
      repository.findById.mockResolvedValue(left(createMockRepositoryError('Database connection failed')));
      const result = await useCase.execute({
        id: validId,
        title: 'Any Title',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ArgumentNotFoundError);
    });

    it('should return ArgumentNotFoundError for non-existent UUID', async () => {
      repository.findById.mockResolvedValue(left(new Error('Record not found')));
      const result = await useCase.execute({
        id: '00000000-0000-0000-0000-000000000000',
        title: 'Test Title',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ArgumentNotFoundError);
    });
  });

  describe('🚫 Duplicate Error Tests', () => {
    const argumentId = '11111111-1111-1111-1111-111111111111';
    const otherId = '22222222-2222-2222-2222-222222222222';

    it('should return DuplicateArgumentError if title already exists for different argument', async () => {
      const existing = createTestArgument({ title: 'Old', id: argumentId });
      const other = createTestArgument({ title: 'New Title', id: otherId });

      repository.findById.mockResolvedValue(right(existing));
      repository.findByTitle.mockResolvedValue(right(other));

      const result = await useCase.execute({
        id: argumentId,
        title: 'New Title',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(DuplicateArgumentError);
    });

    it('should allow updating to same title (same argument)', async () => {
      const existing = createTestArgument({ title: 'Same Title', id: argumentId });

      repository.findById.mockResolvedValue(right(existing));
      repository.findByTitle.mockResolvedValue(right(existing));
      repository.update.mockResolvedValue(right(undefined));

      const result = await useCase.execute({
        id: argumentId,
        title: 'Same Title',
      });
      expect(result.isRight()).toBe(true);
    });

    it('should return DuplicateArgumentError for trimmed title that matches existing', async () => {
      const existing = createTestArgument({ title: 'Old', id: argumentId });
      const other = createTestArgument({ title: 'Duplicate Title', id: otherId });

      repository.findById.mockResolvedValue(right(existing));
      repository.findByTitle.mockResolvedValue(right(other));

      const result = await useCase.execute({
        id: argumentId,
        title: '  Duplicate Title  ',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(DuplicateArgumentError);
    });

    it('should handle case sensitivity in duplicate detection', async () => {
      const existing = createTestArgument({ title: 'Old', id: argumentId });
      const other = createTestArgument({ title: 'Case Sensitive', id: otherId });

      repository.findById.mockResolvedValue(right(existing));
      repository.findByTitle.mockResolvedValue(right(other));

      const result = await useCase.execute({
        id: argumentId,
        title: 'Case Sensitive',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(DuplicateArgumentError);
    });
  });

  describe('💾 Repository Error Tests', () => {
    const argumentId = '11111111-1111-1111-1111-111111111111';

    it('should return RepositoryError on update failure', async () => {
      const argument = createTestArgument({ title: 'Title', id: argumentId });

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(left(new Error('Update failed')));

      const result = await useCase.execute({ id: argumentId, title: 'New Title' });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Update failed');
      }
    });

    it('should handle database connection timeout during update', async () => {
      const argument = createTestArgument({ title: 'Title', id: argumentId });

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(left(createMockRepositoryError('Connection timeout')));

      const result = await useCase.execute({ id: argumentId, title: 'New Title' });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Connection timeout');
      }
    });

    it('should handle database constraint violation during update', async () => {
      const argument = createTestArgument({ title: 'Title', id: argumentId });

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(left(createMockRepositoryError('Constraint violation')));

      const result = await useCase.execute({ id: argumentId, title: 'New Title' });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Constraint violation');
      }
    });

    it('should handle repository error during findByTitle check', async () => {
      const argument = createTestArgument({ title: 'Title', id: argumentId });

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockRejectedValue(createMockRepositoryError('Database error'));

      const result = await useCase.execute({ id: argumentId, title: 'New Title' });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('should handle repository throwing unexpected error', async () => {
      const argument = createTestArgument({ title: 'Title', id: argumentId });

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockRejectedValue(new TypeError('Unexpected error'));

      const result = await useCase.execute({ id: argumentId, title: 'New Title' });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('should handle repository throwing non-Error object', async () => {
      const argument = createTestArgument({ title: 'Title', id: argumentId });

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockRejectedValue('String error');

      const result = await useCase.execute({ id: argumentId, title: 'New Title' });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.isLeft()) {
        expect(result.value.message).toBe('An unexpected error occurred');
      }
    });

    it('should handle promise rejection in findById', async () => {
      repository.findById.mockRejectedValue(createMockRepositoryError('Database connection lost'));

      const result = await useCase.execute({ id: argumentId, title: 'New Title' });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('should handle transaction rollback scenario', async () => {
      const argument = createTestArgument({ title: 'Title', id: argumentId });

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(left(createMockRepositoryError('Transaction rolled back')));

      const result = await useCase.execute({ id: argumentId, title: 'New Title' });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Transaction rolled back');
      }
    });
  });

  describe('🎯 Edge Cases and Complex Scenarios', () => {
    const argumentId = '11111111-1111-1111-1111-111111111111';

    it('should handle concurrent update attempts', async () => {
      const argument = createTestArgument({ title: 'Original', id: argumentId });

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(right(undefined));

      const promises = [
        useCase.execute({ id: argumentId, title: 'Concurrent 1' }),
        useCase.execute({ id: argumentId, title: 'Concurrent 2' }),
      ];

      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result.isRight()).toBe(true);
      });
    });

    it('should handle update with unicode characters in title', async () => {
      const argument = createTestArgument({ title: 'Original', id: argumentId });
      const unicodeTitle = 'Título com acentos é çàràctërs ünïcödë 中文 العربية';

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(right(undefined));

      const result = await useCase.execute({ id: argumentId, title: unicodeTitle });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(unicodeTitle);
      }
    });

    it('should handle title with only emoji characters', async () => {
      const argument = createTestArgument({ title: 'Original', id: argumentId });
      const emojiTitle = '🎯🚀💯';

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(right(undefined));

      const result = await useCase.execute({ id: argumentId, title: emojiTitle });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(emojiTitle);
      }
    });

    it('should handle title with mixed whitespace characters', async () => {
      const argument = createTestArgument({ title: 'Original', id: argumentId });
      const mixedSpaceTitle = '\t\n  Title with mixed spaces  \r\n';
      const expectedTitle = 'Title with mixed spaces';

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(right(undefined));

      const result = await useCase.execute({ id: argumentId, title: mixedSpaceTitle });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(expectedTitle);
      }
    });

    it('should handle rapid consecutive updates', async () => {
      const argument = createTestArgument({ title: 'Original', id: argumentId });

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(right(undefined));

      const results: Array<Awaited<ReturnType<typeof useCase.execute>>> = [];
      for (let i = 0; i < 5; i++) {
        results.push(await useCase.execute({ id: argumentId, title: `Title ${i}` }));
      }

      results.forEach(result => {
        expect(result.isRight()).toBe(true);
      });
    });

    it('should handle update with null-like title string', async () => {
      const argument = createTestArgument({ title: 'Original', id: argumentId });

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(right(undefined));

      const result = await useCase.execute({ id: argumentId, title: 'null' });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe('null');
      }
    });

    it('should handle update with numeric-like title string', async () => {
      const argument = createTestArgument({ title: 'Original', id: argumentId });
      const numericTitle = '123456789';

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(right(undefined));

      const result = await useCase.execute({ id: argumentId, title: numericTitle });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.title).toBe(numericTitle);
      }
    });

    it('should preserve argument entity state during updates', async () => {
      const argument = createTestArgument({ title: 'Original', id: argumentId });
      const originalCreatedAt = argument.createdAt;

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(right(undefined));

      const result = await useCase.execute({ id: argumentId, title: 'Updated Title' });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument.createdAt).toEqual(originalCreatedAt);
        expect(result.value.argument.updatedAt).toBeInstanceOf(Date);
        expect(result.value.argument.id.toString()).toBe(argumentId);
      }
    });

    it('should handle data immutability correctly', async () => {
      const argument = createTestArgument({ title: 'Original', id: argumentId });
      const originalArgument = { ...argument };

      repository.findById.mockResolvedValue(right(argument));
      repository.findByTitle.mockResolvedValue(left(new Error()));
      repository.update.mockResolvedValue(right(undefined));

      const result = await useCase.execute({ id: argumentId, title: 'Updated Title' });
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.argument).not.toBe(originalArgument);
        expect(result.value.argument.title).toBe('Updated Title');
      }
    });
  });

  describe('📊 Complex Error Combinations', () => {
    const argumentId = '11111111-1111-1111-1111-111111111111';

    it('should prioritize validation errors over business logic errors', async () => {
      const result = await useCase.execute({ id: 'invalid-uuid', title: 'AB' });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should handle validation error with repository setup', async () => {
      repository.findById.mockResolvedValue(right(createTestArgument({ title: 'Any' })));
      repository.findByTitle.mockResolvedValue(left(new Error()));

      const result = await useCase.execute({ id: 'invalid', title: 'Valid Title' });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
      // Repository methods should not be called for validation errors
      expect(repository.findById).not.toHaveBeenCalled();
    });

    it('should handle error precedence correctly', async () => {
      // Validation error should take precedence over any repository setup
      repository.findById.mockRejectedValue(new Error('Should not reach here'));
      repository.findByTitle.mockRejectedValue(new Error('Should not reach here'));
      repository.update.mockRejectedValue(new Error('Should not reach here'));

      const result = await useCase.execute({ id: '', title: '' });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should handle multiple error types in sequence', async () => {
      const argument = createTestArgument({ title: 'Original', id: argumentId });

      // First call: success
      repository.findById.mockResolvedValueOnce(right(argument));
      repository.findByTitle.mockResolvedValueOnce(left(new Error()));
      repository.update.mockResolvedValueOnce(right(undefined));

      // Second call: argument not found
      repository.findById.mockResolvedValueOnce(left(new Error('Not found')));

      // Third call: duplicate error
      const otherArgument = createTestArgument({ title: 'Other', id: '22222222-2222-2222-2222-222222222222' });
      repository.findById.mockResolvedValueOnce(right(argument));
      repository.findByTitle.mockResolvedValueOnce(right(otherArgument));

      const results = [
        await useCase.execute({ id: argumentId, title: 'Success Update' }),
        await useCase.execute({ id: argumentId, title: 'Not Found Update' }),
        await useCase.execute({ id: argumentId, title: 'Other' }),
      ];

      expect(results[0].isRight()).toBe(true);
      expect(results[1].isLeft() && results[1].value).toBeInstanceOf(ArgumentNotFoundError);
      expect(results[2].isLeft() && results[2].value).toBeInstanceOf(DuplicateArgumentError);
    });
  });
});
