// src/domain/course-catalog/application/repositories/i-document-repository.ts
import { Either } from '@/core/either';
import { Document } from '../../enterprise/entities/document.entity';
import { DocumentDependencyInfo } from '../dtos/document-dependencies.dto';

export interface IDocumentRepository {
  findByFilename(filename: string): Promise<Either<Error, Document>>;

  create(
    lessonId: string,
    document: Document,
    translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
      url: string;
    }>,
  ): Promise<Either<Error, void>>;

  findById(id: string): Promise<
    Either<
      Error,
      {
        document: Document;
        translations: Array<{
          locale: 'pt' | 'it' | 'es';
          title: string;
          description: string;
          url: string;
        }>;
      }
    >
  >;

  findByLesson(lessonId: string): Promise<
    Either<
      Error,
      Array<{
        document: Document;
        translations: Array<{
          locale: 'pt' | 'it' | 'es';
          title: string;
          description: string;
          url: string;
        }>;
      }>
    >
  >;

  delete(id: string): Promise<Either<Error, void>>;

  incrementDownloadCount(id: string): Promise<Either<Error, void>>;

  checkDocumentDependencies(
    id: string,
  ): Promise<Either<Error, DocumentDependencyInfo>>;
}
