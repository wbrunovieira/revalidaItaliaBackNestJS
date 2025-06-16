// src/infra/course-catalog/controllers/video.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { left, right } from "@/core/either";
import { InvalidInputError } from "@/domain/course-catalog/application/use-cases/errors/invalid-input-error";
import { ModuleNotFoundError } from "@/domain/course-catalog/application/use-cases/errors/module-not-found-error";
import { DuplicateVideoError } from "@/domain/course-catalog/application/use-cases/errors/duplicate-video-error";
import { VideoNotFoundError } from "@/domain/course-catalog/application/use-cases/errors/video-not-found-error";
import { CreateVideoDto } from "@/domain/course-catalog/application/dtos/create-video.dto";
import { CreateVideoUseCase } from "@/domain/course-catalog/application/use-cases/create-video.use-case";
import { GetVideoUseCase }    from "@/domain/course-catalog/application/use-cases/get-video.use-case";
import { GetVideosUseCase }   from "@/domain/course-catalog/application/use-cases/get-videos.use-case";
import { VideoController }    from "./video.controller";

class MockCreateVideoUseCase { execute = vi.fn(); }
class MockGetVideoUseCase    { execute = vi.fn(); }
class MockGetVideosUseCase   { execute = vi.fn(); }

describe("VideoController", () => {
  let controller: VideoController;
  let createVideo: MockCreateVideoUseCase;
  let getVideo:    MockGetVideoUseCase;
  let getVideos:   MockGetVideosUseCase;

  // a minimal PrismaService mock
  let prisma: {
    module: { findUnique: ReturnType<typeof vi.fn> },
    lesson: { create:     ReturnType<typeof vi.fn> },
  };

  const courseId = "course-1";
  const moduleId = "module-1";
  const lessonId = "lesson-1";

  const dto: CreateVideoDto = {
    slug: "video-slug",
    providerVideoId: "provVid-1",
    translations: [
      { locale: "pt", title: "Título PT", description: "Desc PT" },
      { locale: "it", title: "Título IT", description: "Desc IT" },
      { locale: "es", title: "Título ES", description: "Desc ES" },
    ],
  };

  beforeEach(() => {
    createVideo = new MockCreateVideoUseCase();
    getVideo    = new MockGetVideoUseCase();
    getVideos   = new MockGetVideosUseCase();

    // stub PrismaService.module.findUnique and .lesson.create
    prisma = {
      module: { findUnique: vi.fn() },
      lesson: { create:     vi.fn() },
    };

    controller = new VideoController(
      createVideo as any,
      getVideo as any,
      getVideos as any,
      prisma as any
    );

    // by default, pretend the module exists and belongs to the course:
    prisma.module.findUnique.mockResolvedValue({ id: moduleId, courseId });
    prisma.lesson.create.mockResolvedValue({ id: lessonId });
  });

  describe("create()", () => {
    it("returns created video on success", async () => {
      const videoPayload = { id: "v1", lessonId, ...dto };
      createVideo.execute.mockResolvedValueOnce(
        right({ video: videoPayload })
      );

      const result = await controller.create(courseId, moduleId, dto);

      // prisma.module.findUnique must be called
      expect(prisma.module.findUnique).toHaveBeenCalledWith({ where: { id: moduleId } });
      // prisma.lesson.create must be called with moduleId
      expect(prisma.lesson.create).toHaveBeenCalledWith({ data: { moduleId } });

      // and CreateVideoUseCase.execute should receive the new lessonId
      expect(createVideo.execute).toHaveBeenCalledWith({
        lessonId,
        slug: dto.slug,
        providerVideoId: dto.providerVideoId,
        translations: dto.translations,
      });

      expect(result).toEqual(videoPayload);
    });

    it("throws NotFoundException if module not found or mismatched", async () => {
      // no module in DB
      prisma.module.findUnique.mockResolvedValueOnce(null);

      await expect(
        controller.create(courseId, moduleId, dto)
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws BadRequestException on InvalidInputError", async () => {
      createVideo.execute.mockResolvedValueOnce(
        left(new InvalidInputError("Bad", [{ path: ["slug"], message: "X" }]))
      );

      await expect(
        controller.create(courseId, moduleId, dto)
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws ConflictException on DuplicateVideoError", async () => {
      createVideo.execute.mockResolvedValueOnce(
        left(new DuplicateVideoError())
      );

      await expect(
        controller.create(courseId, moduleId, dto)
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("throws InternalServerErrorException on unknown error", async () => {
      createVideo.execute.mockResolvedValueOnce(
        left(new Error("oops"))
      );

      await expect(
        controller.create(courseId, moduleId, dto)
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe("findOne()", () => {
    it("returns video on success", async () => {
      const videoPayload = { id: "v1", slug: dto.slug, providerVideoId: dto.providerVideoId, translations: dto.translations };
      getVideo.execute.mockResolvedValueOnce(
        right({ video: videoPayload })
      );

      const result = await controller.findOne(courseId, moduleId, "v1");
      expect(getVideo.execute).toHaveBeenCalledWith({ id: "v1" });
      expect(result).toEqual(videoPayload);
    });

    it("throws BadRequestException on InvalidInputError", async () => {
      getVideo.execute.mockResolvedValueOnce(
        left(new InvalidInputError("Bad", [{ path: ["id"], message: "X" }]))
      );

      await expect(
        controller.findOne(courseId, moduleId, "bad-uuid")
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws NotFoundException on VideoNotFoundError", async () => {
      getVideo.execute.mockResolvedValueOnce(
        left(new VideoNotFoundError())
      );

      await expect(
        controller.findOne(courseId, moduleId, "1111-1111-1111-1111")
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("findAll()", () => {
    it("returns list of videos on success", async () => {
      const payload = [{
        id: "v1",
        slug: "s",
        providerVideoId: "p",
        durationInSeconds: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        translations: dto.translations,
      }];

      getVideos.execute.mockResolvedValueOnce(right({ videos: payload }));

      const result = await controller.findAll(courseId, moduleId);

      expect(getVideos.execute).toHaveBeenCalledWith({ courseId, moduleId });
      expect(result).toEqual(payload);
    });

    it("throws BadRequestException on InvalidInputError", async () => {
      getVideos.execute.mockResolvedValueOnce(
        left(new InvalidInputError("Bad", [{ path: ["courseId"], message: "X" }]))
      );

      await expect(
        controller.findAll(courseId, moduleId)
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws InternalServerErrorException on other errors", async () => {
      getVideos.execute.mockResolvedValueOnce(
        left(new Error("boom"))
      );

      await expect(
        controller.findAll(courseId, moduleId)
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});