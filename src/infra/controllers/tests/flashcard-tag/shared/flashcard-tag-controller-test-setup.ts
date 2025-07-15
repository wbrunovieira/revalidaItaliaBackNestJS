//src/infra/controllers/tests/flashcard-tag/shared/flashcard-tag-controller-test-setup.ts
import { FlashcardTagController } from '@/infra/controllers/flashcard-tag.controller';
import { CreateFlashcardTagUseCase } from '@/domain/flashcard/application/use-cases/create-flashcard-tag.use-case';
import { GetFlashcardTagByIdUseCase } from '@/domain/flashcard/application/use-cases/get-flashcard-tag-by-id.use-case';

export class MockCreateFlashcardTagUseCase {
  async execute(request: any): Promise<any> {
    // Mock implementation - will be overridden in tests
    return undefined;
  }
}

export class MockGetFlashcardTagByIdUseCase {
  async execute(request: any): Promise<any> {
    // Mock implementation - will be overridden in tests
    return undefined;
  }
}

export class FlashcardTagControllerTestSetup {
  public createFlashcardTagUseCase: MockCreateFlashcardTagUseCase;
  public getFlashcardTagByIdUseCase: MockGetFlashcardTagByIdUseCase;
  public controller: FlashcardTagController;

  constructor() {
    this.createFlashcardTagUseCase = new MockCreateFlashcardTagUseCase();
    this.getFlashcardTagByIdUseCase = new MockGetFlashcardTagByIdUseCase();
    this.controller = new FlashcardTagController(
      this.createFlashcardTagUseCase as any,
      this.getFlashcardTagByIdUseCase as any,
    );
  }

  reset(): void {
    this.createFlashcardTagUseCase = new MockCreateFlashcardTagUseCase();
    this.getFlashcardTagByIdUseCase = new MockGetFlashcardTagByIdUseCase();
    this.controller = new FlashcardTagController(
      this.createFlashcardTagUseCase as any,
      this.getFlashcardTagByIdUseCase as any,
    );
  }
}
