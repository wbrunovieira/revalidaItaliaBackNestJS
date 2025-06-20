import { TranslationDto } from './create-course.dto';

export interface CreateCourseRequest {
  slug: string;
  imageUrl?: string;
  translations: TranslationDto[];
}
