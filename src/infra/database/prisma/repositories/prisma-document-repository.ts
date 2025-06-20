// src/infra/database/prisma/repositories/prisma-document-repository.ts
import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Either, left, right } from '@/core/either';
import { IDocumentRepository } from '@/domain/course-catalog/application/repositories/i-document-repository';
import { Document } from '@/domain/course-catalog/enterprise/entities/document.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { DuplicateDocumentError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-document-error';

@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByFilename(filename: string): Promise<Either<Error, Document>> {
    try {
      const row = await this.prisma.lessonDocument.findFirst({
        where: { filename },
        include: { translations: true },
      });

      if (!row) return left(new Error('Document not found'));

      const ptTr = row.translations.find((t) => t.locale === 'pt');
      if (!ptTr) return left(new Error('Portuguese translation missing'));

      const documentEntity = Document.reconstruct(
        {
          url: row.url,
          filename: row.filename || '',
          title: ptTr.title,
          fileSize: 0, // TODO: adicionar no schema do Prisma
          mimeType: '', // TODO: adicionar no schema do Prisma
          isDownloadable: true, // TODO: adicionar no schema do Prisma
          downloadCount: 0, // TODO: adicionar no schema do Prisma
          createdAt: row.createdAt,
          updatedAt: row.createdAt, // LessonDocument não tem updatedAt no schema atual
        },
        new UniqueEntityID(row.id),
      );

      return right(documentEntity);
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
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
    try {
      await this.prisma.lessonDocument.create({
        data: {
          id: document.id.toString(),
          lessonId,
          url: document.url,
          filename: document.filename,
          translations: {
            create: translations.map((t) => ({
              id: new UniqueEntityID().toString(),
              locale: t.locale,
              title: t.title,
              description: t.description,
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
    try {
      const row = await this.prisma.lessonDocument.findUnique({
        where: { id },
        include: { translations: true },
      });

      if (!row) return left(new Error('Document not found'));

      const documentEntity = Document.reconstruct(
        {
          url: row.url,
          filename: row.filename || '',
          title: row.translations.find((t) => t.locale === 'pt')!.title,
          fileSize: 0, // TODO: adicionar no schema
          mimeType: '', // TODO: adicionar no schema
          isDownloadable: true, // TODO: adicionar no schema
          downloadCount: 0, // TODO: adicionar no schema
          createdAt: row.createdAt,
          updatedAt: row.createdAt,
        },
        new UniqueEntityID(row.id),
      );

      const translationsData = row.translations.map((t) => ({
        locale: t.locale as 'pt' | 'it' | 'es',
        title: t.title,
        description: t.description || '', // Trata null/undefined como string vazia
      }));

      return right({
        document: documentEntity,
        translations: translationsData,
      });
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
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
    try {
      const rows = await this.prisma.lessonDocument.findMany({
        where: { lessonId },
        include: { translations: true },
      });

      const result = rows.map((row) => {
        const documentEntity = Document.reconstruct(
          {
            url: row.url,
            filename: row.filename || '',
            title: row.translations.find((t) => t.locale === 'pt')!.title,
            fileSize: 0, // TODO: adicionar no schema
            mimeType: '', // TODO: adicionar no schema
            isDownloadable: true, // TODO: adicionar no schema
            downloadCount: 0, // TODO: adicionar no schema
            createdAt: row.createdAt,
            updatedAt: row.createdAt,
          },
          new UniqueEntityID(row.id),
        );

        const translationsData = row.translations.map((t) => ({
          locale: t.locale as 'pt' | 'it' | 'es',
          title: t.title,
          description: t.description || '', // Trata null/undefined como string vazia
        }));

        return { document: documentEntity, translations: translationsData };
      });

      return right(result);
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.lessonDocument.delete({
        where: { id },
      });
      return right(undefined);
    } catch (err: any) {
      return left(new Error(`Failed to delete document: ${err.message}`));
    }
  }

  async incrementDownloadCount(id: string): Promise<Either<Error, void>> {
    // TODO: Implementar quando adicionar downloadCount no schema
    return right(undefined);
  }
}
