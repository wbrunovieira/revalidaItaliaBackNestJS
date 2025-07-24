// src/domain/assessment/application/dtos/list-pending-reviews-request.dto.ts

export interface ListPendingReviewsRequest {
  requesterId: string;
  page?: number;
  pageSize?: number;
}
