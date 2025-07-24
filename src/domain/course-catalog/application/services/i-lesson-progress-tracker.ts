export interface VideoProgress {
  currentTime: number;
  duration: number;
  percentage: number;
}

export interface LessonProgressData {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  moduleId: string;
  moduleTitle: string;
  moduleSlug: string;
  lessonImageUrl: string;
  videoProgress: VideoProgress;
  lastUpdatedAt?: string;
}

export abstract class ILessonProgressTracker {
  abstract saveProgress(
    userId: string,
    data: LessonProgressData,
  ): Promise<void>;
  abstract getContinueLearning(
    userId: string,
  ): Promise<LessonProgressData | null>;
}
