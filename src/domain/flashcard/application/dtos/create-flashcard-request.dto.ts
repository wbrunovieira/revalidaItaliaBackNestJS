// src/domain/flashcard/application/dtos/create-flashcard-request.dto.ts

export interface CreateFlashcardRequestDto {
  question: {
    type: 'TEXT' | 'IMAGE';
    content: string;
  };
  answer: {
    type: 'TEXT' | 'IMAGE';
    content: string;
  };
  argumentId: string;
  tagIds?: string[];
  slug?: string;
  importBatchId?: string;
}
