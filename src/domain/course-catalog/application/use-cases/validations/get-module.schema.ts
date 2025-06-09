// src/domain/course-catalog/application/validations/get-module.schema.ts
import { z } from "zod";

export const getModuleSchema = z
  .object({
    moduleId: z.string().uuid("Module ID must be a valid UUID"),
  })
  .strict();

export type GetModuleSchema = z.infer<typeof getModuleSchema>;