// src/test/repositories/in-memory-assessment-repository.ts
import { Either, left, right } from '@/core/either';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { IAssessmentRepository } from '@/domain/assessment/application/repositories/i-assessment-repository';
import { PaginationParams } from '@/core/repositories/pagination-params';

export class InMemoryAssessmentRepository implements IAssessmentRepository {
  public items: Assessment[] = [];

  async findById(id: string): Promise<Either<Error, Assessment>> {
    const assessment = this.items.find((item) => item.id.toString() === id);
    if (!assessment) {
      return left(new Error('Assessment not found'));
    }
    return right(assessment);
  }

  async findByTitle(title: string): Promise<Either<Error, Assessment>> {
    const assessment = this.items.find((item) => item.title === title);
    if (!assessment) {
      return left(new Error('Assessment not found'));
    }
    return right(assessment);
  }

  async findByLessonId(lessonId: string): Promise<Either<Error, Assessment[]>> {
    const assessments = this.items.filter((item) => item.lessonId === lessonId);
    return right(assessments);
  }

  async create(assessment: Assessment): Promise<Either<Error, void>> {
    this.items.push(assessment);
    return right(undefined);
  }

  async findAll(): Promise<Either<Error, Assessment[]>> {
    return right([...this.items]);
  }

  async update(assessment: Assessment): Promise<Either<Error, void>> {
    const index = this.items.findIndex((item) => item.id.equals(assessment.id));
    if (index === -1) {
      return left(new Error('Assessment not found'));
    }
    this.items[index] = assessment;
    return right(undefined);
  }

  async delete(id: string): Promise<Either<Error, void>> {
    const index = this.items.findIndex((item) => item.id.toString() === id);
    if (index === -1) {
      return left(new Error('Assessment not found'));
    }
    this.items.splice(index, 1);
    return right(undefined);
  }

  async findByTitleExcludingId(
    title: string,
    excludeId: string,
  ): Promise<Either<Error, Assessment>> {
    const assessment = this.items.find(
      (item) => item.title === title && item.id.toString() !== excludeId,
    );
    if (!assessment) {
      return left(new Error('Assessment not found'));
    }
    return right(assessment);
  }
}
