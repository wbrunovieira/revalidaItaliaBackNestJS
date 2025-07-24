import { z } from 'zod';

export const saveLessonProgressSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  lessonId: z.string().uuid('Lesson ID must be a valid UUID'),
  lessonTitle: z.string().min(1, 'Lesson title is required'),
  courseId: z.string().uuid('Course ID must be a valid UUID'),
  courseTitle: z.string().min(1, 'Course title is required'),
  courseSlug: z.string().min(1, 'Course slug is required'),
  moduleId: z.string().uuid('Module ID must be a valid UUID'),
  moduleTitle: z.string().min(1, 'Module title is required'),
  moduleSlug: z.string().min(1, 'Module slug is required'),
  lessonImageUrl: z.string().url('Lesson image URL must be a valid URL'),
  videoProgress: z.object({
    currentTime: z.number().min(0, 'Current time must be non-negative'),
    duration: z.number().positive('Duration must be positive'),
    percentage: z
      .number()
      .min(0)
      .max(100, 'Percentage must be between 0 and 100'),
  }),
});
