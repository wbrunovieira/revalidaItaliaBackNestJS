// src/domain/course-catalog/application/dtos/update-track-request.dto.ts
export interface UpdateTrackRequest {
  id: string;
  slug?: string;
  imageUrl?: string;
  courseIds?: string[];
  translations?: {
    locale: string;
    title: string;
    description: string;
  }[];
}
