// src/domain/assessment/enterprise/value-objects/attempt-status.vo.ts
export type AttemptStatusValue = 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED';

export class AttemptStatusVO {
  constructor(private readonly value: AttemptStatusValue) {
    this.validate();
  }

  private validate(): void {
    const validStatuses: AttemptStatusValue[] = ['IN_PROGRESS', 'SUBMITTED', 'GRADING', 'GRADED'];
    if (!validStatuses.includes(this.value)) {
      throw new Error(`Invalid attempt status: ${this.value}`);
    }
  }

  public getValue(): AttemptStatusValue {
    return this.value;
  }

  public isInProgress(): boolean {
    return this.value === 'IN_PROGRESS';
  }

  public isSubmitted(): boolean {
    return this.value === 'SUBMITTED';
  }

  public isGrading(): boolean {
    return this.value === 'GRADING';
  }

  public isGraded(): boolean {
    return this.value === 'GRADED';
  }

  public canTransitionTo(newStatus: AttemptStatusValue): boolean {
    const transitions: Record<AttemptStatusValue, AttemptStatusValue[]> = {
      IN_PROGRESS: ['SUBMITTED'],
      SUBMITTED: ['GRADING', 'GRADED'],
      GRADING: ['GRADED'],
      GRADED: []
    };

    return transitions[this.value].includes(newStatus);
  }

  public equals(other: AttemptStatusVO): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}