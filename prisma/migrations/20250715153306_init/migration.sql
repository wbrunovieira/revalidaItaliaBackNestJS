-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('QUIZ', 'SIMULADO', 'PROVA_ABERTA');

-- CreateEnum
CREATE TYPE "QuizPosition" AS ENUM ('BEFORE_LESSON', 'AFTER_LESSON');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'OPEN');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADING', 'GRADED');

-- CreateEnum
CREATE TYPE "FlashcardContentType" AS ENUM ('TEXT', 'IMAGE');

-- CreateEnum
CREATE TYPE "FlashcardDifficultyLevel" AS ENUM ('EASY', 'HARD', 'NEUTRAL');

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackCourse" (
    "trackId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "TrackCourse_pkey" PRIMARY KEY ("trackId","courseId")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "providerVideoId" TEXT NOT NULL,
    "durationInSeconds" INTEGER NOT NULL,
    "lessonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,

    CONSTRAINT "TrackTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "CourseTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "ModuleTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,

    CONSTRAINT "VideoTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoLink" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "streamUrl" TEXT NOT NULL,
    "downloadUrl" TEXT,
    "videoId" TEXT NOT NULL,

    CONSTRAINT "VideoLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseVideoLink" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "CourseVideoLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleVideoLink" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "ModuleVideoLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoSeen" (
    "id" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,

    CONSTRAINT "VideoSeen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "phone" TEXT,
    "paymentToken" TEXT,
    "birthDate" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "profileImageUrl" TEXT,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "district" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 1,
    "flashcardIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "lessonId" TEXT NOT NULL,

    CONSTRAINT "LessonTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonDocument" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "filename" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonDocumentTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "LessonDocumentTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AssessmentType" NOT NULL,
    "quizPosition" "QuizPosition",
    "passingScore" INTEGER NOT NULL,
    "timeLimitInMinutes" INTEGER,
    "randomizeQuestions" BOOLEAN NOT NULL DEFAULT false,
    "randomizeOptions" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lessonId" TEXT,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Argument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assessmentId" TEXT,

    CONSTRAINT "Argument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "argumentId" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "correctOptionId" TEXT,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,

    CONSTRAINT "AnswerTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "gradedAt" TIMESTAMP(3),
    "timeLimitExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptAnswer" (
    "id" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "textAnswer" TEXT,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "isCorrect" BOOLEAN,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "teacherComment" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "AttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flashcard" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "questionText" TEXT,
    "questionImageUrl" TEXT,
    "questionType" "FlashcardContentType" NOT NULL,
    "answerText" TEXT,
    "answerImageUrl" TEXT,
    "answerType" "FlashcardContentType" NOT NULL,
    "importBatchId" TEXT,
    "exportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "argumentId" TEXT NOT NULL,

    CONSTRAINT "Flashcard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlashcardTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardInteraction" (
    "id" TEXT NOT NULL,
    "difficultyLevel" "FlashcardDifficultyLevel" NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "flashcardId" TEXT NOT NULL,

    CONSTRAINT "FlashcardInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonFlashcard" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "lessonId" TEXT NOT NULL,
    "flashcardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonFlashcard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardInteractionContext" (
    "id" TEXT NOT NULL,
    "difficultyLevel" "FlashcardDifficultyLevel" NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "flashcardId" TEXT NOT NULL,
    "lessonId" TEXT,

    CONSTRAINT "FlashcardInteractionContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FlashcardToFlashcardTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FlashcardToFlashcardTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Track_slug_key" ON "Track"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Module_slug_key" ON "Module"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Video_slug_key" ON "Video"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Video_lessonId_key" ON "Video"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackTranslation_trackId_locale_key" ON "TrackTranslation"("trackId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "CourseTranslation_courseId_locale_key" ON "CourseTranslation"("courseId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleTranslation_moduleId_locale_key" ON "ModuleTranslation"("moduleId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "VideoTranslation_videoId_locale_key" ON "VideoTranslation"("videoId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "VideoLink_videoId_locale_key" ON "VideoLink"("videoId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "CourseVideoLink_courseId_locale_key" ON "CourseVideoLink"("courseId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleVideoLink_moduleId_locale_key" ON "ModuleVideoLink"("moduleId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "VideoSeen_userId_videoId_key" ON "VideoSeen"("userId", "videoId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_slug_key" ON "Lesson"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LessonTranslation_lessonId_locale_key" ON "LessonTranslation"("lessonId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "LessonDocumentTranslation_documentId_locale_key" ON "LessonDocumentTranslation"("documentId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_slug_key" ON "Assessment"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_questionId_key" ON "Answer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerTranslation_answerId_locale_key" ON "AnswerTranslation"("answerId", "locale");

-- CreateIndex
CREATE INDEX "Attempt_userId_assessmentId_idx" ON "Attempt"("userId", "assessmentId");

-- CreateIndex
CREATE INDEX "AttemptAnswer_attemptId_questionId_isLatest_idx" ON "AttemptAnswer"("attemptId", "questionId", "isLatest");

-- CreateIndex
CREATE INDEX "AttemptAnswer_attemptId_questionId_version_idx" ON "AttemptAnswer"("attemptId", "questionId", "version");

-- CreateIndex
CREATE INDEX "AttemptAnswer_reviewerId_idx" ON "AttemptAnswer"("reviewerId");

-- CreateIndex
CREATE INDEX "AttemptAnswer_status_reviewerId_idx" ON "AttemptAnswer"("status", "reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "Flashcard_slug_key" ON "Flashcard"("slug");

-- CreateIndex
CREATE INDEX "Flashcard_argumentId_idx" ON "Flashcard"("argumentId");

-- CreateIndex
CREATE INDEX "Flashcard_questionType_answerType_idx" ON "Flashcard"("questionType", "answerType");

-- CreateIndex
CREATE INDEX "Flashcard_importBatchId_idx" ON "Flashcard"("importBatchId");

-- CreateIndex
CREATE INDEX "Flashcard_createdAt_idx" ON "Flashcard"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FlashcardTag_slug_key" ON "FlashcardTag"("slug");

-- CreateIndex
CREATE INDEX "FlashcardTag_name_idx" ON "FlashcardTag"("name");

-- CreateIndex
CREATE INDEX "FlashcardInteraction_userId_difficultyLevel_idx" ON "FlashcardInteraction"("userId", "difficultyLevel");

-- CreateIndex
CREATE INDEX "FlashcardInteraction_flashcardId_difficultyLevel_idx" ON "FlashcardInteraction"("flashcardId", "difficultyLevel");

-- CreateIndex
CREATE INDEX "FlashcardInteraction_reviewedAt_idx" ON "FlashcardInteraction"("reviewedAt");

-- CreateIndex
CREATE INDEX "FlashcardInteraction_userId_reviewedAt_idx" ON "FlashcardInteraction"("userId", "reviewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FlashcardInteraction_userId_flashcardId_key" ON "FlashcardInteraction"("userId", "flashcardId");

-- CreateIndex
CREATE INDEX "LessonFlashcard_lessonId_idx" ON "LessonFlashcard"("lessonId");

-- CreateIndex
CREATE INDEX "LessonFlashcard_flashcardId_idx" ON "LessonFlashcard"("flashcardId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonFlashcard_lessonId_flashcardId_key" ON "LessonFlashcard"("lessonId", "flashcardId");

-- CreateIndex
CREATE INDEX "FlashcardInteractionContext_userId_lessonId_idx" ON "FlashcardInteractionContext"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "FlashcardInteractionContext_flashcardId_lessonId_idx" ON "FlashcardInteractionContext"("flashcardId", "lessonId");

-- CreateIndex
CREATE INDEX "FlashcardInteractionContext_reviewedAt_idx" ON "FlashcardInteractionContext"("reviewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FlashcardInteractionContext_userId_flashcardId_lessonId_key" ON "FlashcardInteractionContext"("userId", "flashcardId", "lessonId");

-- CreateIndex
CREATE INDEX "_FlashcardToFlashcardTag_B_index" ON "_FlashcardToFlashcardTag"("B");

-- AddForeignKey
ALTER TABLE "TrackCourse" ADD CONSTRAINT "TrackCourse_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackCourse" ADD CONSTRAINT "TrackCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackTranslation" ADD CONSTRAINT "TrackTranslation_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTranslation" ADD CONSTRAINT "CourseTranslation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleTranslation" ADD CONSTRAINT "ModuleTranslation_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoTranslation" ADD CONSTRAINT "VideoTranslation_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoLink" ADD CONSTRAINT "VideoLink_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseVideoLink" ADD CONSTRAINT "CourseVideoLink_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleVideoLink" ADD CONSTRAINT "ModuleVideoLink_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoSeen" ADD CONSTRAINT "VideoSeen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoSeen" ADD CONSTRAINT "VideoSeen_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonTranslation" ADD CONSTRAINT "LessonTranslation_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonDocument" ADD CONSTRAINT "LessonDocument_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonDocumentTranslation" ADD CONSTRAINT "LessonDocumentTranslation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LessonDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Argument" ADD CONSTRAINT "Argument_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_argumentId_fkey" FOREIGN KEY ("argumentId") REFERENCES "Argument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerTranslation" ADD CONSTRAINT "AnswerTranslation_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_argumentId_fkey" FOREIGN KEY ("argumentId") REFERENCES "Argument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardInteraction" ADD CONSTRAINT "FlashcardInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardInteraction" ADD CONSTRAINT "FlashcardInteraction_flashcardId_fkey" FOREIGN KEY ("flashcardId") REFERENCES "Flashcard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonFlashcard" ADD CONSTRAINT "LessonFlashcard_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonFlashcard" ADD CONSTRAINT "LessonFlashcard_flashcardId_fkey" FOREIGN KEY ("flashcardId") REFERENCES "Flashcard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardInteractionContext" ADD CONSTRAINT "FlashcardInteractionContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardInteractionContext" ADD CONSTRAINT "FlashcardInteractionContext_flashcardId_fkey" FOREIGN KEY ("flashcardId") REFERENCES "Flashcard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardInteractionContext" ADD CONSTRAINT "FlashcardInteractionContext_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FlashcardToFlashcardTag" ADD CONSTRAINT "_FlashcardToFlashcardTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Flashcard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FlashcardToFlashcardTag" ADD CONSTRAINT "_FlashcardToFlashcardTag_B_fkey" FOREIGN KEY ("B") REFERENCES "FlashcardTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
