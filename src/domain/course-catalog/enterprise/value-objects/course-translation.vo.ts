// src/domain/course-catalog/enterprise/value-objects/course-translation.vo.ts
export class CourseTranslationVO {
  constructor(
    public readonly locale: 'pt' | 'it' | 'es',
    public readonly title: string,
    public readonly description: string,
  ) {}
}
