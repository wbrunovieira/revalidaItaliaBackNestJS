// src/domain/course-catalog/application/use-cases/create-course.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreateCourseUseCase } from "@/domain/course-catalog/application/use-cases/create-course.use-case";
import { InMemoryCourseRepository } from "@/test/repositories/in-memory-course-repository";
import { CreateCourseRequest } from "@/domain/course-catalog/application/dtos/create-course-request.dto";
import { DuplicateCourseError } from "@/domain/course-catalog/application/use-cases/errors/duplicate-course-error";
import { InvalidInputError } from "@/domain/course-catalog/application/use-cases/errors/invalid-input-error";
import { RepositoryError } from "@/domain/course-catalog/application/use-cases/errors/repository-error";
import { left } from "@/core/either";

let repo: InMemoryCourseRepository;
let sut: CreateCourseUseCase;

describe("CreateCourseUseCase (multilanguage)", () => {
  beforeEach(() => {
    repo = new InMemoryCourseRepository();
    sut = new CreateCourseUseCase(repo);
  });

  function baseValidRequest(): CreateCourseRequest {
    return {
      translations: [
        { locale: "pt", title: "Matemática Avançada", description: "Aprofundamento em tópicos de matemática." },
        { locale: "it", title: "Matematica Avanzata", description: "Approfondimento di argomenti di matematica." },
        { locale: "es", title: "Matemáticas Avanzadas", description: "Profundización en temas de matemáticas." },
      ],
      modules: [
        {
          translations: [
            { locale: "pt", title: "Cálculo I", description: "Introdução ao Cálculo Diferencial." },
            { locale: "it", title: "Calcolo I", description: "Introduzione al Calcolo Differenziale." },
            { locale: "es", title: "Cálculo I", description: "Introducción al Cálculo Diferencial." },
          ],
          order: 1,
        },
        {
          translations: [
            { locale: "pt", title: "Álgebra Linear", description: "Vetores, matrizes e espaços vetoriais." },
            { locale: "it", title: "Algebra Lineare", description: "Vettori, matrici e spazi vettoriali." },
            { locale: "es", title: "Álgebra Lineal", description: "Vectores, matrices y espacios vectoriales." },
          ],
          order: 2,
        },
      ],
    };
  }

  it("creates a multilanguage course successfully", async () => {
    const req = baseValidRequest();
    const result = await sut.execute(req);
    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      const { course } = result.value;
      expect(course.id).toMatch(/[0-9a-fA-F\-]{36}/);

      expect(course.title).toBe("Matemática Avançada");
      expect(course.description).toBe("Aprofundamento em tópicos de matemática.");
      expect(course.modules).toHaveLength(2);
      expect(course.modules[0].order).toBe(1);
      expect(course.modules[1].order).toBe(2);
      expect(repo.items).toHaveLength(1);
    }
  });

  it("rejects when there is no Portuguese translation for the course", async () => {
    const req: any = {
      translations: [
        { locale: "it", title: "Curso Italiano", description: "Descrizione it" },
        { locale: "es", title: "Curso Español", description: "Descripción es" },
      ],
      modules: [],
    };
    const result = await sut.execute(req as any);
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      const err = result.value as InvalidInputError;
 
      expect(err.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "At least a Portuguese translation is required",
            path: expect.arrayContaining(["translations"]),
          }),
        ])
      );
    }
  });

  it("rejects duplicate locale entries in course translations", async () => {
    const req: any = {
      translations: [
        { locale: "pt", title: "A", description: "Descrição A" },
        { locale: "pt", title: "B", description: "Descrição B" },
      ],
      modules: [],
    };
    const result = await sut.execute(req as any);
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      const err = result.value as InvalidInputError;

      expect(err.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "Locale duplicado em traduções",
            path: expect.arrayContaining(["translations"]),
          }),
        ])
      );
    }
  });

  it("rejects too-short title/description in a non-Portuguese translation", async () => {
    const req: any = {
      translations: [
        { locale: "pt", title: "Curso OK", description: "Descrição válida" },
        { locale: "it", title: "Ab", description: "Desc" },
      ],
      modules: [],
    };
    const result = await sut.execute(req as any);
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      const err = result.value as InvalidInputError;
      expect(err.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "Course title must be at least 3 characters long",
            path: expect.arrayContaining(["translations", 1, "title"]),
          }),
          expect.objectContaining({
            message: "Course description must be at least 5 characters long",
            path: expect.arrayContaining(["translations", 1, "description"]),
          }),
        ])
      );
    }
  });

  it("rejects when a module is missing a Portuguese translation", async () => {
    const base = baseValidRequest();

    base.modules![0].translations = [
      { locale: "it", title: "Calcolo I", description: "Introduzione al Calcolo." },
    ];
    const result = await sut.execute(base as any);
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      const err = result.value as InvalidInputError;
      expect(err.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "Each module needs a Portuguese translation",
            path: expect.arrayContaining(["modules", "translations"]),
          }),
        ])
      );
    }
  });

  it("rejects duplicate locale entries within a single module", async () => {
    const base = baseValidRequest();

    base.modules![1].translations = [
      { locale: "pt", title: "Álgebra", description: "Descrição" },
      { locale: "pt", title: "Álgebra2", description: "Outra" },
    ];
    const result = await sut.execute(base as any);
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      const err = result.value as InvalidInputError;
      expect(err.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "Locale duplicado em módulo",
            path: expect.arrayContaining(["modules", "translations"]),
          }),
        ])
      );
    }
  });

  it("rejects duplicate module orders", async () => {
    const req: any = {
      translations: [
        { locale: "pt", title: "Física", description: "Introdução à Física" },
      ],
      modules: [
        {
          translations: [
            { locale: "pt", title: "Mecânica", description: "Descrição" },
          ],
          order: 1,
        },
        {
          translations: [
            { locale: "pt", title: "Eletrodinâmica", description: "Descrição" },
          ],
          order: 1, 
        },
      ],
    };
    const result = await sut.execute(req as any);
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      const err = result.value as InvalidInputError;
      expect(err.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "Module orders must be unique",
            path: expect.arrayContaining(["modules"]),
          }),
        ])
      );
    }
  });

  it("rejects duplicate Portuguese title when creating twice", async () => {
    const req = baseValidRequest();
    await sut.execute(req);
    const again = await sut.execute(req);
    expect(again.isLeft()).toBe(true);

    if (again.isLeft()) {
      expect(again.value).toBeInstanceOf(DuplicateCourseError);
    }
  });

  it("handles repository error on findByTitle", async () => {
    vi.spyOn(repo, "findByTitle").mockRejectedValueOnce(new Error("DB down"));
    const result = await sut.execute(baseValidRequest());
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect(result.value.message).toBe("DB down");
    }
  });

  it("handles Left returned by repository.create", async () => {
    vi.spyOn(repo, "create").mockResolvedValueOnce(left(new Error("Insert failed")) as any);
    const result = await sut.execute(baseValidRequest());
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect(result.value.message).toBe("Insert failed");
    }
  });

  it("handles exception thrown by repository.create", async () => {
    vi.spyOn(repo, "create").mockImplementationOnce(() => {
      throw new Error("Create exception");
    });
    const result = await sut.execute(baseValidRequest());
    expect(result.isLeft()).toBe(true);

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect(result.value.message).toBe("Create exception");
    }
  });
});