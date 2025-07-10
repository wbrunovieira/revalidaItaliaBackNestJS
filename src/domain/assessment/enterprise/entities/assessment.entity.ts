// src/domain/assessment/enterprise/entities/assessment.entity.ts
import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

export interface AssessmentProps {
  slug: string;
  title: string;
  description?: string;
  type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
  quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON';
  passingScore: number;
  timeLimitInMinutes?: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  lessonId?: UniqueEntityID;
  createdAt: Date;
  updatedAt: Date;
}

export class Assessment extends Entity<AssessmentProps> {
  private touch() {
    this.props.updatedAt = new Date();
  }

  // Getters
  public get slug(): string {
    return this.props.slug;
  }

  public get title(): string {
    return this.props.title;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get type(): 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA' {
    return this.props.type;
  }

  public get quizPosition(): 'BEFORE_LESSON' | 'AFTER_LESSON' | undefined {
    return this.props.quizPosition;
  }

  public get passingScore(): number {
    return this.props.passingScore;
  }

  public get timeLimitInMinutes(): number | undefined {
    return this.props.timeLimitInMinutes;
  }

  public get randomizeQuestions(): boolean {
    return this.props.randomizeQuestions;
  }

  public get randomizeOptions(): boolean {
    return this.props.randomizeOptions;
  }

  public get lessonId(): UniqueEntityID | undefined {
    return this.props.lessonId;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Methods
  public update(props: Partial<AssessmentProps>) {
    if (props.title !== undefined) this.props.title = props.title;
    if (props.slug !== undefined) this.props.slug = props.slug;
    this.props.description = props.description; // Allow explicit undefined/null to unset
    if (props.type !== undefined) this.props.type = props.type;
    this.props.quizPosition = props.quizPosition; // Allow explicit undefined/null to unset
    if (props.passingScore !== undefined) this.props.passingScore = props.passingScore;
    this.props.timeLimitInMinutes = props.timeLimitInMinutes; // Allow explicit undefined/null to unset
    if (props.randomizeQuestions !== undefined) this.props.randomizeQuestions = props.randomizeQuestions;
    if (props.randomizeOptions !== undefined) this.props.randomizeOptions = props.randomizeOptions;
    this.props.lessonId = props.lessonId; // Allow explicit undefined/null to unset
    this.touch();
  }

  // Response Mapping
  public toResponseObject() {
    return {
      id: this.id.toString(),
      slug: this.slug,
      title: this.title,
      description: this.description,
      type: this.type,
      quizPosition: this.quizPosition,
      passingScore: this.passingScore,
      timeLimitInMinutes: this.timeLimitInMinutes,
      randomizeQuestions: this.randomizeQuestions,
      randomizeOptions: this.randomizeOptions,
      lessonId: this.lessonId?.toString(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Factory Methods
  public static create(
    props: Omit<AssessmentProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Assessment {
    const now = new Date();
    return new Assessment(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(
    props: AssessmentProps,
    id: UniqueEntityID,
  ): Assessment {
    return new Assessment(props, id);
  }
}
