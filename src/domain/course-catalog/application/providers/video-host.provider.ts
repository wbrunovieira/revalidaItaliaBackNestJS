// src/domain/course-catalog/application/providers/video-host.provider.ts
export interface VideoHostProvider {
  getMetadata(videoId: string): Promise<{ durationInSeconds: number }>;
  getEmbedUrl(videoId: string): string;
}