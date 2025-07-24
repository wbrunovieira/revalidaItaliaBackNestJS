import { registerAs } from '@nestjs/config';

export const cryptoConfig = registerAs('crypto', () => ({
  saltRounds: parseInt(process.env.SALT_ROUNDS || '10', 10),
  algorithm: process.env.HASH_ALGORITHM || 'bcrypt',
}));

export type CryptoConfig = ReturnType<typeof cryptoConfig>;
