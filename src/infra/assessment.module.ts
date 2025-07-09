// import { Module } from '@nestjs/common';

// import { CreateAssessmentUseCase } from '@/domain/assessment/application/use-cases/create-assessment.use-case';

// import { PrismaAssessmentRepository } from '@/infra/database/prisma/repositories/prisma-assessment-repository';
// import { DatabaseModule } from '@/infra/database/database.module';

// @Module({
//   imports: [DatabaseModule],
//   controllers: [],
//   providers: [
//     CreateAssessmentUseCase,
//     {
//       provide: 'AssessmentRepository',
//       useClass: PrismaAssessmentRepository,
//     } as const,
//   ],
//   exports: ['AssessmentRepository'],
// })
// export class AssessmentModule {}
