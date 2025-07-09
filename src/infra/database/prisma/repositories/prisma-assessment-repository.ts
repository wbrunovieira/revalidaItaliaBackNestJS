// // src/infra/database/prisma/repositories/prisma-assessment-repository.ts
// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '@/prisma/prisma.service';
// import { Either, left, right } from '@/core/either';
// import { IAssessmentRepository } from '@/domain/assessment/application/repositories/i-assessment-repository';
// import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
// import { AssessmentTypeVO } from '@/domain/assessment/enterprise/value-objects/assessment-type.vo';
// import { QuizPositionVO } from '@/domain/assessment/enterprise/value-objects/quiz-position.vo';
// import { UniqueEntityID } from '@/core/unique-entity-id';
// import { PaginationParams } from '@/core/repositories/pagination-params';
// import { AssessmentType, QuizPosition } from '@prisma/client';

// @Injectable()
// export class PrismaAssessmentRepository implements IAssessmentRepository {
//   constructor(private readonly prisma: PrismaService) {}

//   async findById(id: string): Promise<Either<Error, Assessment>> {
//     try {
//       const data = await this.prisma.assessment.findUnique({
//         where: { id },
//       });

//       if (!data) {
//         return left(new Error('Assessment not found'));
//       }

//       return right(this.mapToEntity(data));
//     } catch (err: any) {
//       return left(new Error('Database error'));
//     }
//   }

//   async findByTitle(title: string): Promise<Either<Error, Assessment>> {
//     try {
//       const data = await this.prisma.assessment.findFirst({
//         where: { title },
//       });

//       if (!data) {
//         return left(new Error('Assessment not found'));
//       }

//       return right(this.mapToEntity(data));
//     } catch (err: any) {
//       return left(new Error('Database error'));
//     }
//   }

//   async findByLessonId(lessonId: string): Promise<Either<Error, Assessment[]>> {
//     try {
//       const data = await this.prisma.assessment.findMany({
//         where: { lessonId },
//         orderBy: { createdAt: 'desc' },
//       });

//       const assessments = data.map((item) => this.mapToEntity(item));
//       return right(assessments);
//     } catch (err: any) {
//       return left(new Error('Database error'));
//     }
//   }

//   async create(assessment: Assessment): Promise<Either<Error, void>> {
//     try {
//       await this.prisma.assessment.create({
//         data: {
//           id: assessment.id.toString(),
//           title: assessment.title,
//           description: assessment.description,
//           type: assessment.type.getValue() as AssessmentType,
//           quizPosition:
//             assessment.quizPosition?.getValue() as QuizPosition | null,
//           passingScore: assessment.passingScore,
//           timeLimitInMinutes: assessment.timeLimitInMinutes,
//           randomizeQuestions: assessment.randomizeQuestions,
//           randomizeOptions: assessment.randomizeOptions,
//           lessonId: assessment.lessonId,
//           createdAt: assessment.createdAt,
//           updatedAt: assessment.updatedAt,
//         },
//       });

//       return right(undefined);
//     } catch (err: any) {
//       return left(new Error('Failed to create assessment'));
//     }
//   }

//   async findAll(
//     params?: PaginationParams,
//   ): Promise<Either<Error, Assessment[]>> {
//     try {
//       const data = await this.prisma.assessment.findMany({
//         skip:
//           params?.page && params?.pageSize
//             ? (params.page - 1) * params.pageSize
//             : undefined,
//         take: params?.pageSize,
//         orderBy: { createdAt: 'desc' },
//       });

//       const assessments = data.map((item) => this.mapToEntity(item));
//       return right(assessments);
//     } catch (err: any) {
//       return left(new Error('Database error'));
//     }
//   }
//   async update(assessment: Assessment): Promise<Either<Error, void>> {
//     try {
//       await this.prisma.assessment.update({
//         where: { id: assessment.id.toString() },
//         data: {
//           title: assessment.title,
//           description: assessment.description,
//           type: assessment.type.getValue() as AssessmentType,
//           quizPosition:
//             assessment.quizPosition?.getValue() as QuizPosition | null,
//           passingScore: assessment.passingScore,
//           timeLimitInMinutes: assessment.timeLimitInMinutes,
//           randomizeQuestions: assessment.randomizeQuestions,
//           randomizeOptions: assessment.randomizeOptions,
//           lessonId: assessment.lessonId,
//           updatedAt: assessment.updatedAt,
//         },
//       });

//       return right(undefined);
//     } catch (err: any) {
//       if (err.code === 'P2025') {
//         return left(new Error('Assessment not found'));
//       }
//       return left(new Error('Failed to update assessment'));
//     }
//   }

//   async delete(id: string): Promise<Either<Error, void>> {
//     try {
//       await this.prisma.$transaction(async (tx) => {
//         // Delete all related entities first
//         await tx.attemptAnswer.deleteMany({
//           where: {
//             attempt: {
//               assessmentId: id,
//             },
//           },
//         });

//         await tx.attempt.deleteMany({
//           where: { assessmentId: id },
//         });

//         await tx.answerTranslation.deleteMany({
//           where: {
//             answer: {
//               question: {
//                 assessmentId: id,
//               },
//             },
//           },
//         });

//         await tx.answer.deleteMany({
//           where: {
//             question: {
//               assessmentId: id,
//             },
//           },
//         });

//         await tx.questionOption.deleteMany({
//           where: {
//             question: {
//               assessmentId: id,
//             },
//           },
//         });

//         await tx.question.deleteMany({
//           where: { assessmentId: id },
//         });

//         await tx.argument.deleteMany({
//           where: { assessmentId: id },
//         });

//         // Finally delete the assessment
//         await tx.assessment.delete({
//           where: { id },
//         });
//       });

//       return right(undefined);
//     } catch (err: any) {
//       if (err.code === 'P2025') {
//         return left(new Error('Assessment not found'));
//       }
//       return left(new Error('Failed to delete assessment'));
//     }
//   }

//   async findByTitleExcludingId(
//     title: string,
//     excludeId: string,
//   ): Promise<Either<Error, Assessment>> {
//     try {
//       const data = await this.prisma.assessment.findFirst({
//         where: {
//           title,
//           id: { not: excludeId },
//         },
//       });

//       if (!data) {
//         return left(new Error('Assessment not found'));
//       }

//       return right(this.mapToEntity(data));
//     } catch (err: any) {
//       return left(new Error('Database error'));
//     }
//   }

//   private mapToEntity(data: any): Assessment {
//     const assessmentType = new AssessmentTypeVO(data.type);
//     const quizPosition = data.quizPosition
//       ? new QuizPositionVO(data.quizPosition)
//       : undefined;

//     const props = {
//       title: data.title,
//       description: data.description,
//       type: assessmentType,
//       quizPosition,
//       passingScore: data.passingScore,
//       timeLimitInMinutes: data.timeLimitInMinutes,
//       randomizeQuestions: data.randomizeQuestions,
//       randomizeOptions: data.randomizeOptions,
//       lessonId: data.lessonId,
//       createdAt: data.createdAt,
//       updatedAt: data.updatedAt,
//     };

//     return Assessment.reconstruct(props, new UniqueEntityID(data.id));
//   }
// }
