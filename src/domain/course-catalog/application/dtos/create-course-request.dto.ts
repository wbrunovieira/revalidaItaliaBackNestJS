// src/domain/course-catalog/application/dtos/create-course-request.dto.ts
export interface CreateCourseRequest {
  title: string
  description: string
  modules?: Array<{
    title: string
    order: number
  }>
}