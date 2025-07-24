// src/infra/filters/error-mappings/course-catalog.mappings.ts
import { HttpStatus } from '@nestjs/common';
import {
  ErrorMapping,
  createNotFoundMapping,
  createDuplicateMapping,
  createBusinessRuleMapping,
} from './shared.mappings';

/**
 * Error mappings for course-catalog domain
 * Maps domain-specific errors to HTTP responses
 *
 * Note: These mappings work with both old error classes (in use-cases/errors)
 * and new domain exceptions (in domain/exceptions)
 */
export const courseCatalogErrorMappings: Record<string, ErrorMapping> = {
  // Course errors
  CourseNotFoundError: createNotFoundMapping('course'),
  DuplicateCourseError: createDuplicateMapping('course'),
  CourseHasDependenciesError: createBusinessRuleMapping(
    'course-has-dependencies',
    'Cannot delete course with existing modules or enrollments',
  ),

  // Module errors
  ModuleNotFoundError: createNotFoundMapping('module'),
  DuplicateModuleError: createDuplicateMapping('module'),
  ModuleHasDependenciesError: createBusinessRuleMapping(
    'module-has-dependencies',
    'Cannot delete module with existing lessons',
  ),

  // Lesson errors
  LessonNotFoundError: createNotFoundMapping('lesson'),
  DuplicateLessonError: createDuplicateMapping('lesson'),
  LessonHasDependenciesError: createBusinessRuleMapping(
    'lesson-has-dependencies',
    'Cannot delete lesson with existing videos or documents',
  ),

  // Video errors
  VideoNotFoundError: createNotFoundMapping('video'),
  DuplicateVideoError: createDuplicateMapping('video'),
  VideoHasDependenciesError: createBusinessRuleMapping(
    'video-has-dependencies',
    'Cannot delete video with existing references',
  ),
  InvalidVideoProviderError: {
    type: 'invalid-video-provider',
    title: 'Invalid Video Provider',
    status: HttpStatus.BAD_REQUEST,
    extractDetail: (error) =>
      error.message || 'Invalid video provider specified',
  },

  // Document errors
  DocumentNotFoundError: createNotFoundMapping('document'),
  DuplicateDocumentError: createDuplicateMapping('document'),
  DocumentHasDependenciesError: createBusinessRuleMapping(
    'document-has-dependencies',
    'Cannot delete document with existing references',
  ),
  InvalidFileError: {
    type: 'invalid-file',
    title: 'Invalid File',
    status: HttpStatus.BAD_REQUEST,
    extractDetail: (error) => error.message || 'Invalid file format or content',
  },

  // Business rule violations
  InvalidOrderError: createBusinessRuleMapping(
    'invalid-order',
    'Invalid order value',
  ),
  InvalidDurationError: createBusinessRuleMapping(
    'invalid-duration',
    'Invalid duration value',
  ),
  InvalidSlugError: createBusinessRuleMapping(
    'invalid-slug',
    'Invalid slug format',
  ),

  // Translation errors
  MissingTranslationError: {
    type: 'missing-translation',
    title: 'Missing Translation',
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    extractDetail: (error) =>
      error.message || 'Required translation is missing',
  },
  InvalidTranslationError: {
    type: 'invalid-translation',
    title: 'Invalid Translation',
    status: HttpStatus.BAD_REQUEST,
    extractDetail: (error) => error.message || 'Invalid translation data',
  },
};
