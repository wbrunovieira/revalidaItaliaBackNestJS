import { TranslationDto } from "./create-course.dto";


export interface CreateCourseRequest {
  slug: string;
  translations: TranslationDto[];
}