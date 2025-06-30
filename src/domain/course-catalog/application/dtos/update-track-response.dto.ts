// src/domain/course-catalog/application/dtos/update-track-response.dto.ts
export interface UpdateTrackResponse {
  track: {
    id: string;
    slug: string;
    imageUrl?: string;
    courseIds: string[];
    title: string;
    description: string;
    updatedAt: Date;
  };
}
