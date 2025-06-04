// src/domain/course-catalog/enterprise/entities/course.entity.ts
import { Entity } from "@/core/entity"
import { UniqueEntityID } from "@/core/unique-entity-id"
import { Module } from "./module.entity"

export interface CourseProps {
  title: string
  description: string
  modules: Module[]
  createdAt: Date
  updatedAt: Date
}

export class Course extends Entity<CourseProps> {
  private touch() {
    this.props.updatedAt = new Date()
  }

  public get title(): string {
    return this.props.title
  }
  public get description(): string {
    return this.props.description
  }
  public get modules(): Module[] {
    return this.props.modules
  }
  public get createdAt(): Date {
    return this.props.createdAt
  }
  public get updatedAt(): Date {
    return this.props.updatedAt
  }

  public updateDetails(updates: {
    title?: string
    description?: string
  }) {
    if (updates.title) {
      this.props.title = updates.title
      this.touch()
    }
    if (updates.description) {
      this.props.description = updates.description
      this.touch()
    }
  }

  public addModule(module: Module) {
    this.props.modules.push(module)
    this.touch()
  }

  public removeModule(moduleId: string) {
    this.props.modules = this.props.modules.filter(
      (m) => m.id.toString() !== moduleId
    )
    this.touch()
  }

  public toResponseObject(): {
    id: string
    title: string
    description: string
    modules: { id: string; title: string; order: number }[]
    createdAt: Date
    updatedAt: Date
  } {
    const moduleSummaries = this.props.modules.map((mod) => ({
      id: mod.id.toString(),
      title: mod.title,
      order: mod.order,
    }))
    return {
      id: this.id.toString(),
      title: this.props.title,
      description: this.props.description,
      modules: moduleSummaries,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    }
  }

  public static create(
    props: Omit<CourseProps, "createdAt" | "updatedAt">,
    id?: UniqueEntityID
  ): Course {
    const now = new Date()
    return new Course(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id
    )
  }


  public static reconstruct(
    props: CourseProps,
    id: UniqueEntityID
  ): Course {
    return new Course(props, id)
  }
}