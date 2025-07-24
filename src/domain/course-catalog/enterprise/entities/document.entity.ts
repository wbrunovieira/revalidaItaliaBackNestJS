import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

// Representa as traduções de documento em diferentes idiomas
export interface DocumentTranslationProps {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description: string;
  url: string;
}

// Propriedades principais do documento (excluindo URL específico de idioma)
export interface DocumentProps {
  filename: string;
  createdAt: Date;
  updatedAt: Date;
  // Traduções por idioma, incluindo URL em cada
  translations: DocumentTranslationProps[];
}

export class Document extends Entity<DocumentProps> {
  private touch() {
    this.props.updatedAt = new Date();
  }

  // Getters para propriedades comuns
  public get filename(): string {
    return this.props.filename;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Retorna todas as traduções (inclui URL por idioma)
  public get translations(): DocumentTranslationProps[] {
    return this.props.translations;
  }

  // Atualiza detalhes básicos (sem tocar traduções)
  public updateDetails(updates: { filename?: string }) {
    if (updates.filename) {
      this.props.filename = updates.filename;
      this.touch();
    }
  }

  // Converte para objeto de resposta incluindo traduções completas
  public toResponseObject(): {
    id: string;
    filename: string;
    createdAt: Date;
    updatedAt: Date;
    translations: DocumentTranslationProps[];
  } {
    return {
      id: this.id.toString(),
      filename: this.props.filename,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      translations: this.props.translations,
    };
  }

  // Cria nova entidade de documento com traduções
  public static create(
    props: Omit<DocumentProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Document {
    const now = new Date();
    return new Document(
      {
        filename: props.filename,
        createdAt: now,
        updatedAt: now,
        translations: props.translations,
      },
      id,
    );
  }

  // Reconstrói entidade a partir de dados completos
  public static reconstruct(
    props: DocumentProps,
    id: UniqueEntityID,
  ): Document {
    return new Document(props, id);
  }
}
