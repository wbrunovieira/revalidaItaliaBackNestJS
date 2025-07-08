// src/domain/assessment/enterprise/entities/assessment.entity.ts
import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { AssessmentTypeVO } from '../value-objects/assessment-type.vo';
import { QuizPositionVO } from '../value-objects/quiz-position.vo';

export interface AssessmentProps {
  title: string;
  description?: string;
  type: AssessmentTypeVO;
  quizPosition?: QuizPositionVO;
  passingScore: number;
  timeLimitInMinutes?: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  lessonId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Assessment extends Entity<AssessmentProps> {
  private touch(): void {
    this.props.updatedAt = new Date();
  }

  public get title(): string {
    return this.props.title;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get type(): AssessmentTypeVO {
    return this.props.type;
  }

  public get quizPosition(): QuizPositionVO | undefined {
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

  public get lessonId(): string | undefined {
    return this.props.lessonId;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateTitle(title: string): void {
    this.props.title = title;
    this.touch();
  }

  public updateDescription(description: string): void {
    this.props.description = description;
    this.touch();
  }

  public updatePassingScore(score: number): void {
    if (score < 0 || score > 100) {
      throw new Error('Passing score must be between 0 and 100');
    }
    this.props.passingScore = score;
    this.touch();
  }

  public updateTimeLimit(minutes: number): void {
    if (minutes <= 0) {
      throw new Error('Time limit must be positive');
    }
    this.props.timeLimitInMinutes = minutes;
    this.touch();
  }

  public removeTimeLimit(): void {
    this.props.timeLimitInMinutes = undefined;
    this.touch();
  }

  public enableRandomizeQuestions(): void {
    this.props.randomizeQuestions = true;
    this.touch();
  }

  public disableRandomizeQuestions(): void {
    this.props.randomizeQuestions = false;
    this.touch();
  }

  public enableRandomizeOptions(): void {
    this.props.randomizeOptions = true;
    this.touch();
  }

  public disableRandomizeOptions(): void {
    this.props.randomizeOptions = false;
    this.touch();
  }

  public updateQuizPosition(position: QuizPositionVO): void {
    if (!this.type.isQuiz()) {
      throw new Error('Quiz position can only be set for quiz assessments');
    }
    this.props.quizPosition = position;
    this.touch();
  }

  public isQuiz(): boolean {
    return this.type.isQuiz();
  }

  public isSimulado(): boolean {
    return this.type.isSimulado();
  }

  public isProvaAberta(): boolean {
    return this.type.isProvaAberta();
  }

  public hasTimeLimit(): boolean {
    return this.props.timeLimitInMinutes !== undefined;
  }

  public toResponseObject(): {
    id: string;
    title: string;
    description?: string;
    type: string;
    quizPosition?: string;
    passingScore: number;
    timeLimitInMinutes?: number;
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
    lessonId?: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.toString(),
      title: this.title,
      description: this.description,
      type: this.type.getValue(),
      quizPosition: this.quizPosition?.getValue(),
      passingScore: this.passingScore,
      timeLimitInMinutes: this.timeLimitInMinutes,
      randomizeQuestions: this.randomizeQuestions,
      randomizeOptions: this.randomizeOptions,
      lessonId: this.lessonId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public static create(
    props: Omit<AssessmentProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Assessment {
    const now = new Date();
    
    // Validações de negócio
    if (props.type.isQuiz() && !props.quizPosition) {
      throw new Error('Quiz position is required for quiz assessments');
    }
    
    if (props.type.isQuiz() && !props.lessonId) {
      throw new Error('Lesson ID is required for quiz assessments');
    }

    if (!props.type.isQuiz() && props.quizPosition) {
      throw new Error('Quiz position can only be set for quiz assessments');
    }

    return new Assessment(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(props: AssessmentProps, id: UniqueEntityID): Assessment {
    return new Assessment(props, id);
  }
}