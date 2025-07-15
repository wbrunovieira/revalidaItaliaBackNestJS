import { z } from 'zod';

export const listAllFlashcardTagsSchema = z.object({
  // Este use-case não requer parâmetros de entrada
  // Schema vazio mas seguindo o padrão do projeto
}).strict();

export type ListAllFlashcardTagsSchema = z.infer<typeof listAllFlashcardTagsSchema>;