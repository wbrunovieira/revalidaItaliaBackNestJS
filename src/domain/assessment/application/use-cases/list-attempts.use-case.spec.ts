// src/domain/assessment/application/use-cases/list-attempts.use-case.spec.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { ListAttemptsUseCase } from './list-attempts.use-case';
import { InMemoryAttemptRepository } from '@/test/repositories/in-memory-attempt-repository';
import { InMemoryAssessmentRepository } from '@/test/repositories/in-memory-assessment-repository';
import { InMemoryAccountRepository } from '@/test/repositories/in-memory-account-repository';
import { Attempt } from '@/domain/assessment/enterprise/entities/attempt.entity';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { User } from '@/domain/auth/enterprise/entities/user.entity';
import { AttemptStatusVO } from '@/domain/assessment/enterprise/value-objects/attempt-status.vo';
import { ScoreVO } from '@/domain/assessment/enterprise/value-objects/score.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { ListAttemptsRequest } from '../dtos/list-attempts-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { UserNotFoundError } from './errors/user-not-found-error';
import { InsufficientPermissionsError } from './errors/insufficient-permissions-error';

let useCase: ListAttemptsUseCase;
let attemptRepository: InMemoryAttemptRepository;
let assessmentRepository: InMemoryAssessmentRepository;
let accountRepository: InMemoryAccountRepository;

describe('ListAttemptsUseCase', () => {
  beforeEach(() => {
    attemptRepository = new InMemoryAttemptRepository();
    assessmentRepository = new InMemoryAssessmentRepository();
    accountRepository = new InMemoryAccountRepository();

    useCase = new ListAttemptsUseCase(
      attemptRepository,
      assessmentRepository,
      accountRepository,
    );
  });

  it('should list attempts successfully for admin user', async () => {
    // Arrange
    const adminUser = User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      cpf: '123.456.789-00',
      role: 'admin',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010'));

    const studentUser = User.create({
      name: 'Student User',
      email: 'student@example.com',
      password: 'password123',
      cpf: '987.654.321-00',
      role: 'student',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440020'));

    const assessment = Assessment.create({
      slug: 'test-assessment',
      title: 'Test Assessment',
      type: 'QUIZ',
      passingScore: 70,
      timeLimitInMinutes: 60,
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440030'));

    const attempt = Attempt.create({
      status: new AttemptStatusVO('SUBMITTED'),
      score: new ScoreVO(85),
      startedAt: new Date('2024-01-01T10:00:00Z'),
      submittedAt: new Date('2024-01-01T11:00:00Z'),
      userId: '550e8400-e29b-41d4-a716-446655440020',
      assessmentId: '550e8400-e29b-41d4-a716-446655440030',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440040'));

    await accountRepository.create(adminUser);
    await accountRepository.create(studentUser);
    await assessmentRepository.create(assessment);
    await attemptRepository.create(attempt);

    const request: ListAttemptsRequest = {
      requesterId: '550e8400-e29b-41d4-a716-446655440010',
      page: 1,
      pageSize: 20,
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const response = result.value;
      expect(response.attempts).toHaveLength(1);
      expect(response.attempts[0].id).toBe('550e8400-e29b-41d4-a716-446655440040');
      expect(response.attempts[0].status).toBe('SUBMITTED');
      expect(response.attempts[0].score).toBe(85);
      expect(response.attempts[0].assessment.title).toBe('Test Assessment');
      expect(response.attempts[0].student.name).toBe('Student User');
    }
  });

  it('should list only own attempts for student user', async () => {
    // Arrange
    const studentUser = User.create({
      name: 'Student User',
      email: 'student@example.com',
      password: 'password123',
      cpf: '987.654.321-00',
      role: 'student',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440020'));

    const otherStudentUser = User.create({
      name: 'Other Student',
      email: 'other@example.com',
      password: 'password123',
      cpf: '111.222.333-44',
      role: 'student',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440021'));

    const assessment = Assessment.create({
      slug: 'test-assessment',
      title: 'Test Assessment',
      type: 'QUIZ',
      passingScore: 70,
      timeLimitInMinutes: 60,
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440030'));

    const studentAttempt = Attempt.create({
      status: new AttemptStatusVO('SUBMITTED'),
      startedAt: new Date('2024-01-01T10:00:00Z'),
      userId: '550e8400-e29b-41d4-a716-446655440020',
      assessmentId: '550e8400-e29b-41d4-a716-446655440030',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440041'));

    const otherAttempt = Attempt.create({
      status: new AttemptStatusVO('SUBMITTED'),
      startedAt: new Date('2024-01-01T10:00:00Z'),
      userId: '550e8400-e29b-41d4-a716-446655440021',
      assessmentId: '550e8400-e29b-41d4-a716-446655440030',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440042'));

    await accountRepository.create(studentUser);
    await accountRepository.create(otherStudentUser);
    await assessmentRepository.create(assessment);
    await attemptRepository.create(studentAttempt);
    await attemptRepository.create(otherAttempt);

    const request: ListAttemptsRequest = {
      requesterId: '550e8400-e29b-41d4-a716-446655440020',
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const response = result.value;
      expect(response.attempts).toHaveLength(1);
      expect(response.attempts[0].id).toBe('550e8400-e29b-41d4-a716-446655440041');
      expect(response.attempts[0].userId).toBe('550e8400-e29b-41d4-a716-446655440020');
    }
  });

  it('should filter attempts by status', async () => {
    // Arrange
    const adminUser = User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      cpf: '123.456.789-00',
      role: 'admin',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010'));

    const studentUser = User.create({
      name: 'Student User',
      email: 'student@example.com',
      password: 'password123',
      cpf: '987.654.321-00',
      role: 'student',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440020'));

    const assessment = Assessment.create({
      slug: 'test-assessment',
      title: 'Test Assessment',
      type: 'QUIZ',
      passingScore: 70,
      timeLimitInMinutes: 60,
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440030'));

    const submittedAttempt = Attempt.create({
      status: new AttemptStatusVO('SUBMITTED'),
      startedAt: new Date('2024-01-01T10:00:00Z'),
      userId: '550e8400-e29b-41d4-a716-446655440020',
      assessmentId: '550e8400-e29b-41d4-a716-446655440030',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440041'));

    const inProgressAttempt = Attempt.create({
      status: new AttemptStatusVO('IN_PROGRESS'),
      startedAt: new Date('2024-01-01T10:00:00Z'),
      userId: '550e8400-e29b-41d4-a716-446655440020',
      assessmentId: '550e8400-e29b-41d4-a716-446655440030',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440042'));

    await accountRepository.create(adminUser);
    await accountRepository.create(studentUser);
    await assessmentRepository.create(assessment);
    await attemptRepository.create(submittedAttempt);
    await attemptRepository.create(inProgressAttempt);

    const request: ListAttemptsRequest = {
      requesterId: '550e8400-e29b-41d4-a716-446655440010',
      status: 'SUBMITTED',
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const response = result.value;
      expect(response.attempts).toHaveLength(1);
      expect(response.attempts[0].status).toBe('SUBMITTED');
    }
  });

  it('should return error for invalid input', async () => {
    // Arrange
    const request = {
      requesterId: 'invalid-id', // Not a valid UUID
    } as ListAttemptsRequest;

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
  });

  it('should return error for non-existent requester', async () => {
    // Arrange
    const request: ListAttemptsRequest = {
      requesterId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID but non-existent
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(UserNotFoundError);
  });

  it('should return error when student tries to access other user attempts', async () => {
    // Arrange
    const studentUser = User.create({
      name: 'Student User',
      email: 'student@example.com',
      password: 'password123',
      cpf: '987.654.321-00',
      role: 'student',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440020'));

    await accountRepository.create(studentUser);

    const request: ListAttemptsRequest = {
      requesterId: '550e8400-e29b-41d4-a716-446655440020',
      userId: '550e8400-e29b-41d4-a716-446655440001', // Trying to access other user's attempts
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InsufficientPermissionsError);
  });

  it('should return empty list when no attempts found', async () => {
    // Arrange
    const adminUser = User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      cpf: '123.456.789-00',
      role: 'admin',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010'));

    await accountRepository.create(adminUser);

    const request: ListAttemptsRequest = {
      requesterId: '550e8400-e29b-41d4-a716-446655440010',
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const response = result.value;
      expect(response.attempts).toHaveLength(0);
      expect(response.pagination.total).toBe(0);
    }
  });
});