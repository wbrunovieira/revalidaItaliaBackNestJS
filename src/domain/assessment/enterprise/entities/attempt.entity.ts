// src/domain/assessment/enterprise/entities/attempt.entity.ts
import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { AttemptStatusVO } from '../value-objects/attempt-status.vo';
import { ScoreVO } from '../value-objects/score.vo';

export interface AttemptProps {
  status: AttemptStatusVO;
  score?: ScoreVO;
  startedAt: Date;
  submittedAt?: Date;
  gradedAt?: Date;
  timeLimitExpiresAt?: Date;
  identityId: string;
  assessmentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Attempt extends Entity<AttemptProps> {
  private touch(): void {
    this.props.updatedAt = new Date();
  }

  public get status(): AttemptStatusVO {
    return this.props.status;
  }

  public get score(): ScoreVO | undefined {
    return this.props.score;
  }

  public get startedAt(): Date {
    return this.props.startedAt;
  }

  public get submittedAt(): Date | undefined {
    return this.props.submittedAt;
  }

  public get gradedAt(): Date | undefined {
    return this.props.gradedAt;
  }

  public get timeLimitExpiresAt(): Date | undefined {
    return this.props.timeLimitExpiresAt;
  }

  public get identityId(): string {
    return this.props.identityId;
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

  public submit(): void {
    if (!this.status.isInProgress()) {
      throw new Error('Can only submit attempts that are in progress');
    }

    this.props.status = new AttemptStatusVO('SUBMITTED');
    this.props.submittedAt = new Date();
    this.touch();
  }

  public startGrading(): void {
    if (!this.status.isSubmitted()) {
      throw new Error('Can only start grading submitted attempts');
    }

    this.props.status = new AttemptStatusVO('GRADING');
    this.touch();
  }

  public grade(score: ScoreVO): void {
    if (!this.status.isSubmitted() && !this.status.isGrading()) {
      throw new Error('Can only grade submitted or grading attempts');
    }

    this.props.status = new AttemptStatusVO('GRADED');
    this.props.score = score;
    this.props.gradedAt = new Date();
    this.touch();
  }

  public setTimeLimit(expiresAt: Date): void {
    if (!this.status.isInProgress()) {
      throw new Error('Can only set time limit for attempts in progress');
    }

    this.props.timeLimitExpiresAt = expiresAt;
    this.touch();
  }

  public isInProgress(): boolean {
    return this.status.isInProgress();
  }

  public isSubmitted(): boolean {
    return this.status.isSubmitted();
  }

  public isGrading(): boolean {
    return this.status.isGrading();
  }

  public isGraded(): boolean {
    return this.status.isGraded();
  }

  public hasScore(): boolean {
    return this.props.score !== undefined;
  }

  public hasTimeLimit(): boolean {
    return this.props.timeLimitExpiresAt !== undefined;
  }

  public isExpired(): boolean {
    if (!this.hasTimeLimit()) {
      return false;
    }
    return new Date() > this.props.timeLimitExpiresAt!;
  }

  public getRemainingTime(): number {
    if (!this.hasTimeLimit()) {
      return Infinity;
    }

    const now = new Date();
    const remaining = this.props.timeLimitExpiresAt!.getTime() - now.getTime();
    return Math.max(0, remaining);
  }

  public toResponseObject(): {
    id: string;
    status: string;
    score?: number;
    startedAt: Date;
    submittedAt?: Date;
    gradedAt?: Date;
    timeLimitExpiresAt?: Date;
    identityId: string;
    assessmentId: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.toString(),
      status: this.status.getValue(),
      score: this.score?.getValue(),
      startedAt: this.startedAt,
      submittedAt: this.submittedAt,
      gradedAt: this.gradedAt,
      timeLimitExpiresAt: this.timeLimitExpiresAt,
      identityId: this.identityId,
      assessmentId: this.assessmentId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public static create(
    props: Omit<AttemptProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Attempt {
    const now = new Date();

    return new Attempt(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(props: AttemptProps, id: UniqueEntityID): Attempt {
    return new Attempt(props, id);
  }
}
