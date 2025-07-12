// src/domain/assessment/enterprise/entities/question-option.entity.ts
import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

export interface QuestionOptionProps {
  text: string;
  questionId: UniqueEntityID;
  createdAt: Date;
  updatedAt: Date;
}

export class QuestionOption extends Entity<QuestionOptionProps> {
  private touch(): void {
    this.props.updatedAt = new Date();
  }

  public get text(): string {
    return this.props.text;
  }

  public get questionId(): UniqueEntityID {
    return this.props.questionId;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateText(text: string): void {
    if (!text.trim()) {
      throw new Error('Option text cannot be empty');
    }
    this.props.text = text;
    this.touch();
  }

  public update(props: Partial<Pick<QuestionOptionProps, 'text'>>) {
    if (props.text !== undefined) {
      this.updateText(props.text);
    }
  }

  public toResponseObject(): {
    id: string;
    text: string;
    questionId: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.toString(),
      text: this.text,
      questionId: this.questionId.toString(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public static create(
    props: Omit<QuestionOptionProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): QuestionOption {
    const now = new Date();

    if (!props.text.trim()) {
      throw new Error('Option text cannot be empty');
    }

    return new QuestionOption(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(
    props: QuestionOptionProps,
    id: UniqueEntityID,
  ): QuestionOption {
    return new QuestionOption(props, id);
  }
}
