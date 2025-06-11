export class VideoNotFoundError extends Error {
  constructor() {
    super('Vídeo não encontrado');
    this.name = 'VideoNotFoundError';
  }
}