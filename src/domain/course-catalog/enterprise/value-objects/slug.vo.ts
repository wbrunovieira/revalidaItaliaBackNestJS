// src/domain/course-catalog/enterprise/value-objects/slug.vo.ts
export class SlugVO {
  private readonly value: string;

  private constructor(slug: string) {
    this.value = slug;
  }

  public get(): string {
    return this.value;
  }

  public static create(raw: string): SlugVO {
    const normalized = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (normalized.length < 3) {
      throw new Error('Slug must be at least 3 characters long'); // ou crie um InvalidSlugError
    }

    return new SlugVO(normalized);
  }
}
