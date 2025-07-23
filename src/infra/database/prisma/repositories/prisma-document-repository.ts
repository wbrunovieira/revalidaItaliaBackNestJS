// src
import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Either, left, right } from '@/core/either';
import { IDocumentRepository } from '@/domain/course-catalog/application/repositories/i-document-repository';
import { Document } from '@/domain/course-catalog/enterprise/entities/document.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { DuplicateDocumentError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-document-error';
import { DocumentDependencyInfo } from '@/domain/course-catalog/application/dtos/document-dependencies.dto';

@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Busca por filename
  async findByFilename(filename: string): Promise<Either<Error, Document>> {
    try {
      const row = await this.prisma.lessonDocument.findFirst({
        where: { filename },
        include: { translations: true },
      });

      if (!row) return left(new Error('Document not found'));

      // Monta array de traduções com URL
      const translationsData = row.translations.map((t) => ({
        locale: t.locale as 'pt' | 'it' | 'es',
        title: t.title,
        description: t.description ?? '',
        url: t.url,
      }));

      // Reconstrói entidade contendo todas as traduções
      const props = {
        filename: row.filename ?? '',
        createdAt: row.createdAt,
        updatedAt: row.createdAt,
        translations: translationsData,
      };
      const documentEntity = Document.reconstruct(
        props,
        new UniqueEntityID(row.id),
      );

      return right(documentEntity);
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  // Criação de documento com traduções que incluem URL
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
    try {
      await this.prisma.lessonDocument.create({
        data: {
          id: document.id.toString(),
          lessonId,
          filename: document.filename,
          translations: {
            create: translations.map((t) => ({
              id: new UniqueEntityID().toString(),
              locale: t.locale,
              title: t.title,
              description: t.description,
              url: t.url,
            })),
          },
        },
      });

      return right(undefined);
    } catch (err: any) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        Array.isArray(err.meta?.target) &&
        err.meta.target.includes('filename')
      ) {
        return left(new DuplicateDocumentError());
      }
      return left(new Error(`Failed to create document: ${err.message}`));
    }
  }

  // Busca por ID de documento
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
    try {
      const row = await this.prisma.lessonDocument.findUnique({
        where: { id },
        include: { translations: true },
      });

      if (!row) return left(new Error('Document not found'));

      const translationsData = row.translations.map((t) => ({
        locale: t.locale as 'pt' | 'it' | 'es',
        title: t.title,
        description: t.description ?? '',
        url: t.url,
      }));

      const props = {
        filename: row.filename ?? '',
        fileSize: 0,
        mimeType: '',
        isDownloadable: true,
        downloadCount: 0,
        createdAt: row.createdAt,
        updatedAt: row.createdAt,
        translations: translationsData,
      };
      const documentEntity = Document.reconstruct(
        props,
        new UniqueEntityID(row.id),
      );

      return right({
        document: documentEntity,
        translations: translationsData,
      });
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  // Lista todos os documentos de uma aula
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
    try {
      const rows = await this.prisma.lessonDocument.findMany({
        where: { lessonId },
        include: { translations: true },
      });

      const result = rows.map((row) => {
        const translationsData = row.translations.map((t) => ({
          locale: t.locale as 'pt' | 'it' | 'es',
          title: t.title,
          description: t.description ?? '',
          url: t.url,
        }));

        const props = {
          filename: row.filename ?? '',
          createdAt: row.createdAt,
          updatedAt: row.createdAt,
          translations: translationsData,
        };
        const documentEntity = Document.reconstruct(
          props,
          new UniqueEntityID(row.id),
        );

        return { document: documentEntity, translations: translationsData };
      });

      return right(result);
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  // Deleta documento
  async delete(id: string): Promise<Either<Error, void>> {
    try {
      // Usar transaction para garantir atomicidade
      await this.prisma.$transaction(async (prisma) => {
        // Primeiro deleta as traduções
        await prisma.lessonDocumentTranslation.deleteMany({
          where: { documentId: id },
        });

        // Depois deleta o documento
        await prisma.lessonDocument.delete({
          where: { id },
        });
      });

      return right(undefined);
    } catch (err: any) {
      return left(new Error(`Failed to delete document: ${err.message}`));
    }
  }

  // Incremento de download (a implementar)
  async incrementDownloadCount(id: string): Promise<Either<Error, void>> {
    return right(undefined);
  }

  // Verifica dependências do documento
  async checkDocumentDependencies(
    id: string,
  ): Promise<Either<Error, DocumentDependencyInfo>> {
    try {
      // Verifica se o documento existe
      const document = await this.prisma.lessonDocument.findUnique({
        where: { id },
        include: {
          translations: true,
          // Adicione aqui outras relações que realmente impedem a remoção
          // Por exemplo: assignments, quizzes, downloads por usuários, etc.
        },
      });

      if (!document) {
        return left(new Error('Document not found'));
      }

      // Monta informações sobre dependências REAIS (que impedem remoção)
      const dependencies: Array<{
        type: 'translation' | 'download';
        id: string;
        name: string;
        relatedEntities?: {
          userId?: string;
          userName?: string;
          downloadedAt?: Date;
          locale?: string;
          title?: string;
        };
      }> = [];

      // NÃO adiciona traduções como dependências - elas são parte do documento
      // e devem ser removidas em cascata

      // Adicione aqui verificações de dependências REAIS que impedem a remoção
      // Por exemplo:
      // - Downloads por usuários (se você quiser manter histórico)
      // - Referências em assignments/quizzes
      // - Uso em outras partes do sistema

      // Conta os tipos de dependências
      const translationsCount = document.translations.length; // Para informação apenas
      const downloadsCount = dependencies.filter(
        (d) => d.type === 'download',
      ).length;
      const totalDependencies = dependencies.length; // Apenas dependências reais

      const dependencyInfo: DocumentDependencyInfo = {
        canDelete: totalDependencies === 0, // Pode deletar se não há dependências REAIS
        totalDependencies,
        summary: {
          downloads: downloadsCount,
          translations: translationsCount, // Informativo apenas
        },
        dependencies,
      };

      return right(dependencyInfo);
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
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
    try {
      await this.prisma.$transaction(async (prisma) => {
        // 1. Atualiza o filename, caso tenha mudado
        await prisma.lessonDocument.update({
          where: { id: document.id.toString() },
          data: { filename: document.filename },
        });

        // 2. Deleta traduções antigas
        await prisma.lessonDocumentTranslation.deleteMany({
          where: { documentId: document.id.toString() },
        });

        // 3. Insere novas traduções
        for (const t of translations) {
          await prisma.lessonDocumentTranslation.create({
            data: {
              id: new UniqueEntityID().toString(),
              locale: t.locale,
              title: t.title,
              description: t.description,
              url: t.url,
              documentId: document.id.toString(),
            },
          });
        }
      });

      return right(undefined);
    } catch (err: any) {
      // Tratamento de erro de unicidade (tradução duplicada para mesmo locale)
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return left(new Error('Cada locale de tradução deve ser único'));
      }
      return left(new Error(`Falha ao atualizar documento: ${err.message}`));
    }
  }
}
