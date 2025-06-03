// src/domain/course-catalog/enterprise/value-objects/panda-video.vo.ts
export class PandaVideoURL {
  private readonly url: string;
  constructor(pandaVideoId: string) {
    // Exemplo: converte o ID em uma URL completa, ou valida formato
    this.url = `https://panda.streaming/${pandaVideoId}`;
  }
  public toString(): string {
    return this.url;
  }
}