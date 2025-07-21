// src/test/repositories/in-memory-document-repository.ts
import { Either, left, right } from '@/core/either';
import { IDocumentRepository } from '@/domain/course-catalog/application/repositories/i-document-repository';
import { Document } from '@/domain/course-catalog/enterprise/entities/document.entity';
import { DocumentDependencyInfo } from '@/domain/course-catalog/application/dtos/document-dependencies.dto';

interface StoredDocument {
  lessonId: string;
  document: Document;
  translations: Array<{
    locale: 'pt' | 'it' | 'es';
    title: string;
    description: string;
    url: string;
  }>;
}

interface DocumentDependencies {
  downloads: Array<{
    id: string;
    identityId: string;
    userName: string;
    downloadedAt: Date;
  }>;
  translations: Array<{
    id: string;
    locale: string;
    title: string;
  }>;
}

export class InMemoryDocumentRepository implements IDocumentRepository {
  public items: StoredDocument[] = [];
  private documentDependencies: Map<string, DocumentDependencies> = new Map();

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
          url: string;
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
      url: string;
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
          url: string;
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

  async checkDocumentDependencies(
    id: string,
  ): Promise<Either<Error, DocumentDependencyInfo>> {
    const dependencies = this.documentDependencies.get(id) || {
      downloads: [],
      translations: [],
    };

    const dependencyList = [
      ...dependencies.downloads.map((download) => ({
        type: 'download' as const,
        id: download.id,
        name: `Downloaded by ${download.userName}`,
        relatedEntities: {
          identityId: download.identityId,
          userName: download.userName,
          downloadedAt: download.downloadedAt,
        },
      })),
      ...dependencies.translations.map((translation) => ({
        type: 'translation' as const,
        id: translation.id,
        name: `Translation (${translation.locale}): ${translation.title}`,
        relatedEntities: {
          locale: translation.locale,
          title: translation.title,
        },
      })),
    ];

    const dependencyInfo: DocumentDependencyInfo = {
      canDelete: dependencyList.length === 0,
      totalDependencies: dependencyList.length,
      summary: {
        downloads: dependencies.downloads.length,
        translations: dependencies.translations.length,
      },
      dependencies: dependencyList,
    };

    return right(dependencyInfo);
  }

  // Método auxiliar para testes
  public addDependenciesToDocument(
    documentId: string,
    dependencies: Partial<DocumentDependencies>,
  ): void {
    const existing = this.documentDependencies.get(documentId) || {
      downloads: [],
      translations: [],
    };

    this.documentDependencies.set(documentId, {
      downloads: dependencies.downloads || existing.downloads,
      translations: dependencies.translations || existing.translations,
    });
  }

  async update(
    document: Document,
    translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
      url: string;
    }>,
  ): Promise<Either<Error, void>> {
    // Encontra o índice do documento armazenado
    const index = this.items.findIndex(
      (item) => item.document.id.toString() === document.id.toString(),
    );

    if (index === -1) {
      return left(new Error('Document not found'));
    }

    // Atualiza a entidade e as traduções
    this.items[index].document = document;
    this.items[index].translations = translations;

    return right(undefined);
  }
}
