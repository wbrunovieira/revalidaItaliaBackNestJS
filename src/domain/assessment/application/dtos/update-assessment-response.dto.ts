// src/domain/assessment/application/dtos/update-assessment-response.dto.ts
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';

export interface UpdateAssessmentResponse {
  assessment: Assessment;
}
