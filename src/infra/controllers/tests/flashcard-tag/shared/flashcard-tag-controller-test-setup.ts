import { FlashcardTagController } from '@/infra/controllers/flashcard-tag.controller';
import { CreateFlashcardTagUseCase } from '@/domain/flashcard/application/use-cases/create-flashcard-tag.use-case';

export class MockCreateFlashcardTagUseCase {
  async execute(request: any): Promise<any> {
    // Mock implementation - will be overridden in tests
    return undefined;
  }
}

export class FlashcardTagControllerTestSetup {
  public createFlashcardTagUseCase: MockCreateFlashcardTagUseCase;
  public controller: FlashcardTagController;

  constructor() {
    this.createFlashcardTagUseCase = new MockCreateFlashcardTagUseCase();
    this.controller = new FlashcardTagController(
      this.createFlashcardTagUseCase as any,
    );
  }

  reset(): void {
    this.createFlashcardTagUseCase = new MockCreateFlashcardTagUseCase();
    this.controller = new FlashcardTagController(
      this.createFlashcardTagUseCase as any,
    );
  }
}