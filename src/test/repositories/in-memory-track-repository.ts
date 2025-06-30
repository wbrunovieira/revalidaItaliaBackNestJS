// src/test/repositories/in-memory-track-repository.ts

import { Either, left, right } from '@/core/either';
import { ITrackRepository } from '@/domain/course-catalog/application/repositories/i-track-repository';
import { Track } from '@/domain/course-catalog/enterprise/entities/track.entity';
import { TrackDependencyInfo } from '@/domain/course-catalog/application/dtos/track-dependencies.dto';

export class InMemoryTrackRepository implements ITrackRepository {
  public items: Track[] = [];

  // Simular cursos para testes de dependências
  public mockCourseDependencies: Map<
    string,
    Array<{ id: string; slug: string; title: string }>
  > = new Map();

  async findBySlug(slug: string): Promise<Either<Error, Track>> {
    const found = this.items.find((t) => t.slug === slug);
    return found ? right(found) : left(new Error('Not found'));
  }

  async findById(id: string): Promise<Either<Error, Track>> {
    const found = this.items.find((t) => t.id.toString() === id);
    return found ? right(found) : left(new Error('Not found'));
  }

  async create(track: Track): Promise<Either<Error, void>> {
    this.items.push(track);
    return right(undefined);
  }

  async findAll(): Promise<Either<Error, Track[]>> {
    return right(this.items);
  }

  async delete(id: string): Promise<Either<Error, void>> {
    const index = this.items.findIndex((t) => t.id.toString() === id);
    if (index === -1) {
      return left(new Error('Track not found'));
    }
    this.items.splice(index, 1);
    return right(undefined);
  }

  async checkTrackDependencies(
    id: string,
  ): Promise<Either<Error, TrackDependencyInfo>> {
    const track = this.items.find((t) => t.id.toString() === id);
    if (!track) {
      return left(new Error('Track not found'));
    }

    // Simular dependências baseadas nos courseIds do track
    const dependencies = track.courseIds.map((courseId, index) => ({
      type: 'course' as const,
      id: courseId,
      slug: `course-${index + 1}`,
      name: `Course ${index + 1}`,
    }));

    // Verificar se há mock dependencies definidas
    const mockDeps = this.mockCourseDependencies.get(id);
    if (mockDeps) {
      const mappedDeps = mockDeps.map((dep) => ({
        type: 'course' as const,
        id: dep.id,
        slug: dep.slug,
        name: dep.title,
      }));

      return right({
        canDelete: mappedDeps.length === 0,
        totalDependencies: mappedDeps.length,
        summary: {
          courses: mappedDeps.length,
        },
        dependencies: mappedDeps,
      });
    }

    return right({
      canDelete: dependencies.length === 0,
      totalDependencies: dependencies.length,
      summary: {
        courses: dependencies.length,
      },
      dependencies,
    });
  }
}
