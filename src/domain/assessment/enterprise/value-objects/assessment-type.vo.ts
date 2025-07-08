// src/domain/assessment/enterprise/value-objects/assessment-type.vo.ts
export type AssessmentTypeValue = 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';

export class AssessmentTypeVO {
  constructor(private readonly value: AssessmentTypeValue) {
    this.validate();
  }

  private validate(): void {
    const validTypes: AssessmentTypeValue[] = ['QUIZ', 'SIMULADO', 'PROVA_ABERTA'];
    if (!validTypes.includes(this.value)) {
      throw new Error(`Invalid assessment type: ${this.value}`);
    }
  }

  public getValue(): AssessmentTypeValue {
    return this.value;
  }

  public isQuiz(): boolean {
    return this.value === 'QUIZ';
  }

  public isSimulado(): boolean {
    return this.value === 'SIMULADO';
  }

  public isProvaAberta(): boolean {
    return this.value === 'PROVA_ABERTA';
  }

  public equals(other: AssessmentTypeVO): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}