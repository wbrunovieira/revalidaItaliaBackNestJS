// src/domain/course-catalog/enterprise/value-objects/module-translation.vo.ts
export class ModuleTranslationVO {
  constructor(
    public readonly locale: 'pt' | 'it' | 'es',
    public readonly title: string,
    public readonly description: string,
  ) {}
}
