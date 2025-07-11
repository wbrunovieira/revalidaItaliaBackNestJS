// src/domain/assessment/enterprise/entities/argument.entity.ts
import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

export interface ArgumentProps {
  title: string;
  assessmentId?: UniqueEntityID;
  createdAt: Date;
  updatedAt: Date;
}

export class Argument extends Entity<ArgumentProps> {
  private touch() {
    this.props.updatedAt = new Date();
  }

  // Getters
  public get title(): string {
    return this.props.title;
  }

  public get assessmentId(): UniqueEntityID | undefined {
    return this.props.assessmentId;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Methods
  public update(props: Partial<Pick<ArgumentProps, 'title'>>) {
    if (props.title !== undefined) {
      this.props.title = props.title;
    }

    this.touch();
  }

  // Response Mapping
  public toResponseObject() {
    return {
      id: this.id.toString(),
      title: this.title,
      assessmentId: this.assessmentId?.toString(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Factory Methods
  public static create(
    props: Omit<ArgumentProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Argument {
    const now = new Date();
    return new Argument(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(
    props: ArgumentProps,
    id: UniqueEntityID,
  ): Argument {
    return new Argument(props, id);
  }
}
