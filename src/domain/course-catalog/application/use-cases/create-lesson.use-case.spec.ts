// src/domain/course-catalog/application/use-cases/create-lesson.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { left, right } from "@/core/either";
import { UniqueEntityID } from "@/core/unique-entity-id";
import { CreateLessonUseCase } from "./create-lesson.use-case";
import { InMemoryModuleRepository } from "@/test/repositories/in-memory-module-repository";
import { InMemoryLessonRepository } from "@/test/repositories/in-memory-lesson-repository";
import { InvalidInputError } from "./errors/invalid-input-error";
import { ModuleNotFoundError } from "./errors/module-not-found-error";
import { RepositoryError } from "./errors/repository-error";
import { Module } from "@/domain/course-catalog/enterprise/entities/module.entity";

function aValidRequest() {
  return {
    moduleId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    translations: [
      { locale: "pt", title: "Aula PT", description: "Descrição PT" },
      { locale: "it", title: "Lezione IT", description: "Descrizione IT" },
      { locale: "es", title: "Lección ES", description: "Descripción ES" },
    ],
  };
}

describe("CreateLessonUseCase", () => {
  let moduleRepo: InMemoryModuleRepository;
  let lessonRepo: InMemoryLessonRepository;
  let sut: CreateLessonUseCase;

  beforeEach(() => {
    moduleRepo = new InMemoryModuleRepository();
    lessonRepo = new InMemoryLessonRepository();
    sut = new CreateLessonUseCase(
      moduleRepo as any,
      lessonRepo as any
    );
  });

  it("→ creates a lesson successfully", async () => {
    // given a seeded module
    const mod = Module.create(
      {
        slug: "mod-slug",
        translations: [{ locale: "pt", title: "Modulo PT", description: "Desc" }],
        order: 1,
        videos: [],
      },
      new UniqueEntityID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
    );
    await moduleRepo.create(mod.id.toString(), mod);

    // when
    const result = await sut.execute(aValidRequest() as any);

    // then
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const { lesson } = result.value;
      expect(lesson.moduleId).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
      expect(lesson.translations).toHaveLength(3);
      expect(lesson.translations.map(t => t.locale).sort())
        .toEqual(["es","it","pt"]);
    }
  });

  it("→ rejects if moduleId is missing", async () => {
    const req = { ...aValidRequest(), moduleId: undefined } as any;
    const result = await sut.execute(req);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    expect((result.value as InvalidInputError).details.some(d => d.path.includes("moduleId")))
      .toBe(true);
  });

  it("→ rejects if moduleId is not a UUID", async () => {
    const req = { ...aValidRequest(), moduleId: "not‐a‐uuid" };
    const result = await sut.execute(req as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    expect((result.value as InvalidInputError).details[0].message)
      .toMatch(/must be a valid uuid/i);
  });

  it("→ rejects when translations length ≠ 3", async () => {
    const req = { ...aValidRequest(), translations: aValidRequest().translations.slice(0,2) } as any;
    const result = await sut.execute(req);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    expect((result.value as InvalidInputError).details[0].message)
      .toMatch(/exactly three translations required/i);
  });

  it("→ rejects on duplicate locale in translations", async () => {
    const dup = { locale: "pt", title: "X", description: "Y" };
    const req = { ...aValidRequest(), translations: [...aValidRequest().translations, dup] } as any;
    const result = await sut.execute(req);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    expect((result.value as InvalidInputError).details.some(d => /duplicate locale/i.test(d.message)))
      .toBe(true);
  });

  it("→ rejects on unsupported locale in translations", async () => {
    const bad = { locale: "en" as any, title: "EN", description: "Desc" };
    const req = { ...aValidRequest(), translations: [...aValidRequest().translations.slice(0,2), bad] } as any;
    const result = await sut.execute(req);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    expect(
            (result.value as InvalidInputError).details.some(d =>
              d.path.includes("locale")
            )
        ).toBe(true);
      });
  it("→ errors if module does not exist", async () => {
    const result = await sut.execute(aValidRequest() as any);
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ModuleNotFoundError);
  });

  it("→ propagates repository failures as RepositoryError", async () => {
    // given a module
    const mod = Module.create(
      {
        slug: "mod-slug",
        translations: [{ locale: "pt", title: "Modulo PT", description: "Desc" }],
        order: 1,
        videos: [],
      },
      new UniqueEntityID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
    );
    await moduleRepo.create(mod.id.toString(), mod);

    // and lessonRepo.create blows up
    vi.spyOn(lessonRepo, "create")
      .mockResolvedValueOnce(left(new Error("database is down")));

    // when
    const result = await sut.execute(aValidRequest() as any);

    // then
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(RepositoryError);
    expect((result.value as RepositoryError).message).toContain("database is down");
  });
});