// src/infra/video/panda-video.provider.ts
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ConfigService } from "@nestjs/config";
import { VideoHostProvider } from "@/domain/course-catalog/application/providers/video-host.provider";

@Injectable()
export class PandaVideoProvider implements VideoHostProvider {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService
  ) {}

  private get apiKey(): string {
    const key = this.config.get<string>("PANDA_API_KEY");
    if (!key) throw new InternalServerErrorException('PANDA_API_KEY is not configured');
    return key;
  }

  async getMetadata(videoId: string): Promise<{ durationInSeconds: number }> {
    try {
      const resp = await firstValueFrom(
        this.http.get<{ duration: number }>(
          `https://api.panda.com/videos/${videoId}`,
          { headers: { Authorization: `Bearer ${this.apiKey}` } }
        )
      );
      return { durationInSeconds: resp.data.duration };
    } catch {
      throw new InternalServerErrorException('Failed to fetch video metadata');
    }
  }

  getEmbedUrl(videoId: string): string {
    return `https://player.panda.com/embed/${videoId}`;
  }
}