// // src/domain/assessment/application/use-cases/create-assessment.use-case.ts
// import { Either, left, right } from '@/core/either';
// import { Injectable, Inject } from '@nestjs/common';
// import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
// import { AssessmentTypeVO } from '@/domain/assessment/enterprise/value-objects/assessment-type.vo';
// import { QuizPositionVO } from '@/domain/assessment/enterprise/value-objects/quiz-position.vo';
// import { IAssessmentRepository } from '../repositories/i-assessment-repository';
// import { ILessonRepository } from '@/domain/course-catalog/application/repositories/i-lesson-repository';
// import { CreateAssessmentRequest } from '../dtos/create-assessment-request.dto';
// import { CreateAssessmentDto } from '../dtos/create-assessment.dto';
// import { InvalidInputError } from './errors/invalid-input-error';
// import { RepositoryError } from './errors/repository-error';
// import { DuplicateAssessmentError } from './errors/duplicate-assessment-error';
// import { LessonNotFoundError } from './errors/lesson-not-found-error';
// import {
//   CreateAssessmentSchema,
//   createAssessmentSchema,
// } from './validations/create-assessment.schema';

// type CreateAssessmentUseCaseResponse = Either<
//   | InvalidInputError
//   | DuplicateAssessmentError
//   | LessonNotFoundError
//   | RepositoryError
//   | Error,
//   CreateAssessmentDto
// >;

// @Injectable()
// export class CreateAssessmentUseCase {
//   constructor(
//     @Inject('AssessmentRepository')
//     private readonly assessmentRepository: IAssessmentRepository,
//     @Inject('LessonRepository')
//     private readonly lessonRepository: ILessonRepository,
//   ) {}

//   async execute(
//     request: CreateAssessmentRequest,
//   ): Promise<CreateAssessmentUseCaseResponse> {
//     // Validate input
//     const parseResult = createAssessmentSchema.safeParse(request);
//     if (!parseResult.success) {
//       const details = parseResult.error.issues.map((issue) => {
//         const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';

//         // Build detailed error message based on issue type
//         let errorMessage = `${path}${issue.message}`;

//         if (issue.code === 'invalid_type') {
//           const expected = (issue as any).expected || 'unknown';
//           const received = (issue as any).received || 'unknown';
//           errorMessage = `${path}Expected ${expected} but received ${received}`;
//         } else if (issue.code === 'too_small') {
//           const minimum = (issue as any).minimum;
//           if (minimum !== undefined) {
//             errorMessage = `${path}${issue.message} (minimum: ${minimum})`;
//           }
//         } else if (issue.code === 'too_big') {
//           const maximum = (issue as any).maximum;
//           if (maximum !== undefined) {
//             errorMessage = `${path}${issue.message} (maximum: ${maximum})`;
//           }
//         }

//         return errorMessage;
//       });

//       return left(new InvalidInputError('Validation failed', details));
//     }

//     const data: CreateAssessmentSchema = parseResult.data;

//     // Check if lesson exists (if lessonId is provided)
//     if (data.lessonId) {
//       try {
//         const lessonResult = await this.lessonRepository.findById(
//           data.lessonId,
//         );
//         if (lessonResult.isLeft()) {
//           return left(new LessonNotFoundError());
//         }
//       } catch (err: any) {
//         return left(new RepositoryError(err.message));
//       }
//     }

//     // Check for duplicate assessment by title
//     try {
//       const existingResult = await this.assessmentRepository.findByTitle(
//         data.title,
//       );
//       if (existingResult.isRight()) {
//         return left(new DuplicateAssessmentError());
//       }
//     } catch (err: any) {
//       return left(new RepositoryError(err.message));
//     }

//     // Create value objects
//     let assessmentType: AssessmentTypeVO;
//     let quizPosition: QuizPositionVO | undefined;

//     try {
//       assessmentType = new AssessmentTypeVO(data.type);
//     } catch (err: any) {
//       const details = [`type: ${err.message}`];
//       return left(new InvalidInputError('Invalid assessment type', details));
//     }

//     if (data.quizPosition) {
//       try {
//         quizPosition = new QuizPositionVO(data.quizPosition);
//       } catch (err: any) {
//         const details = [`quizPosition: ${err.message}`];
//         return left(new InvalidInputError('Invalid quiz position', details));
//       }
//     }

//     // Create assessment entity
//     let assessment: Assessment;
//     try {
//       assessment = Assessment.create({
//         title: data.title,
//         description: data.description,
//         type: assessmentType,
//         quizPosition,
//         passingScore: data.passingScore,
//         timeLimitInMinutes: data.timeLimitInMinutes,
//         randomizeQuestions: data.randomizeQuestions,
//         randomizeOptions: data.randomizeOptions,
//         lessonId: data.lessonId,
//       });
//     } catch (err: any) {
//       const details = [err.message];
//       return left(
//         new InvalidInputError('Failed to create assessment', details),
//       );
//     }

//     // Save assessment
//     try {
//       const createdResult = await this.assessmentRepository.create(assessment);
//       if (createdResult.isLeft()) {
//         return left(new RepositoryError(createdResult.value.message));
//       }
//     } catch (err: any) {
//       return left(new RepositoryError(err.message));
//     }

//     // Build response
//     const responsePayload: CreateAssessmentDto = {
//       assessment: {
//         id: assessment.id.toString(),
//         title: assessment.title,
//         description: assessment.description,
//         type: assessment.type.getValue(),
//         quizPosition: assessment.quizPosition?.getValue(),
//         passingScore: assessment.passingScore,
//         timeLimitInMinutes: assessment.timeLimitInMinutes,
//         randomizeQuestions: assessment.randomizeQuestions,
//         randomizeOptions: assessment.randomizeOptions,
//         lessonId: assessment.lessonId,
//         createdAt: assessment.createdAt,
//         updatedAt: assessment.updatedAt,
//       },
//     };

//     return right(responsePayload);
//   }
// }
