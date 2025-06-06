// src/test/repositories/in-memory-course-repository.ts

import { Either, left, right } from "@/core/either";
import { ICourseRepository } from "@/domain/course-catalog/application/repositories/i-course-repository";
import { Course } from "@/domain/course-catalog/enterprise/entities/course.entity";

export class InMemoryCourseRepository implements ICourseRepository {
  public items: Course[] = [];


  async findByTitle(title: string): Promise<Either<Error, Course>> {
    const found = this.items.find((c) => c.title === title);
    if (found) {
      return right(found);
    }
    return left(new Error("Not found"));
  }


  async create(course: Course): Promise<Either<Error, void>> {
    this.items.push(course);
    return right(undefined);
  }

  async findAll(): Promise<Either<Error, Course[]>> {
    return right(this.items);
  }
}