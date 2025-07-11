export interface ArgumentDto {
  id: string;
  title: string;
  assessmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ListArgumentsResponse {
  arguments: ArgumentDto[];
  pagination: PaginationInfo;
}
