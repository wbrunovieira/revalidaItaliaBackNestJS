// src/domain/auth/application/use-cases/validations/update-user-profile.schema.ts

import { z } from 'zod';

export const updateUserProfileSchema = z.object({
  userId: z.string().uuid('ID do usuário deve ser um UUID válido'),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  cpf: z.string().min(1, 'Documento é obrigatório').optional(),
  phone: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  profileImageUrl: z.string().refine(
    (value) => {
      // Permite URLs completas ou caminhos relativos como /images/
      return value.startsWith('http://') || 
             value.startsWith('https://') || 
             value.startsWith('/');
    },
    'URL da imagem deve ser uma URL válida ou um caminho relativo iniciando com /'
  ).optional(),
}).refine(
  (data) => {
    // Pelo menos um campo deve ser fornecido para atualização
    const updateableFields = ['name', 'email', 'cpf', 'phone', 'birthDate', 'profileImageUrl'];
    return updateableFields.some(field => data[field] !== undefined);
  },
  {
    message: 'Pelo menos um campo deve ser fornecido para atualização',
  }
);