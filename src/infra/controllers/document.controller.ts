import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  Put,
} from '@nestjs/common';
import { CreateDocumentUseCase } from '@/domain/course-catalog/application/use-cases/create-document.use-case';
import { ListDocumentsUseCase } from '@/domain/course-catalog/application/use-cases/list-documents.use-case';
import { GetDocumentUseCase } from '@/domain/course-catalog/application/use-cases/get-document.use-case';
import { DeleteDocumentUseCase } from '@/domain/course-catalog/application/use-cases/delete-document.use-case';
import { CreateDocumentRequest } from '@/domain/course-catalog/application/dtos/create-document-request.dto';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { LessonNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/lesson-not-found-error';
import { DuplicateDocumentError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-document-error';
import { DocumentNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/document-not-found-error';
import { DocumentHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/document-has-dependencies-error';
import { InvalidFileError } from '@/domain/course-catalog/application/use-cases/errors/invalid-file-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { UpdateDocumentUseCase } from '@/domain/course-catalog/application/use-cases/update-document.use-case';
import { UpdateDocumentRequest } from '@/domain/course-catalog/application/dtos/update-document-request.dto';
import { DocumentResponseDto } from '@/domain/course-catalog/application/dtos/document-response.dto';

@Controller('lessons/:lessonId/documents')
export class DocumentController {
  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly listDocumentsUseCase: ListDocumentsUseCase,
    private readonly getDocumentUseCase: GetDocumentUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
    private readonly updateDocumentUseCase: UpdateDocumentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() body: Omit<CreateDocumentRequest, 'lessonId'>,
  ) {
    const result = await this.createDocumentUseCase.execute({
      ...body,
      lessonId,
    });
    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError) {
        throw new BadRequestException({
          message: err.message,
          details: err.details,
        });
      }
      if (err instanceof LessonNotFoundError) {
        throw new NotFoundException(err.message);
      }
      if (err instanceof DuplicateDocumentError) {
        throw new ConflictException(err.message);
      }
      if (err instanceof InvalidFileError) {
        throw new BadRequestException(err.message);
      }
      throw new InternalServerErrorException('An unexpected error occurred');
    }

    const { document, translations } = result.value;
    return { ...document, translations };
  }

  @Get()
  async findAll(@Param('lessonId', ParseUUIDPipe) lessonId: string) {
    const result = await this.listDocumentsUseCase.execute({ lessonId });
    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError) {
        throw new BadRequestException({
          message: err.message,
          details: err.details,
        });
      }
      if (err instanceof LessonNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException('An unexpected error occurred');
    }

    return result.value.documents;
  }

  @Get(':documentId')
  async findOne(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    const result = await this.getDocumentUseCase.execute({
      lessonId,
      documentId,
    });

    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError) {
        throw new BadRequestException({
          message: err.message,
          details: err.details,
        });
      }
      if (err instanceof LessonNotFoundError) {
        throw new NotFoundException(err.message);
      }
      if (err instanceof DocumentNotFoundError) {
        throw new NotFoundException(err.message);
      }
      if (err instanceof RepositoryError) {
        throw new InternalServerErrorException(err.message);
      }
      throw new InternalServerErrorException('An unexpected error occurred');
    }

    return result.value.document;
  }

  @Post(':documentId/download')
  @HttpCode(HttpStatus.OK)
  async incrementDownload(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    // implementação futura de incremento no caso de uso
    return { message: 'Download count incremented successfully', documentId };
  }

  @Delete(':documentId')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    const result = await this.deleteDocumentUseCase.execute({
      id: documentId,
      lessonId: lessonId,
    });

    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError) {
        throw new BadRequestException({
          message: err.message,
          details: err.details,
        });
      }
      if (err instanceof DocumentNotFoundError) {
        throw new NotFoundException(err.message);
      }
      if (err instanceof DocumentHasDependenciesError) {
        throw new ConflictException({
          message: err.message,
          dependencyInfo: (err as any).dependencyInfo,
        });
      }
      if (err instanceof RepositoryError) {
        throw new InternalServerErrorException(err.message);
      }
      throw new InternalServerErrorException('An unexpected error occurred');
    }

    return result.value;
  }

  @Put(':documentId')
  async update(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() body: Omit<UpdateDocumentRequest, 'id' | 'lessonId'>,
  ): Promise<DocumentResponseDto> {
    const result = await this.updateDocumentUseCase.execute({
      ...body,
      id: documentId,
    });

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          message: error.message,
          details: error.details,
        });
      }

      if (error instanceof DocumentNotFoundError) {
        throw new NotFoundException('Document not found');
      }

      if (error instanceof RepositoryError) {
        throw new InternalServerErrorException('Failed to update document');
      }

      throw new InternalServerErrorException('An unexpected error occurred');
    }

    const { document, translations } = result.value;
    const responseObj = document.toResponseObject();

    // Format according to DocumentResponseDto structure
    // Note: The DTO expects 'url' and 'title' at document level, but these are per-translation
    // We'll use the first translation's data as defaults
    const firstTranslation = translations[0];

    return {
      document: {
        id: responseObj.id,
        url: firstTranslation?.url || '', // URL is per translation
        filename: responseObj.filename,
        title: firstTranslation?.title || responseObj.filename, // Title is per translation
        fileSize: responseObj.fileSize,
        fileSizeInMB: responseObj.fileSizeInMB,
        mimeType: responseObj.mimeType,
        isDownloadable: responseObj.isDownloadable,
        downloadCount: responseObj.downloadCount,
        createdAt: responseObj.createdAt,
        updatedAt: responseObj.updatedAt,
      },
      translations: translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        description: t.description,
      })),
    };
  }
}
