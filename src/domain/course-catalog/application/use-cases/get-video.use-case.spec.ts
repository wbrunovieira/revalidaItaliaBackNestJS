
import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetVideoUseCase } from "@/domain/course-catalog/application/use-cases/get-video.use-case";
import { InMemoryVideoRepository } from "@/test/repositories/in-memory-video-repository";
import { Video } from "@/domain/course-catalog/enterprise/entities/video.entity";
import { UniqueEntityID } from "@/core/unique-entity-id";
import { left } from "@/core/either";
import { InvalidInputError } from "@/domain/course-catalog/application/use-cases/errors/invalid-input-error";
import { VideoNotFoundError } from "@/domain/course-catalog/application/use-cases/errors/video-not-found-error";
import { RepositoryError } from "@/domain/course-catalog/application/use-cases/errors/repository-error";

let repo: InMemoryVideoRepository;
let sut: GetVideoUseCase;

describe("GetVideoUseCase", () => {
  beforeEach(() => {
    repo = new InMemoryVideoRepository();
    sut = new GetVideoUseCase(repo);
  });

  function baseVideo(): Video {
    const createdAt = new Date("2025-01-01T00:00:00Z");
    const updatedAt = new Date("2025-02-01T00:00:00Z");
    return Video.reconstruct(
      {
        slug: "video-exemplo",
        title: "Título Exemplo",
        providerVideoId: "prov-id-123",
        durationInSeconds: 120,
        isSeen: false,
        createdAt,
        updatedAt,
      },
      new UniqueEntityID("11111111-1111-1111-1111-111111111111")
    );
  }

  it("returns video when valid ID is provided", async () => {
    const video = baseVideo();
    const translations: Array<{ locale: 'pt' | 'it' | 'es'; title: string; description: string }> = [
      { locale: 'pt', title: video.title, description: 'Descrição PT' },
      { locale: 'it', title: 'Titolo IT', description: 'Descrizione IT' },
      { locale: 'es', title: 'Título ES', description: 'Descripción ES' },
    ];
    await repo.create("module-1", video, translations);

    const result = await sut.execute({ id: video.id.toString() });
    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const { video: dto } = result.value;
      expect(dto.id).toBe(video.id.toString());
      expect(dto.slug).toBe(video.slug);
      expect(dto.providerVideoId).toBe(video.providerVideoId);
      expect(dto.durationInSeconds).toBe(video.durationInSeconds);
      expect(dto.createdAt.toISOString()).toBe(video.createdAt.toISOString());
      expect(dto.updatedAt.toISOString()).toBe(video.updatedAt.toISOString());
      expect(dto.translations).toEqual(translations);
    }
  });

  it("returns InvalidInputError when ID is not a valid UUID", async () => {
    const result = await sut.execute({ id: "not-a-uuid" as any });
    expect(result.isLeft()).toBe(true);

    if (result.isLeft() && result.value instanceof InvalidInputError) {
      expect(result.value.details[0].message).toMatch(/UUID/);
    } else {
      fail("Expected InvalidInputError");
    }
  });

  it("returns VideoNotFoundError when no video exists for given ID", async () => {
    const result = await sut.execute({ id: "22222222-2222-2222-2222-222222222222" });
    expect(result.isLeft()).toBe(true);

    if (result.isLeft() && result.value instanceof VideoNotFoundError) {
      // ok
    } else {
      fail("Expected VideoNotFoundError");
    }
  });

  it("propagates RepositoryError when repository throws", async () => {
    vi.spyOn(repo, "findById").mockRejectedValueOnce(new Error("DB down"));

    const result = await sut.execute({ id: "33333333-3333-3333-3333-333333333333" });
    expect(result.isLeft()).toBe(true);

    if (result.isLeft() && result.value instanceof RepositoryError) {
      expect((result.value as RepositoryError).message).toBe("DB down");
    } else {
      fail("Expected RepositoryError");
    }
  });

  it("returns InvalidInputError when request object is missing `id`", async () => {
    // @ts-expect-error: testing invalid payload
    const result = await sut.execute({});
    expect(result.isLeft()).toBe(true);

    if (result.isLeft() && result.value instanceof InvalidInputError) {
      expect(result.value.details.some(d => d.path.join(".") === "id")).toBe(true);
    } else {
      fail("Expected InvalidInputError");
    }
  });

  it("returns InvalidInputError when request has extra properties", async () => {
    const id = "11111111-1111-1111-1111-111111111111";
    // @ts-expect-error: testing invalid payload
    const result = await sut.execute({ id, foo: "bar" });
    expect(result.isLeft()).toBe(true);

    if (result.isLeft() && result.value instanceof InvalidInputError) {
      expect(result.value.details.some(d => /unrecognized key/i.test(d.message))).toBe(true);
    } else {
      fail("Expected InvalidInputError for extra key");
    }
  });

  it("maps repository left(Error) to VideoNotFoundError", async () => {
    vi.spyOn(repo, "findById").mockResolvedValueOnce(
      left<Error, any>(new Error("Portuguese translation missing"))
    );

    const result = await sut.execute({ id: "11111111-1111-1111-1111-111111111111" });
    expect(result.isLeft()).toBe(true);

    if (result.isLeft() && result.value instanceof VideoNotFoundError) {
      // ok
    } else {
      fail("Expected VideoNotFoundError");
    }
  });
});