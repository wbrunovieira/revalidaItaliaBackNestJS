// src/domain/course-catalog/enterprise/value-objects/track-translation.vo.ts
export class TrackTranslationVO {
  constructor(
    public readonly locale: "pt" | "it" | "es",
    public readonly title: string,
    public readonly description: string
  ) {}
}