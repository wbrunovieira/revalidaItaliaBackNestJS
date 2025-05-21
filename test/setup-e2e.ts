// test/setup-e2e.ts
/// <reference types="vitest" />

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { spawnSync } from "child_process";

const prisma = new PrismaClient();
const schemaId = randomUUID();

function makeTestDatabaseUrl() {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("DATABASE_URL must be set");
  const u = new URL(base);
  u.searchParams.set("schema", schemaId);
  return u.toString();
}

beforeAll(async () => {
  process.env.DATABASE_URL = makeTestDatabaseUrl();

  // apply migrations into the new schema
  const m = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: process.env,
  });
  if (m.status !== 0) throw new Error("Prisma migrate failed");
});

afterAll(async () => {
  // drop the whole schema
  try {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`);
  } catch (e) {
    console.error("Failed to drop test schema", e);
  }
  await prisma.$disconnect();
});