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
import { CreateVideoDto } from "@/domain/course-catalog/application/dtos/create-video.dto";
import { CreateVideoUseCase } from "@/domain/course-catalog/application/use-cases/create-video.use-case";
import { VideoController } from "./video.controller";
import { VideoNotFoundError } from "@/domain/course-catalog/application/use-cases/errors/video-not-found-error";

class MockCreateVideoUseCase {
  execute = vi.fn();
}
class MockGetVideoUseCase {
  execute = vi.fn();
}
class MockGetVideosUseCase  { execute = vi.fn(); }

describe("VideoController", () => {
  let controller: VideoController;
  let createVideoUseCase: MockCreateVideoUseCase;
  let getVideoUseCase: MockGetVideoUseCase;
  let getVideos: MockGetVideosUseCase;

  const courseId = "course-1";
  const moduleId = "module-1";
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
    createVideoUseCase = new MockCreateVideoUseCase();
    getVideoUseCase = new MockGetVideoUseCase();
    getVideos  = new MockGetVideosUseCase();
    controller = new VideoController(createVideoUseCase as any, getVideoUseCase as any , getVideos as any);
  });

  it("returns created video on success", async () => {
    const videoPayload = { id: "v1", ...dto, moduleId };
    createVideoUseCase.execute.mockResolvedValueOnce(
      right({ video: videoPayload })
    );

    const result = await controller.create(courseId, moduleId, dto);
    expect(result).toEqual(videoPayload);
    expect(createVideoUseCase.execute).toHaveBeenCalledWith({
      moduleId,
      slug: dto.slug,
      providerVideoId: dto.providerVideoId,
      translations: dto.translations,
    });
  });

  it("throws BadRequestException on InvalidInputError", async () => {
    const details = [{ path: ["slug"], message: "Required" }];
    createVideoUseCase.execute.mockResolvedValueOnce(
      left(new InvalidInputError("Invalid", details))
    );

    await expect(
      controller.create(courseId, moduleId, dto)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("throws NotFoundException on ModuleNotFoundError", async () => {
    createVideoUseCase.execute.mockResolvedValueOnce(
      left(new ModuleNotFoundError("Module not found"))
    );

    await expect(
      controller.create(courseId, moduleId, dto)
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("throws ConflictException on DuplicateVideoError", async () => {
    createVideoUseCase.execute.mockResolvedValueOnce(
      left(new DuplicateVideoError())
    );

    await expect(
      controller.create(courseId, moduleId, dto)
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("throws InternalServerErrorException on unknown error", async () => {
    createVideoUseCase.execute.mockResolvedValueOnce(left(new Error("oops")));

    await expect(
      controller.create(courseId, moduleId, dto)
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it("returns video on success", async () => {
    const videoPayload = {
      id: "v1",
      slug: dto.slug,
      providerVideoId: dto.providerVideoId,
      translations: dto.translations,
    };
    getVideoUseCase.execute.mockResolvedValueOnce(
      right({ video: videoPayload })
    );

    const result = await controller.findOne(courseId, moduleId, "v1");
    expect(getVideoUseCase.execute).toHaveBeenCalledWith({ id: "v1" });
    expect(result).toEqual(videoPayload);
  });

  it("throws BadRequestException on InvalidInputError", async () => {
    const details = [{ path: ["id"], message: "Required" }];
    getVideoUseCase.execute.mockResolvedValueOnce(
      left(new InvalidInputError("Invalid", details))
    );

    await expect(
      controller.findOne(courseId, moduleId, "bad-id")
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("throws NotFoundException on VideoNotFoundError", async () => {
    getVideoUseCase.execute.mockResolvedValueOnce(
      left(new VideoNotFoundError())
    );

    await expect(
      controller.findOne(courseId, moduleId, "1111-1111-1111-1111")
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns list of videos on findAll success', async () => {
    const payload = [{ id:'v1',slug:'s',providerVideoId:'p',durationInSeconds:10,createdAt:new Date(),updatedAt:new Date(),translations:dto.translations }];
    getVideos.execute.mockResolvedValueOnce(right({ videos: payload }));
    const result = await controller.findAll(courseId, moduleId);
    expect(getVideos.execute).toHaveBeenCalledWith({ courseId, moduleId });
    expect(result).toEqual(payload);
  });

  it('throws BadRequestException on InvalidInputError from findAll', async () => {
    const details = [{ message:'m',path:['courseId'] }];
    getVideos.execute.mockResolvedValueOnce(left(new InvalidInputError('Bad',details)));
    await expect(controller.findAll(courseId,moduleId)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws InternalServerErrorException on other errors from findAll', async () => {
    getVideos.execute.mockResolvedValueOnce(left(new Error('boom')));
    await expect(controller.findAll(courseId,moduleId)).rejects.toBeInstanceOf(InternalServerErrorException);
  });


});