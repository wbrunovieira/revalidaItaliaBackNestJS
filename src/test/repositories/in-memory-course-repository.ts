// src/test/repositories/in-memory-course-repository.ts
import { Either, left, right } from '@/core/either';
import {
  CourseDependency,
  CourseDependencyInfo,
} from '@/domain/course-catalog/application/dtos/course-dependencies.dto';
import { ICourseRepository } from '@/domain/course-catalog/application/repositories/i-course-repository';
import { Course } from '@/domain/course-catalog/enterprise/entities/course.entity';

export class InMemoryCourseRepository implements ICourseRepository {
  public items: Course[] = [];

  async findByTitle(title: string): Promise<Either<Error, Course>> {
    const found = this.items.find((c) => c.title === title);
    if (found) {
      return right(found);
    }
    return left(new Error('Not found'));
  }

  async create(course: Course): Promise<Either<Error, void>> {
    this.items.push(course);
    return right(undefined);
  }

  async findAll(): Promise<Either<Error, Course[]>> {
    return right(this.items);
  }

  async findById(id: string): Promise<Either<Error, Course>> {
    const found = this.items.find((c) => c.id.toString() === id);
    if (found) {
      return right(found);
    }
    return left(new Error('Course not found'));
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      const index = this.items.findIndex(
        (course) => course.id.toString() === id,
      );

      if (index === -1) {
        return left(new Error('Course not found'));
      }

      this.items.splice(index, 1);
      return right(undefined);
    } catch (err: any) {
      return left(new Error('Failed to delete course'));
    }
  }

  async checkCourseDependencies(
    courseId: string,
  ): Promise<Either<Error, CourseDependencyInfo>> {
    try {
      const course = this.items.find((c) => c.id.toString() === courseId);

      if (!course) {
        return left(new Error('Course not found'));
      }

      // Simular verificação de dependências para testes
      const dependencies: CourseDependency[] = [];

      // Verificar se o curso tem propriedade modules (injetada nos testes)
      const courseWithModules = course as any;
      if (courseWithModules.modules && courseWithModules.modules.length > 0) {
        courseWithModules.modules.forEach((module: any, index: number) => {
          dependencies.push({
            type: 'module',
            id: module.id || `module-${index}`,
            name: module.slug || `Module ${index + 1}`,
            description: `Test module ${index + 1}`,
            actionRequired: `Delete module "${module.slug || `Module ${index + 1}`}" first`,
            relatedEntities: {
              lessons: module.lessons?.length || 2,
              videos: module.videos?.length || 5,
            },
          });
        });
      }

      // Verificar tracks (simulado para testes)
      if (courseWithModules.tracks && courseWithModules.tracks.length > 0) {
        courseWithModules.tracks.forEach((track: any, index: number) => {
          dependencies.push({
            type: 'track',
            id: track.id || `track-${index}`,
            name: track.name || `Track ${index + 1}`,
            description: track.description || `Test track ${index + 1}`,
            actionRequired: `Remove course from track "${track.name || `Track ${index + 1}`}" first`,
          });
        });
      }

      const result: CourseDependencyInfo = {
        canDelete: dependencies.length === 0,
        dependencies,
        totalDependencies: dependencies.length,
        summary: {
          modules: courseWithModules.modules?.length || 0,
          tracks: courseWithModules.tracks?.length || 0,
          lessons: dependencies
            .filter((d) => d.type === 'module')
            .reduce((acc, dep) => acc + (dep.relatedEntities?.lessons || 0), 0),
          videos: dependencies
            .filter((d) => d.type === 'module')
            .reduce((acc, dep) => acc + (dep.relatedEntities?.videos || 0), 0),
        },
      };

      return right(result);
    } catch (err: any) {
      return left(new Error('Failed to check course dependencies'));
    }
  }
}
