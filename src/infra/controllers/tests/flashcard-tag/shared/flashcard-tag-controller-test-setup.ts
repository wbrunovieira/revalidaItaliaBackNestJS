//src/infra/controllers/tests/flashcard-tag/shared/flashcard-tag-controller-test-setup.ts
import { FlashcardTagController } from '@/infra/controllers/flashcard-tag.controller';
import { CreateFlashcardTagUseCase } from '@/domain/flashcard/application/use-cases/create-flashcard-tag.use-case';
import { GetFlashcardTagByIdUseCase } from '@/domain/flashcard/application/use-cases/get-flashcard-tag-by-id.use-case';
import { ListAllFlashcardTagsUseCase } from '@/domain/flashcard/application/use-cases/list-all-flashcard-tags.use-case';

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

export class MockListAllFlashcardTagsUseCase {
  async execute(request: any): Promise<any> {
    // Mock implementation - will be overridden in tests
    return undefined;
  }
}

export class FlashcardTagControllerTestSetup {
  public createFlashcardTagUseCase: MockCreateFlashcardTagUseCase;
  public getFlashcardTagByIdUseCase: MockGetFlashcardTagByIdUseCase;
  public listAllFlashcardTagsUseCase: MockListAllFlashcardTagsUseCase;
  public controller: FlashcardTagController;

  constructor() {
    this.createFlashcardTagUseCase = new MockCreateFlashcardTagUseCase();
    this.getFlashcardTagByIdUseCase = new MockGetFlashcardTagByIdUseCase();
    this.listAllFlashcardTagsUseCase = new MockListAllFlashcardTagsUseCase();
    this.controller = new FlashcardTagController(
      this.createFlashcardTagUseCase as any,
      this.getFlashcardTagByIdUseCase as any,
      this.listAllFlashcardTagsUseCase as any,
    );
  }

  reset(): void {
    this.createFlashcardTagUseCase = new MockCreateFlashcardTagUseCase();
    this.getFlashcardTagByIdUseCase = new MockGetFlashcardTagByIdUseCase();
    this.listAllFlashcardTagsUseCase = new MockListAllFlashcardTagsUseCase();
    this.controller = new FlashcardTagController(
      this.createFlashcardTagUseCase as any,
      this.getFlashcardTagByIdUseCase as any,
      this.listAllFlashcardTagsUseCase as any,
    );
  }
}
