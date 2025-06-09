export interface TranslationDto {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description: string;
}

export interface CreateCourseRequest {
  slug: string;
  translations: TranslationDto[];
}