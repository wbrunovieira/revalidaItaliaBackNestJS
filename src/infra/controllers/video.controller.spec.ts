// src/infra/course-catalog/controllers/video.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { left, right } from "@/core/either";
import { InvalidInputError }   from "@/domain/course-catalog/application/use-cases/errors/invalid-input-error";
import { DuplicateVideoError } from "@/domain/course-catalog/application/use-cases/errors/duplicate-video-error";
import { LessonNotFoundError } from "@/domain/course-catalog/application/use-cases/errors/lesson-not-found-error";
import { VideoNotFoundError }  from "@/domain/course-catalog/application/use-cases/errors/video-not-found-error";
import { CreateVideoDto }      from "@/domain/course-catalog/application/dtos/create-video.dto";
import { CreateVideoUseCase }  from "@/domain/course-catalog/application/use-cases/create-video.use-case";
import { GetVideoUseCase }     from "@/domain/course-catalog/application/use-cases/get-video.use-case";
import { GetVideosUseCase }    from "@/domain/course-catalog/application/use-cases/get-videos.use-case";
import { VideoController }     from "./video.controller";

// Prisma stub shape
type PrismaMock = {
  module: { findUnique: ReturnType<typeof vi.fn> },
  lesson: { create:     ReturnType<typeof vi.fn> },
};

class MockCreateVideoUseCase { execute = vi.fn(); }
class MockGetVideoUseCase    { execute = vi.fn(); }
class MockGetVideosUseCase   { execute = vi.fn(); }

describe("VideoController", () => {
  let controller: VideoController;
  let createUseCase: MockCreateVideoUseCase;
  let getUseCase:    MockGetVideoUseCase;
  let listUseCase:   MockGetVideosUseCase;
  let prisma:        PrismaMock;

  const courseId = "course-1";
  const moduleId = "module-1";
  const lessonId = "lesson-1";

  const dto: CreateVideoDto = {
    slug: "video-slug",
    providerVideoId: "provVid",
    translations: [
      { locale: "pt", title: "T1", description: "D1" },
      { locale: "it", title: "T2", description: "D2" },
      { locale: "es", title: "T3", description: "D3" },
    ],
  };

  beforeEach(() => {
    createUseCase = new MockCreateVideoUseCase();
    getUseCase    = new MockGetVideoUseCase();
    listUseCase   = new MockGetVideosUseCase();

    prisma = {
      module: { findUnique: vi.fn().mockResolvedValue({ id: moduleId, courseId }) },
      lesson: { create:     vi.fn().mockResolvedValue({ id: lessonId }) },
    };

    controller = new VideoController(
      createUseCase as any,
      getUseCase    as any,
      listUseCase   as any,
      prisma        as any,
    );
  });

  describe("create()", () => {
    it("→ returns created video on success", async () => {
      const payload = { id: "v1", lessonId, ...dto };
      createUseCase.execute.mockResolvedValueOnce(right({ video: payload }));

      const res = await controller.create(courseId, moduleId, dto);

      expect(prisma.module.findUnique).toHaveBeenCalledWith({ where: { id: moduleId } });
      expect(prisma.lesson.create).toHaveBeenCalledWith({ data: { moduleId } });
      expect(createUseCase.execute).toHaveBeenCalledWith({
        lessonId,
        slug: dto.slug,
        providerVideoId: dto.providerVideoId,
        translations: dto.translations,
      });
      expect(res).toEqual(payload);
    });

    it("→ throws NotFoundException if module missing/mismatched", async () => {
      prisma.module.findUnique.mockResolvedValueOnce(null);
      await expect(controller.create(courseId, moduleId, dto))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it("→ throws BadRequestException on InvalidInputError", async () => {
      createUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError("Bad", [{ path: ["slug"], message: "X" }]))
      );
      await expect(controller.create(courseId, moduleId, dto))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it("→ throws ConflictException on DuplicateVideoError", async () => {
      createUseCase.execute.mockResolvedValueOnce(left(new DuplicateVideoError()));
      await expect(controller.create(courseId, moduleId, dto))
        .rejects.toBeInstanceOf(ConflictException);
    });

    it("→ throws NotFoundException on LessonNotFoundError", async () => {
      createUseCase.execute.mockResolvedValueOnce(left(new LessonNotFoundError()));
      await expect(controller.create(courseId, moduleId, dto))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it("→ throws InternalServerErrorException on other errors", async () => {
      createUseCase.execute.mockResolvedValueOnce(left(new Error("oops")));
      await expect(controller.create(courseId, moduleId, dto))
        .rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe("findOne()", () => {
    it("→ returns video on success", async () => {
      const video = { id: "v1", slug: dto.slug, providerVideoId: dto.providerVideoId, translations: dto.translations };
      getUseCase.execute.mockResolvedValueOnce(right({ video }));

      const out = await controller.findOne(courseId, moduleId, video.id);
      expect(getUseCase.execute).toHaveBeenCalledWith({ id: video.id });
      expect(out).toEqual(video);
    });

    it("→ throws BadRequestException on InvalidInputError", async () => {
      getUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError("Bad", [{ path: ["id"], message: "X" }]))
      );
      await expect(controller.findOne(courseId, moduleId, "bad-uuid"))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it("→ throws NotFoundException on VideoNotFoundError", async () => {
      getUseCase.execute.mockResolvedValueOnce(left(new VideoNotFoundError()));
      await expect(controller.findOne(courseId, moduleId, "1111-1111-1111-1111"))
        .rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("findAll()", () => {
    it("→ returns list on success", async () => {
      const list = [{
        id: "v1", slug: "s", providerVideoId: "p",
        durationInSeconds: 10, createdAt: new Date(), updatedAt: new Date(),
        translations: dto.translations,
      }];
      listUseCase.execute.mockResolvedValueOnce(right({ videos: list }));

      const out = await controller.findAll(courseId, moduleId);
      expect(listUseCase.execute).toHaveBeenCalledWith({ courseId, moduleId });
      expect(out).toEqual(list);
    });

    it("→ throws BadRequestException on InvalidInputError", async () => {
      listUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError("Bad", [{ path: ["courseId"], message: "X" }]))
      );
      await expect(controller.findAll(courseId, moduleId))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it("→ throws InternalServerErrorException on other errors", async () => {
      listUseCase.execute.mockResolvedValueOnce(left(new Error("boom")));
      await expect(controller.findAll(courseId, moduleId))
        .rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});