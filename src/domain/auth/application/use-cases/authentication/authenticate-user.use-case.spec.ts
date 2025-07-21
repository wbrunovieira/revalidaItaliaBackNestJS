// src/domain/auth/application/use-cases/authenticate-user.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hash } from 'bcryptjs';
import { left, right } from '@/core/either';
import { InMemoryAccountRepository } from '@/test/repositories/in-memory-account-repository';
import { AuthenticateUserUseCase } from './authenticate-user.use-case';
import { AuthenticationError } from './errors/authentication-error';
import { User } from '@/domain/auth/enterprise/entities/user.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

describe('AuthenticateUserUseCase', () => {
  let repo: InMemoryAccountRepository;
  let sut: AuthenticateUserUseCase;
  let fakeUser: User;
  const plain = 'correcthorsebatterystaple';
  const dto = { email: 'test@example.com', password: plain };

  beforeEach(async () => {
    repo = new InMemoryAccountRepository();
    sut = new AuthenticateUserUseCase(repo);

    const pwdHash = await hash(plain, 8);
    fakeUser = User.create(
      {
        name: 'Test',
        email: dto.email,
        cpf: '00000000000',
        password: pwdHash,
        role: 'student',
      },
      new UniqueEntityID(),
    );
  });

  it('succeeds with correct credentials', async () => {
    vi.spyOn(repo, 'findByEmail').mockResolvedValueOnce(right(fakeUser));
    const result = await sut.execute(dto);
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.user.email).toBe(dto.email);
    }
  });

  it('fails on invalid email format', async () => {
    const bad = await sut.execute({ email: 'foo@', password: '123456' });
    expect(bad.isLeft()).toBe(true);
    if (bad.isLeft()) expect(bad.value).toBeInstanceOf(AuthenticationError);
  });

  it('fails when repository returns Left', async () => {
    vi.spyOn(repo, 'findByEmail').mockResolvedValueOnce(
      left(new Error('DB down')),
    );
    const res = await sut.execute(dto);
    expect(res.isLeft()).toBe(true);
    if (res.isLeft()) expect(res.value).toBeInstanceOf(AuthenticationError);
  });

  it('fails when password does not match', async () => {
    vi.spyOn(repo, 'findByEmail').mockResolvedValueOnce(right(fakeUser));
    const res = await sut.execute({ ...dto, password: 'wrongpass' });
    expect(res.isLeft()).toBe(true);
    if (res.isLeft()) expect(res.value).toBeInstanceOf(AuthenticationError);
  });

  it('fails when user not found', async () => {
    vi.spyOn(repo, 'findByEmail').mockResolvedValueOnce(
      left(new Error('Not found')),
    );
    const res = await sut.execute(dto);
    expect(res.isLeft()).toBe(true);
    if (res.isLeft()) expect(res.value).toBeInstanceOf(AuthenticationError);
  });
});
