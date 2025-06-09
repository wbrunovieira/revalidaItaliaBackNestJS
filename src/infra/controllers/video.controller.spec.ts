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

class MockCreateVideoUseCase {
  execute = vi.fn();
}

describe("VideoController", () => {
  let controller: VideoController;
  let createVideoUseCase: MockCreateVideoUseCase;

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
    controller = new VideoController(createVideoUseCase as any);
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
});