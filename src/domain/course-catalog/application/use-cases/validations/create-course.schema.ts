// src/domain/course-catalog/application/validation/create-course.schema.ts
import { z } from "zod"

export const createCourseSchema = z.object({
  title: z.string().min(3, "Course title must be at least 3 characters long"),
  description: z.string().min(5, "Course description must be at least 5 characters long"),
  modules: z
    .array(
      z.object({
        title: z.string().min(1, "Module title cannot be empty"),
        order: z.number().int("Order must be an integer").positive("Order must be a positive number"),
      })
    )
    .optional(),
})

export type CreateCourseSchema = z.infer<typeof createCourseSchema>