// src/domain/course-catalog/enterprise/entities/course.entity.ts
import { Entity } from "@/core/entity";
import { UniqueEntityID } from "@/core/unique-entity-id";
import { Module } from "./module.entity";

export interface CourseProps {
  title: string;
  description: string;
  modules: Module[];
  createdAt: Date;
  updatedAt: Date;
}

export class Course extends Entity<CourseProps> {
  private touch() {
    this.props.updatedAt = new Date();
  }


  public get courseId(): string {
    return this.id.toString();
  }

  public get title(): string {
    return this.props.title;
  }
  public get description(): string {
    return this.props.description;
  }
  public get modules(): Module[] {
    return this.props.modules;
  }
  public get createdAt(): Date {
    return this.props.createdAt;
  }
  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /** Atualiza título e descrição do curso */
  public updateDetails(updates: {
    title?: string;
    description?: string;
  }) {
    if (updates.title) {
      this.props.title = updates.title;
      this.touch();
    }
    if (updates.description) {
      this.props.description = updates.description;
      this.touch();
    }
  }

  /** Adiciona um novo módulo ao curso */
  public addModule(module: Module) {
    this.props.modules.push(module);
    this.touch();
  }

  /** Remove um módulo pelo seu ID */
  public removeModule(moduleId: string) {
    this.props.modules = this.props.modules.filter(
      (m) => m.id.toString() !== moduleId
    );
    this.touch();
  }

  /** Converte o aggregate Course em objeto de resposta */
  public toResponseObject(): {
    id: string;
    title: string;
    description: string;
    modules: { id: string; title: string }[];
    createdAt: Date;
    updatedAt: Date;
  } {
    const moduleSummaries = this.props.modules.map((mod) => ({
      id: mod.id.toString(),
      title: mod.title,
    }));

    return {
      id: this.id.toString(), // usa o getter herdado (.id é UniqueEntityID)
      title: this.props.title,
      description: this.props.description,
      modules: moduleSummaries,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  /** Fábrica estática para criar um novo Course */
  public static create(
    props: Omit<CourseProps, "createdAt" | "updatedAt">,
    id?: UniqueEntityID
  ) {
    const now = new Date();
    return new Course(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id
    );
  }
}