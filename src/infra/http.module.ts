// src/infra/http.module.ts
import { Module } from '@nestjs/common';

import { DatabaseModule } from './database/database.module';

// Auth domain modules
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { AddressModule } from './modules/address/address.module';
import { ProfileModule } from './modules/profile/profile.module';

// Course catalog domain modules
import { CourseModule } from './modules/courses/course.module';
import { ModuleModule } from './modules/module/module.module';
import { LessonModule } from './modules/lesson/lesson.module';
import { VideoModule } from './modules/video/video.module';

// Assessment domain modules
import { AssessmentModule } from './modules/assessment/assessment.module';
import { QuestionModule } from './modules/question/question.module';
import { QuestionOptionModule } from './modules/question-option/question-option.module';
import { AnswerModule } from './modules/answer/answer.module';
import { AttemptModule } from './modules/attempt/attempt.module';

// Study tools modules
import { FlashcardModule } from './modules/flashcard/flashcard.module';
import { ArgumentModule } from './modules/argument/argument.module';
import { TrackModule } from './modules/track/track.module';

// Infrastructure modules
import { HealthModule } from './modules/health/health.module';
import { StatsModule } from './modules/stats/stats.module';
import { DocumentModule } from './modules/flashcard/document/document.module';
import { LessonProgressModule } from './modules/lesson-progress.module';

/**
 * HTTP Module
 *
 * Aggregates all feature modules and exposes them to the application.
 * This module serves as the main entry point for all HTTP-related
 * functionality, organizing modules by their domain boundaries.
 */
@Module({
  imports: [
    DatabaseModule,

    // Infrastructure
    HealthModule,
    StatsModule,

    // Auth domain
    AuthModule,
    UserModule,
    AddressModule,
    ProfileModule,

    // Course catalog domain
    CourseModule,
    ModuleModule,
    LessonModule,
    VideoModule,
    DocumentModule,
    LessonProgressModule,

    // Assessment domain
    AssessmentModule,
    QuestionModule,
    QuestionOptionModule,
    AnswerModule,
    AttemptModule,

    // Study tools
    FlashcardModule,
    ArgumentModule,
    TrackModule,
  ],
  controllers: [],
  providers: [],
})
export class HttpModule {}
