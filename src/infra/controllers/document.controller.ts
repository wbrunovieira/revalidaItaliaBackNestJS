// src/infra/controllers/document.controller.ts
import {
  Controller,
  Post,
  Get,
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
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDocumentUseCase } from '@/domain/course-catalog/application/use-cases/create-document.use-case';
import { ListDocumentsUseCase } from '@/domain/course-catalog/application/use-cases/list-documents.use-case';
import { CreateDocumentRequest } from '@/domain/course-catalog/application/dtos/create-document-request.dto';
import { CreateDocumentDto } from '@/domain/course-catalog/application/dtos/create-document.dto';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { LessonNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/lesson-not-found-error';
import { DuplicateDocumentError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-document-error';
import { DocumentNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/document-not-found-error';
import { InvalidFileError } from '@/domain/course-catalog/application/use-cases/errors/invalid-file-error';

@Controller('courses/:courseId/lessons/:lessonId/documents')
export class DocumentController {
  constructor(
    private readonly createDocument: CreateDocumentUseCase,
    private readonly listDocuments: ListDocumentsUseCase,
    private readonly prisma: PrismaService,
  ) {}

  private async validateLesson(courseId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { courseId: true } } },
    });
    if (!lesson || lesson.module.courseId !== courseId) {
      throw new NotFoundException('Lesson not found');
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() body: Omit<CreateDocumentRequest, 'lessonId'>,
  ) {
    // Verify lesson exists and belongs to course
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { courseId: true } } },
    });
    if (!lesson || lesson.module.courseId !== courseId) {
      throw new NotFoundException('Lesson not found');
    }

    const result = await this.createDocument.execute({ ...body, lessonId });
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
      throw new InternalServerErrorException(err.message);
    }

    // Return created document with translations
    const { document, translations } = result.value;
    return {
      id: document.id,
      url: document.url,
      filename: document.filename,
      title: document.title,
      fileSize: document.fileSize,
      fileSizeInMB: document.fileSizeInMB,
      mimeType: document.mimeType,
      isDownloadable: document.isDownloadable,
      downloadCount: document.downloadCount,
      translations,
    };
  }

  // List all documents for a lesson
  @Get()
  async findAll(
    @Param('courseId') courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    await this.validateLesson(courseId, lessonId);

    const result = await this.listDocuments.execute({ lessonId });
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
      throw new InternalServerErrorException(err.message);
    }

    return result.value.documents;
  }

  // Get a single document by ID
  @Get(':documentId')
  async findOne(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    await this.validateLesson(courseId, lessonId);

    // Ensure document belongs to that lesson
    const rec = await this.prisma.lessonDocument.findUnique({
      where: { id: documentId },
    });
    if (!rec || rec.lessonId !== lessonId) {
      throw new NotFoundException('Document not found in this lesson');
    }

    // TODO: Implementar GetDocumentUseCase quando necessário
    // const result = await this.getDocument.execute({ id: documentId });
    // if (result.isLeft()) {
    //   const err = result.value;
    //   if (err instanceof InvalidInputError)
    //     throw new BadRequestException(err.details);
    //   if (err instanceof DocumentNotFoundError)
    //     throw new NotFoundException(err.message);
    //   throw new InternalServerErrorException(err.message);
    // }
    // return result.value.document;

    return {
      message: 'Get document endpoint - to be implemented',
      documentId,
    };
  }

  // Increment download count
  @Post(':documentId/download')
  @HttpCode(HttpStatus.OK)
  async incrementDownload(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    await this.validateLesson(courseId, lessonId);

    // Ensure document belongs to that lesson
    const rec = await this.prisma.lessonDocument.findUnique({
      where: { id: documentId },
    });
    if (!rec || rec.lessonId !== lessonId) {
      throw new NotFoundException('Document not found in this lesson');
    }

    // TODO: Implementar IncrementDownloadUseCase quando necessário
    // const result = await this.incrementDownload.execute({ id: documentId });
    // if (result.isLeft()) {
    //   throw new InternalServerErrorException(result.value.message);
    // }

    return {
      message: 'Download count incremented successfully',
      documentId,
    };
  }
}
