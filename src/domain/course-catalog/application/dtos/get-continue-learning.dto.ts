export interface GetContinueLearningRequest {
  userId: string;
}

export interface ContinueLearningData {
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  moduleTitle: string;
  lessonImageUrl: string;
  videoProgress: {
    currentTime: number;
    duration: number;
    percentage: number;
  };
  lessonUrl: string;
  lastUpdatedAt: string;
}

export interface GetContinueLearningResponse {
  hasProgress: boolean;
  lastAccessed?: ContinueLearningData;
}
