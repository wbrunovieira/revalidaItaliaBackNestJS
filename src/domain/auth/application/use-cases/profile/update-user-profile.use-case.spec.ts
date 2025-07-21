// src/domain/auth/application/use-cases/update-user-profile.use-case.spec.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateUserProfileUseCase } from './update-user-profile.use-case';
import { InMemoryAccountRepository } from '@/test/repositories/in-memory-account-repository';
import { User } from '@/domain/auth/enterprise/entities/user.entity';
import { InvalidInputError } from './errors/invalid-input-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { DuplicateEmailError } from './errors/duplicate-email-error';
import { DuplicateCPFError } from './errors/duplicate-cpf-error';

describe('UpdateUserProfileUseCase', () => {
  let sut: UpdateUserProfileUseCase;
  let accountRepository: InMemoryAccountRepository;

  beforeEach(() => {
    accountRepository = new InMemoryAccountRepository();
    sut = new UpdateUserProfileUseCase(accountRepository);
  });

  it('should update user profile successfully with all fields', async () => {
    // Arrange
    const user = User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword123',
      cpf: '12345678901',
      role: 'student',
    });
    
    await accountRepository.create(user);

    const newBirthDate = new Date('1990-01-01');

    // Act
    const result = await sut.execute({
      userId: user.id.toString(),
      name: 'John Updated',
      email: 'john.updated@example.com',
      cpf: '98765432101',
      phone: '+1234567890',
      birthDate: newBirthDate,
      profileImageUrl: '/images/profile.jpg',
    });

    // Assert
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.user.name).toBe('John Updated');
      expect(result.value.user.email).toBe('john.updated@example.com');
      expect(result.value.user.cpf).toBe('98765432101');
      expect(result.value.user.phone).toBe('+1234567890');
      expect(result.value.user.birthDate).toEqual(newBirthDate);
      expect(result.value.user.profileImageUrl).toBe('/images/profile.jpg');
      expect(result.value.user).not.toHaveProperty('password');
    }
  });

  it('should update user profile with partial fields', async () => {
    // Arrange
    const user = User.create({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'hashedPassword123',
      cpf: '11111111111',
      role: 'student',
    });
    
    await accountRepository.create(user);

    // Act
    const result = await sut.execute({
      userId: user.id.toString(),
      name: 'Jane Updated',
      phone: '+9876543210',
    });

    // Assert
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.user.name).toBe('Jane Updated');
      expect(result.value.user.email).toBe('jane@example.com'); // unchanged
      expect(result.value.user.cpf).toBe('11111111111'); // unchanged
      expect(result.value.user.phone).toBe('+9876543210');
    }
  });

  it('should fail when no fields are provided for update', async () => {
    // Arrange
    const user = User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword123',
      cpf: '22222222222',
      role: 'student',
    });
    
    await accountRepository.create(user);

    // Act
    const result = await sut.execute({
      userId: user.id.toString(),
    });

    // Assert
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
      expect(result.value.message).toContain('Pelo menos um campo deve ser fornecido');
    }
  });

  it('should fail when userId is invalid UUID', async () => {
    // Act
    const result = await sut.execute({
      userId: 'invalid-uuid',
      name: 'New Name',
    });

    // Assert
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
      expect(result.value.message).toContain('ID do usuário deve ser um UUID válido');
    }
  });

  it('should fail when user is not found', async () => {
    // Act
    const result = await sut.execute({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'New Name',
    });

    // Assert
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
      expect(result.value.message).toBe('User not found');
    }
  });

  it('should fail when email is already in use by another user', async () => {
    // Arrange
    const user1 = User.create({
      name: 'User 1',
      email: 'user1@example.com',
      password: 'password123',
      cpf: '33333333333',
      role: 'student',
    });
    
    const user2 = User.create({
      name: 'User 2',
      email: 'user2@example.com',
      password: 'password123',
      cpf: '44444444444',
      role: 'student',
    });
    
    await accountRepository.create(user1);
    await accountRepository.create(user2);

    // Act
    const result = await sut.execute({
      userId: user1.id.toString(),
      email: 'user2@example.com', // trying to use user2's email
    });

    // Assert
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DuplicateEmailError);
    }
  });

  it('should fail when CPF is already in use by another user', async () => {
    // Arrange
    const user1 = User.create({
      name: 'User 1',
      email: 'user1@example.com',
      password: 'password123',
      cpf: '55555555555',
      role: 'student',
    });
    
    const user2 = User.create({
      name: 'User 2',
      email: 'user2@example.com',
      password: 'password123',
      cpf: '66666666666',
      role: 'student',
    });
    
    await accountRepository.create(user1);
    await accountRepository.create(user2);

    // Act
    const result = await sut.execute({
      userId: user1.id.toString(),
      cpf: '66666666666', // trying to use user2's CPF
    });

    // Assert
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DuplicateCPFError);
    }
  });

  it('should allow user to keep their own email when updating other fields', async () => {
    // Arrange
    const user = User.create({
      name: 'Same Email User',
      email: 'same@example.com',
      password: 'password123',
      cpf: '77777777777',
      role: 'student',
    });
    
    await accountRepository.create(user);

    // Act
    const result = await sut.execute({
      userId: user.id.toString(),
      email: 'same@example.com', // same email
      name: 'Updated Name',
    });

    // Assert
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.user.email).toBe('same@example.com');
      expect(result.value.user.name).toBe('Updated Name');
    }
  });

  it('should allow user to keep their own CPF when updating other fields', async () => {
    // Arrange
    const user = User.create({
      name: 'Same CPF User',
      email: 'samecpf@example.com',
      password: 'password123',
      cpf: '88888888888',
      role: 'student',
    });
    
    await accountRepository.create(user);

    // Act
    const result = await sut.execute({
      userId: user.id.toString(),
      cpf: '88888888888', // same CPF
      name: 'Updated Name',
    });

    // Assert
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.user.cpf).toBe('88888888888');
      expect(result.value.user.name).toBe('Updated Name');
    }
  });

  it('should validate email format', async () => {
    // Arrange
    const user = User.create({
      name: 'Email Test User',
      email: 'valid@example.com',
      password: 'password123',
      cpf: '99999999999',
      role: 'student',
    });
    
    await accountRepository.create(user);

    // Act
    const result = await sut.execute({
      userId: user.id.toString(),
      email: 'invalid-email',
    });

    // Assert
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
      expect(result.value.message).toContain('Email inválido');
    }
  });

  it('should validate CPF format', async () => {
    // Arrange
    const user = User.create({
      name: 'CPF Test User',
      email: 'cpftest@example.com',
      password: 'password123',
      cpf: '00000000000',
      role: 'student',
    });
    
    await accountRepository.create(user);

    // Act
    const result = await sut.execute({
      userId: user.id.toString(),
      cpf: '123', // invalid CPF
    });

    // Assert
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
      expect(result.value.message).toContain('CPF deve conter 11 dígitos numéricos');
    }
  });

  it('should validate name length', async () => {
    // Arrange
    const user = User.create({
      name: 'Name Test User',
      email: 'nametest@example.com',
      password: 'password123',
      cpf: '12312312312',
      role: 'student',
    });
    
    await accountRepository.create(user);

    // Act
    const result = await sut.execute({
      userId: user.id.toString(),
      name: 'AB', // too short
    });

    // Assert
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
      expect(result.value.message).toContain('Nome deve ter no mínimo 3 caracteres');
    }
  });

  it('should validate profileImageUrl format', async () => {
    // Arrange
    const user = User.create({
      name: 'Image Test User',
      email: 'imagetest@example.com',
      password: 'password123',
      cpf: '45645645645',
      role: 'student',
    });
    
    await accountRepository.create(user);

    // Act - invalid URL
    const result = await sut.execute({
      userId: user.id.toString(),
      profileImageUrl: 'invalid-url',
    });

    // Assert
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidInputError);
      expect(result.value.message).toContain('URL da imagem deve ser uma URL válida');
    }
  });

  it('should accept valid profileImageUrl formats', async () => {
    // Arrange
    const user = User.create({
      name: 'Image Test User',
      email: 'imagetest2@example.com',
      password: 'password123',
      cpf: '78978978978',
      role: 'student',
    });
    
    await accountRepository.create(user);

    // Test different valid formats
    const validUrls = [
      'https://example.com/image.jpg',
      'http://example.com/image.png',
      '/images/profile.jpg',
      '/static/avatars/user1.png',
    ];

    for (const url of validUrls) {
      // Act
      const result = await sut.execute({
        userId: user.id.toString(),
        profileImageUrl: url,
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.user.profileImageUrl).toBe(url);
      }
    }
  });

  it('should handle birthDate correctly', async () => {
    // Arrange
    const user = User.create({
      name: 'BirthDate Test User',
      email: 'birthtest@example.com',
      password: 'password123',
      cpf: '32132132132',
      role: 'student',
    });
    
    await accountRepository.create(user);

    const birthDate = new Date('1995-05-15');

    // Act
    const result = await sut.execute({
      userId: user.id.toString(),
      birthDate: birthDate,
    });

    // Assert
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.user.birthDate).toEqual(birthDate);
    }
  });
});