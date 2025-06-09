// src/domain/course-catalog/application/use-cases/get-module.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetModuleUseCase } from "@/domain/course-catalog/application/use-cases/get-module.use-case";
import { InMemoryModuleRepository } from "@/test/repositories/in-memory-module-repository";
import { Module } from "@/domain/course-catalog/enterprise/entities/module.entity";
import { UniqueEntityID } from "@/core/unique-entity-id";
import { left } from "@/core/either";
import { InvalidInputError } from "@/domain/course-catalog/application/use-cases/errors/invalid-input-error";
import { ModuleNotFoundError } from "@/domain/course-catalog/application/use-cases/errors/module-not-found-error";
import { RepositoryError } from "@/domain/course-catalog/application/use-cases/errors/repository-error";

let moduleRepo: InMemoryModuleRepository;
let sut: GetModuleUseCase;

describe("GetModuleUseCase", () => {
  beforeEach(() => {
    moduleRepo = new InMemoryModuleRepository();
    sut = new GetModuleUseCase(moduleRepo as any);
  });

  function makeModule(): Module {
    return Module.create(
      {
        slug: "mod-test",
        translations: [
          { locale: "pt", title: "Módulo Teste", description: "Desc PT" },
          { locale: "it", title: "Modulo Test", description: "Desc IT" },
          { locale: "es", title: "Módulo Prueba", description: "Desc ES" },
        ],
        order: 1,
        videos: [],
      },
      new UniqueEntityID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
    );
  }

  it("returns module when valid ID is provided", async () => {
    const mod = makeModule();
    await moduleRepo.create("any-course", mod);

    const result = await sut.execute({ moduleId: mod.id.toString() });
    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const { module } = result.value;
      expect(module.id).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
      expect(module.slug).toBe("mod-test");
      expect(module.order).toBe(1);
      expect(module.translations).toEqual(
        expect.arrayContaining([
          { locale: "pt", title: "Módulo Teste", description: "Desc PT" },
          { locale: "it", title: "Modulo Test", description: "Desc IT" },
          { locale: "es", title: "Módulo Prueba", description: "Desc ES" },
        ])
      );
    }
  });

  it("returns InvalidInputError when moduleId is not a valid UUID", async () => {
    const result = await sut.execute({ moduleId: "not-a-uuid" as any });
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      const err = result.value as InvalidInputError;
      expect(err.details[0].message).toMatch(/Module ID must be a valid UUID/);
    }
  });

  it("returns ModuleNotFoundError when module does not exist", async () => {
    const result = await sut.execute({
      moduleId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    });
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ModuleNotFoundError);
    }
  });

  it("propagates RepositoryError when repository throws", async () => {
    vi.spyOn(moduleRepo, "findById").mockRejectedValueOnce(new Error("DB down"));
    const result = await sut.execute({
      moduleId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    });
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect((result.value as RepositoryError).message).toBe("DB down");
    }
  });

  it("returns correct path in InvalidInputError for bad UUID", async () => {
    const result = await sut.execute({ moduleId: "not-a-uuid" as any });
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      const err = result.value as InvalidInputError;
      expect(err.details[0].path).toEqual(["moduleId"]);
    }
  });

  it("maps any Left from repo to ModuleNotFoundError", async () => {

    vi.spyOn(moduleRepo, "findById").mockResolvedValueOnce(
      left(new Error("unexpected"))
    );
    const result = await sut.execute({
      moduleId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    });
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ModuleNotFoundError);
    }
  });

});