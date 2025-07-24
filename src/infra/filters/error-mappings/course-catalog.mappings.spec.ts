// src/infra/filters/error-mappings/course-catalog.mappings.spec.ts
import { describe, it, expect } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import { courseCatalogErrorMappings } from './course-catalog.mappings';

describe('Course Catalog Error Mappings', () => {
  it('should map CourseNotFoundError correctly', () => {
    const mapping = courseCatalogErrorMappings.CourseNotFoundError;
    expect(mapping.type).toBe('course-not-found');
    expect(mapping.title).toBe('Course Not Found');
    expect(mapping.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should map DuplicateCourseError correctly', () => {
    const mapping = courseCatalogErrorMappings.DuplicateCourseError;
    expect(mapping.type).toBe('duplicate-course');
    expect(mapping.title).toBe('Conflict');
    expect(mapping.status).toBe(HttpStatus.CONFLICT);
  });

  it('should map LessonNotFoundError correctly', () => {
    const mapping = courseCatalogErrorMappings.LessonNotFoundError;
    expect(mapping.type).toBe('lesson-not-found');
    expect(mapping.title).toBe('Lesson Not Found');
    expect(mapping.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should map DocumentNotFoundError correctly', () => {
    const mapping = courseCatalogErrorMappings.DocumentNotFoundError;
    expect(mapping.type).toBe('document-not-found');
    expect(mapping.title).toBe('Document Not Found');
    expect(mapping.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should map DuplicateDocumentError correctly', () => {
    const mapping = courseCatalogErrorMappings.DuplicateDocumentError;
    expect(mapping.type).toBe('duplicate-document');
    expect(mapping.title).toBe('Conflict');
    expect(mapping.status).toBe(HttpStatus.CONFLICT);
  });

  it('should map InvalidFileError correctly', () => {
    const mapping = courseCatalogErrorMappings.InvalidFileError;
    expect(mapping.type).toBe('invalid-file');
    expect(mapping.title).toBe('Invalid File');
    expect(mapping.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should map VideoNotFoundError correctly', () => {
    const mapping = courseCatalogErrorMappings.VideoNotFoundError;
    expect(mapping.type).toBe('video-not-found');
    expect(mapping.title).toBe('Video Not Found');
    expect(mapping.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should map InvalidVideoProviderError correctly', () => {
    const mapping = courseCatalogErrorMappings.InvalidVideoProviderError;
    expect(mapping.type).toBe('invalid-video-provider');
    expect(mapping.title).toBe('Invalid Video Provider');
    expect(mapping.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should extract detail from error message', () => {
    const mapping = courseCatalogErrorMappings.InvalidFileError;
    const error = new Error('File type not supported');

    const detail = mapping.extractDetail!(error);
    expect(detail).toBe('File type not supported');
  });

  it('should use default detail when error has no message', () => {
    const mapping = courseCatalogErrorMappings.InvalidFileError;
    const error = new Error('');

    const detail = mapping.extractDetail!(error);
    expect(detail).toBe('Invalid file format or content');
  });
});
