// src/domain/course-catalog/enterprise/value-objects/document-translation.vo.ts
export class DocumentTranslationVO {
  constructor(
    public readonly locale: 'pt' | 'it' | 'es',
    public readonly title: string,
    public readonly description: string,
  ) {}

  static create(props: {
    locale: 'pt' | 'it' | 'es';
    title: string;
    description: string;
  }): DocumentTranslationVO {
    return new DocumentTranslationVO(
      props.locale,
      props.title,
      props.description,
    );
  }

  equals(other: DocumentTranslationVO): boolean {
    return (
      this.locale === other.locale &&
      this.title === other.title &&
      this.description === other.description
    );
  }
}
