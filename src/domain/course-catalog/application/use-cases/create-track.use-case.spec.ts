// src/domain/course-catalog/application/use-cases/create-track.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreateTrackUseCase } from "@/domain/course-catalog/application/use-cases/create-track.use-case";
import { InMemoryTrackRepository } from "@/test/repositories/in-memory-track-repository";
import { left } from "@/core/either";
import { InvalidInputError } from "@/domain/course-catalog/application/use-cases/errors/invalid-input-error";
import { DuplicateTrackError } from "@/domain/course-catalog/application/use-cases/errors/duplicate-track-error";
import { RepositoryError } from "@/domain/course-catalog/application/use-cases/errors/repository-error";

import { CreateTrackRequest } from "@/domain/course-catalog/application/dtos/create-track-request.dto";

function baseRequest(): CreateTrackRequest {
  return {
    slug: "my-track",
    courseIds: ["uuid-1"],
    translations: [
      { locale: "pt", title: "Trilha PT", description: "Descrição PT" },
      { locale: "it", title: "Traccia IT", description: "Descrizione IT" },
      { locale: "es", title: "Pista ES", description: "Descripción ES" },
    ],
  };
}

describe("CreateTrackUseCase", () => {
  let repo: InMemoryTrackRepository;
  let sut: CreateTrackUseCase;

  beforeEach(() => {
    repo = new InMemoryTrackRepository();
    sut = new CreateTrackUseCase(repo);
  });

  it("creates a track successfully", async () => {
    const result = await sut.execute(baseRequest());
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const t = result.value.track;
      expect(t.slug).toBe("my-track");
      expect(t.courseIds).toEqual(["uuid-1"]);
      expect(t.title).toBe("Trilha PT");
      expect(t.description).toBe("Descrição PT");
      expect(repo.items).toHaveLength(1);
    }
  });

  it("rejects missing slug", async () => {
    const r = await sut.execute({ ...baseRequest(), slug: "" } as any);
    expect(r.isLeft()).toBe(true);
    if (r.isLeft()) {
      expect(r.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it("rejects empty courseIds", async () => {
    const r = await sut.execute({ ...baseRequest(), courseIds: [] } as any);
    expect(r.isLeft()).toBe(true);
    if (r.isLeft()) {
      expect(r.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it("rejects missing PT translation", async () => {
    const req = baseRequest();
    req.translations = req.translations.filter(t => t.locale !== "pt");
    const r = await sut.execute(req as any);
    expect(r.isLeft()).toBe(true);
    if (r.isLeft()) {
      expect(r.value).toBeInstanceOf(InvalidInputError);
      if (r.value instanceof InvalidInputError) {
        expect(r.value.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ message: "At least a Portuguese translation is required" })
          ])
        );
      }
    }
  });

  it("rejects duplicate locale in translations", async () => {
    const req = baseRequest();
    req.translations.push({ locale: "pt", title: "Outra PT", description: "Outra desc" });
    const r = await sut.execute(req as any);
    expect(r.isLeft()).toBe(true);
    if (r.isLeft()) {
      expect(r.value).toBeInstanceOf(InvalidInputError);
    }
  });

  it("rejects duplicate slug", async () => {
    await sut.execute(baseRequest());
    const again = await sut.execute(baseRequest());
    expect(again.isLeft()).toBe(true);
    if (again.isLeft()) {
      expect(again.value).toBeInstanceOf(DuplicateTrackError);
    }
  });

  it("handles repo errors on findBySlug", async () => {
    vi.spyOn(repo, "findBySlug").mockRejectedValueOnce(new Error("fail"));
    const r = await sut.execute(baseRequest());
    expect(r.isLeft()).toBe(true);
    if (r.isLeft()) {
      expect(r.value).toBeInstanceOf(RepositoryError);
    }
  });
  it("allows the same course in multiple tracks", async () => {
    const first = await sut.execute(baseRequest());
    expect(first.isRight()).toBe(true);

    const secondReq = { ...baseRequest(), slug: "my-track-2" };
    const second = await sut.execute(secondReq);
    expect(second.isRight()).toBe(true);

    expect(repo.items.map(t => t.slug)).toEqual(
      expect.arrayContaining(["my-track", "my-track-2"])
    );
  });
  
});