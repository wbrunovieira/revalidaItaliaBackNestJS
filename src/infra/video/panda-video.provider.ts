// src/infra/video/panda-video.provider.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { VideoHostProvider } from '@/domain/course-catalog/application/providers/video-host.provider';

@Injectable()
export class PandaVideoProvider implements VideoHostProvider {
  private readonly logger = new Logger(PandaVideoProvider.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService
  ) {
    this.baseUrl = this.config.get<string>('PANDA_API_BASE_URL')!;
    this.apiKey   = this.config.get<string>('PANDA_API_KEY')!;
    this.logger.debug(`Loaded PANDA_API_BASE_URL=${this.baseUrl}`);
  }

  async getMetadata(videoId: string): Promise<{ durationInSeconds: number }> {
    const url = `${this.baseUrl}/videos/${videoId}`;
    this.logger.log(`Fetching metadata: GET ${url}`);
    try {
      const resp = await firstValueFrom(
        this.http.get<{ length: number }>(url, {
          headers: {
            accept:        'application/json',
            Authorization: this.apiKey,   // conforme doc “Get video properties”
          },
        })
      );
      this.logger.log(`Received length=${resp.data.length}`);
      return { durationInSeconds: resp.data.length };
    } catch (err: any) {
      this.logger.error(
        `Failed to fetch metadata for videoId=${videoId}; status=${err.response?.status}`,
        err.response?.data || err.stack
      );
      throw new InternalServerErrorException('Failed to fetch video metadata');
    }
  }

  getEmbedUrl(videoId: string): string {
    return `${this.baseUrl.replace(/\/?$/, '')}/embed/${videoId}`;
  }
}