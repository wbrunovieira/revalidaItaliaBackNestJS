// src/domain/flashcard/application/dtos/get-flashcard-by-id-request.dto.ts
export interface GetFlashcardByIdFilters {
  includeTags?: boolean; // Include complete tag information
  includeInteractionStats?: boolean; // Include user interaction statistics (for future use)
  includeRelatedFlashcards?: boolean; // Include flashcards from the same argument (for future use)
}

export interface GetFlashcardByIdRequestDto {
  id: string;
  filters?: GetFlashcardByIdFilters;
}
