// src/domain/assessment/enterprise/entities/attempt-answer.entity.ts
import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { AttemptStatusVO } from '../value-objects/attempt-status.vo';

export interface AttemptAnswerProps {
  selectedOptionId?: string;
  textAnswer?: string;
  status: AttemptStatusVO;
  isCorrect?: boolean;
  teacherComment?: string;
  attemptId: string;
  questionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AttemptAnswer extends Entity<AttemptAnswerProps> {
  private touch(): void {
    this.props.updatedAt = new Date();
  }

  public get selectedOptionId(): string | undefined {
    return this.props.selectedOptionId;
  }

  public get textAnswer(): string | undefined {
    return this.props.textAnswer;
  }

  public get status(): AttemptStatusVO {
    return this.props.status;
  }

  public get isCorrect(): boolean | undefined {
    return this.props.isCorrect;
  }

  public get teacherComment(): string | undefined {
    return this.props.teacherComment;
  }

  public get attemptId(): string {
    return this.props.attemptId;
  }

  public get questionId(): string {
    return this.props.questionId;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public selectOption(optionId: string): void {
    if (!this.status.isInProgress()) {
      throw new Error('Can only select options for answers in progress');
    }
    
    this.props.selectedOptionId = optionId;
    this.props.textAnswer = undefined; // Clear text answer when selecting option
    this.touch();
  }

  public answerText(text: string): void {
    if (!this.status.isInProgress()) {
      throw new Error('Can only answer text for answers in progress');
    }
    
    this.props.textAnswer = text;
    this.props.selectedOptionId = undefined; // Clear option when answering text
    this.touch();
  }

  public submit(): void {
    if (!this.status.isInProgress()) {
      throw new Error('Can only submit answers that are in progress');
    }
    
    this.props.status = new AttemptStatusVO('SUBMITTED');
    this.touch();
  }

  public grade(isCorrect: boolean, teacherComment?: string): void {
    if (!this.status.isSubmitted() && !this.status.isGrading()) {
      throw new Error('Can only grade submitted or grading answers');
    }
    
    this.props.status = new AttemptStatusVO('GRADED');
    this.props.isCorrect = isCorrect;
    this.props.teacherComment = teacherComment;
    this.touch();
  }

  public addTeacherComment(comment: string): void {
    this.props.teacherComment = comment;
    this.touch();
  }

  public removeTeacherComment(): void {
    this.props.teacherComment = undefined;
    this.touch();
  }

  public isMultipleChoice(): boolean {
    return this.props.selectedOptionId !== undefined;
  }

  public isOpenAnswer(): boolean {
    return this.props.textAnswer !== undefined;
  }

  public hasAnswer(): boolean {
    return this.isMultipleChoice() || this.isOpenAnswer();
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

  public hasTeacherComment(): boolean {
    return this.props.teacherComment !== undefined;
  }

  public toResponseObject(): {
    id: string;
    selectedOptionId?: string;
    textAnswer?: string;
    status: string;
    isCorrect?: boolean;
    teacherComment?: string;
    attemptId: string;
    questionId: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.toString(),
      selectedOptionId: this.selectedOptionId,
      textAnswer: this.textAnswer,
      status: this.status.getValue(),
      isCorrect: this.isCorrect,
      teacherComment: this.teacherComment,
      attemptId: this.attemptId,
      questionId: this.questionId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public static create(
    props: Omit<AttemptAnswerProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): AttemptAnswer {
    const now = new Date();

    return new AttemptAnswer(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(props: AttemptAnswerProps, id: UniqueEntityID): AttemptAnswer {
    return new AttemptAnswer(props, id);
  }
}