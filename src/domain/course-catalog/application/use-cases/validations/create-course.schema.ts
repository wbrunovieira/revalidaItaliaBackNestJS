// src/domain/course-catalog/application/validations/create-course.schema.ts

import { z } from "zod";

const translationSchema = z.object({
  locale: z.enum(["pt", "it", "es"]),
  title: z.string().min(3, "Course title must be at least 3 characters long"),
  description: z
    .string()
    .min(5, "Course description must be at least 5 characters long"),
});

const moduleSchema = z
  .object({
    translations: z
      .array(translationSchema)
      .min(1, "Each module needs at least one translation")
      .superRefine((arr, ctx) => {
        if (!arr.some((t) => t.locale === "pt")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Each module needs a Portuguese translation",
            path: ["translations"],
          });
        }
        const locales = arr.map((t) => t.locale);
        if (new Set(locales).size !== locales.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Locale duplicado em módulo",
            path: ["translations"],
          });
        }
      }),
    order: z
      .number()
      .int("Order must be an integer")
      .positive("Order must be a positive number"),
  })
  .superRefine(() => {

  });

export const createCourseSchema = z
  .object({
    translations: z
      .array(translationSchema)
      .min(1, "At least one translation is required")
      .superRefine((arr, ctx) => {
        if (!arr.some((t) => t.locale === "pt")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "At least a Portuguese translation is required",
            path: ["translations"],
          });
        }
        const locales = arr.map((t) => t.locale);
        if (new Set(locales).size !== locales.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Locale duplicado em traduções",
            path: ["translations"],
          });
        }
      }),
    modules: z
      .array(moduleSchema)
      .optional()
      .superRefine((mods, ctx) => {
        if (!mods) return;
        const orders = mods.map((m) => m.order);
        if (new Set(orders).size !== orders.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Module orders must be unique",
            path: ["modules"],
          });
        }
      }),
  })
  .strict();

export type CreateCourseSchema = z.infer<typeof createCourseSchema>;