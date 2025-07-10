//src/core/utils/text-to-slug.ts
export function textToSlug(text: string): string {
  return text
    .normalize('NFD') // Normaliza para decompor acentos
    .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
    .toLowerCase() // Converte para minúsculas
    .replace(/[^\w\s-]/g, '') // Remove caracteres não alfanuméricos (exceto espaços e hífens)
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/--+/g, '-') // Remove hífens duplicados
    .replace(/^-+/, '') // Remove hífens do início
    .replace(/-+$/, ''); // Remove hífens do fim
}
