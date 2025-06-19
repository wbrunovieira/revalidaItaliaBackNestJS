export class VideoNotFoundError extends Error {
  constructor() {
    super('Video not found');
    this.name = 'VideoNotFoundError';
  }
}
