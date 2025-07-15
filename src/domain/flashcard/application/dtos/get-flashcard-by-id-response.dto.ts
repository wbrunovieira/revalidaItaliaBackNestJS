// src/domain/flashcard/application/dtos/get-flashcard-by-id-response.dto.ts
export interface FlashcardTagDto {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlashcardDetailDto {
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
  importBatchId?: string;
  exportedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields based on filters
  tags?: FlashcardTagDto[];
}

export interface GetFlashcardByIdResponseDto {
  flashcard: FlashcardDetailDto;
}