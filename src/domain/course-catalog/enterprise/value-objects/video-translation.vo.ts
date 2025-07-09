// src/domain/course-catalog/enterprise/value-objects/video-translation.vo.ts
export class VideoTranslationVO {
  constructor(
    public readonly locale: 'pt' | 'it' | 'es',
    public readonly title: string,
    public readonly description: string,
  ) {}
}
