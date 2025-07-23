export interface SaveLessonProgressRequestDto {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  moduleId: string;
  moduleTitle: string;
  moduleSlug: string;
  lessonImageUrl: string;
  videoProgress: {
    currentTime: number;
    duration: number;
    percentage: number;
  };
}