// src/domain/assessment/enterprise/entities/answer.entity.ts
import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { AnswerTranslationVO } from '../value-objects/answer-translation.vo';

export interface AnswerProps {
  correctOptionId?: string;
  explanation: string;
  questionId: string;
  translations: AnswerTranslationVO[];
  createdAt: Date;
  updatedAt: Date;
}

export class Answer extends Entity<AnswerProps> {
  private touch(): void {
    this.props.updatedAt = new Date();
  }

  public get correctOptionId(): string | undefined {
    return this.props.correctOptionId;
  }

  public get explanation(): string {
    return this.props.explanation;
  }

  public get questionId(): string {
    return this.props.questionId;
  }

  public get translations(): AnswerTranslationVO[] {
    return this.props.translations;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateCorrectOption(optionId: string): void {
    this.props.correctOptionId = optionId;
    this.touch();
  }

  public clearCorrectOption(): void {
    this.props.correctOptionId = undefined;
    this.touch();
  }

  public updateExplanation(explanation: string): void {
    if (!explanation.trim()) {
      throw new Error('Explanation cannot be empty');
    }
    this.props.explanation = explanation;
    this.touch();
  }

  public addTranslation(translation: AnswerTranslationVO): void {
    const existingIndex = this.props.translations.findIndex(
      (t) => t.locale === translation.locale
    );
    
    if (existingIndex >= 0) {
      this.props.translations[existingIndex] = translation;
    } else {
      this.props.translations.push(translation);
    }
    this.touch();
  }

  public removeTranslation(locale: 'pt' | 'it' | 'es'): void {
    this.props.translations = this.props.translations.filter(
      (t) => t.locale !== locale
    );
    this.touch();
  }

  public getTranslationByLocale(locale: 'pt' | 'it' | 'es'): AnswerTranslationVO | undefined {
    return this.props.translations.find((t) => t.locale === locale);
  }

  public hasCorrectOption(): boolean {
    return this.props.correctOptionId !== undefined;
  }

  public toResponseObject(): {
    id: string;
    correctOptionId?: string;
    explanation: string;
    questionId: string;
    translations: Array<{
      locale: string;
      explanation: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.toString(),
      correctOptionId: this.correctOptionId,
      explanation: this.explanation,
      questionId: this.questionId,
      translations: this.translations.map((t) => ({
        locale: t.locale,
        explanation: t.explanation,
      })),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public static create(
    props: Omit<AnswerProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Answer {
    const now = new Date();

    if (!props.explanation.trim()) {
      throw new Error('Explanation cannot be empty');
    }

    return new Answer(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(props: AnswerProps, id: UniqueEntityID): Answer {
    return new Answer(props, id);
  }
}