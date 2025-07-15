// src/domain/flashcard/application/dtos/create-flashcard-response.dto.ts

export interface CreateFlashcardResponseDto {
  flashcard: {
    id: string;
    slug: string;
    question: {
      type: 'TEXT' | 'IMAGE';
      content: string;
    };
    answer: {
      type: 'TEXT' | 'IMAGE';
      content: string;
    };
    argumentId: string;
    tagIds: string[];
    importBatchId?: string;
    exportedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}