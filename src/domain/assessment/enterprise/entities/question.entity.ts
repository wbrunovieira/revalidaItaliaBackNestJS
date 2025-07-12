// src/domain/assessment/enterprise/entities/question.entity.ts
import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { QuestionTypeVO } from '../value-objects/question-type.vo';

export interface QuestionProps {
  text: string;
  type: QuestionTypeVO;
  assessmentId: UniqueEntityID;
  argumentId?: UniqueEntityID;
  createdAt: Date;
  updatedAt: Date;
}

export class Question extends Entity<QuestionProps> {
  private touch(): void {
    this.props.updatedAt = new Date();
  }

  public get text(): string {
    return this.props.text;
  }

  public get type(): QuestionTypeVO {
    return this.props.type;
  }

  public get assessmentId(): UniqueEntityID {
    return this.props.assessmentId;
  }

  public get argumentId(): UniqueEntityID | undefined {
    return this.props.argumentId;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateText(text: string): void {
    if (!text.trim()) {
      throw new Error('Question text cannot be empty');
    }
    this.props.text = text;
    this.touch();
  }

  public assignToArgument(argumentId: UniqueEntityID): void {
    this.props.argumentId = argumentId;
    this.touch();
  }

  public removeFromArgument(): void {
    this.props.argumentId = undefined;
    this.touch();
  }

  public isMultipleChoice(): boolean {
    return this.type.isMultipleChoice();
  }

  public isOpen(): boolean {
    return this.type.isOpen();
  }

  public hasArgument(): boolean {
    return this.props.argumentId !== undefined;
  }

  public update(props: Partial<Pick<QuestionProps, 'text'>>) {
    if (props.text !== undefined) {
      this.updateText(props.text);
    }
  }

  public toResponseObject(): {
    id: string;
    text: string;
    type: string;
    assessmentId: string;
    argumentId?: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.toString(),
      text: this.text,
      type: this.type.getValue(),
      assessmentId: this.assessmentId.toString(),
      argumentId: this.argumentId?.toString(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public static create(
    props: Omit<QuestionProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Question {
    const now = new Date();

    if (!props.text.trim()) {
      throw new Error('Question text cannot be empty');
    }

    return new Question(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(
    props: QuestionProps,
    id: UniqueEntityID,
  ): Question {
    return new Question(props, id);
  }
}
