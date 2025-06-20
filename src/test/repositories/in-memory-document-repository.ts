// src/test/repositories/in-memory-document-repository.ts
import { Either, left, right } from '@/core/either';
import { IDocumentRepository } from '@/domain/course-catalog/application/repositories/i-document-repository';
import { Document } from '@/domain/course-catalog/enterprise/entities/document.entity';

interface StoredDocument {
  lessonId: string;
  document: Document;
  translations: Array<{
    locale: 'pt' | 'it' | 'es';
    title: string;
    description: string;
  }>;
}

export class InMemoryDocumentRepository implements IDocumentRepository {
  public items: StoredDocument[] = [];

  async findByFilename(filename: string): Promise<Either<Error, Document>> {
    const found = this.items.find(
      (entry) => entry.document.filename === filename,
    );
    return found
      ? right(found.document)
      : left(new Error('Document not found'));
  }

  async findById(id: string): Promise<
    Either<
      Error,
      {
        document: Document;
        translations: Array<{
          locale: 'pt' | 'it' | 'es';
          title: string;
          description: string;
        }>;
      }
    >
  > {
    const found = this.items.find(
      (entry) => entry.document.id.toString() === id,
    );
    if (!found) {
      return left(new Error('Document not found'));
    }
    return right({
      document: found.document,
      translations: found.translations,
    });
  }

  async create(
    lessonId: string,
    document: Document,
    translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
    }>,
  ): Promise<Either<Error, void>> {
    this.items.push({ lessonId, document, translations });
    return right(undefined);
  }

  async findByLesson(lessonId: string): Promise<
    Either<
      Error,
      Array<{
        document: Document;
        translations: Array<{
          locale: 'pt' | 'it' | 'es';
          title: string;
          description: string;
        }>;
      }>
    >
  > {
    const filtered = this.items.filter((item) => item.lessonId === lessonId);
    return right(
      filtered.map((item) => ({
        document: item.document,
        translations: item.translations,
      })),
    );
  }

  async delete(id: string): Promise<Either<Error, void>> {
    const index = this.items.findIndex(
      (item) => item.document.id.toString() === id,
    );
    if (index === -1) {
      return left(new Error('Document not found'));
    }
    this.items.splice(index, 1);
    return right(undefined);
  }

  async incrementDownloadCount(id: string): Promise<Either<Error, void>> {
    const found = this.items.find(
      (entry) => entry.document.id.toString() === id,
    );
    if (!found) {
      return left(new Error('Document not found'));
    }
    found.document.incrementDownloadCount();
    return right(undefined);
  }
}
