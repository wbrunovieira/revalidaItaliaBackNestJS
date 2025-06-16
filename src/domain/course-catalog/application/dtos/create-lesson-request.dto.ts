export class CreateLessonRequest {
  /** The module under which this lesson will live */
  moduleId!: string;

  /** Exactly three translations, one each for pt, it & es */
  translations!: Array<{
    locale: "pt" | "it" | "es";
    title: string;
    /** optional longer description */
    description?: string;
  }>;
}