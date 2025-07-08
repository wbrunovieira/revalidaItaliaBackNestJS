// src/domain/assessment/enterprise/entities/argument.entity.ts
import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

export interface ArgumentProps {
  title: string;
  assessmentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Argument extends Entity<ArgumentProps> {
  private touch(): void {
    this.props.updatedAt = new Date();
  }

  public get title(): string {
    return this.props.title;
  }

  public get assessmentId(): string {
    return this.props.assessmentId;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateTitle(title: string): void {
    if (!title.trim()) {
      throw new Error('Title cannot be empty');
    }
    this.props.title = title;
    this.touch();
  }

  public toResponseObject(): {
    id: string;
    title: string;
    assessmentId: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.toString(),
      title: this.title,
      assessmentId: this.assessmentId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public static create(
    props: Omit<ArgumentProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Argument {
    const now = new Date();

    if (!props.title.trim()) {
      throw new Error('Title cannot be empty');
    }

    return new Argument(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(props: ArgumentProps, id: UniqueEntityID): Argument {
    return new Argument(props, id);
  }
}