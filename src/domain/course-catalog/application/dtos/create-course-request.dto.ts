// src/domain/course-catalog/application/dtos/create-course-request.dto.ts
export interface CreateCourseRequest {
  translations: Array<{
    locale: "pt" | "it" | "es"
    title: string
    description: string
  }>
  modules?: Array<{
    translations: Array<{
      locale: "pt" | "it" | "es"
      title: string
      description: string
    }>
    order: number
  }>
}