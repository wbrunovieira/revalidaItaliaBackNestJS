// src/infra/filters/error-mappings/index.ts
import { ErrorMapping } from './shared.mappings';
import { sharedErrorMappings } from './shared.mappings';
import { userErrorMappings } from './user.mappings';
import { domainExceptionMappings } from './domain-exceptions.mappings';
import { courseCatalogErrorMappings } from './course-catalog.mappings';

/**
 * Combined error mappings from all modules
 * Shared mappings can be overridden by module-specific mappings
 */
export const errorMappings: Record<string, ErrorMapping> = {
  ...sharedErrorMappings,
  ...domainExceptionMappings,
  ...userErrorMappings,
  ...courseCatalogErrorMappings,
  // Future module mappings will be added here:
  // ...assessmentErrorMappings,
};

export * from './shared.mappings';
export * from './user.mappings';
export * from './course-catalog.mappings';
