// src/env/env.ts
import { z } from "zod";

const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;

export const envSchema = z.object({
  NODE_ENV:        z.enum(['development', 'production']),
  DATABASE_URL:    z.string().url(),
  NEXT_PUBLIC_URL: z.string().url(),

  JWT_PRIVATE_KEY: z.string()
  .nonempty("JWT_PRIVATE_KEY cannot be empty"),
JWT_PUBLIC_KEY:  z.string()
  .nonempty("JWT_PUBLIC_KEY cannot be empty"),

  PORT:            z.coerce.number().optional().default(3333),

  PANDA_API_KEY: z.string().min(1, 'PANDA_API_KEY is required'),
});

export type Env = z.infer<typeof envSchema>;