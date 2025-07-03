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

@Controller('lessons/:lessonId/documents')
export class DocumentController {
  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly listDocumentsUseCase: ListDocumentsUseCase,
    private readonly getDocumentUseCase: GetDocumentUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
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
}
