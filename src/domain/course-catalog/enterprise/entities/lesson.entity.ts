// src/domain/course-catalog/enterprise/entities/lesson.entity.ts
import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';

// Value Objects for translations
export interface LessonTranslationVO {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description?: string;
}

export interface VideoTranslationVO {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description?: string;
}

export interface VideoVO {
  id: string;
  slug: string;
  imageUrl?: string;
  providerVideoId: string;
  durationInSeconds: number;
  translations: VideoTranslationVO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonDocumentTranslationVO {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description?: string;
  url: string;
}

export interface LessonDocumentVO {
  id: string;
  filename?: string;
  translations: LessonDocumentTranslationVO[];
  createdAt: Date;
}

// Data shape returned by Assessment.toResponseObject()
export interface AssessmentData {
  id: string;
  title: string;
  description?: string;
  type: string;
  quizPosition?: string;
  passingScore?: number;
  timeLimitInMinutes?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  lessonId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonProps {
  slug: string;
  moduleId: string;
  imageUrl?: string;
  order: number;
  flashcardIds: string[];
  commentIds: string[];
  translations: LessonTranslationVO[];
  videos: VideoVO[]; // Mantido para compatibilidade
  documents: LessonDocumentVO[];
  assessments: AssessmentData[];
  video?: VideoVO;
  createdAt: Date;
  updatedAt: Date;
}

export class Lesson extends Entity<LessonProps> {
  private touch(): void {
    this.props.updatedAt = new Date();
  }

  // Getters
  public get slug(): string {
    return this.props.slug;
  }

  public get moduleId(): string {
    return this.props.moduleId;
  }

  public get order(): number {
    return this.props.order;
  }

  public get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  public get video(): VideoVO | undefined {
    return this.props.video;
  }

  public get flashcardIds(): string[] {
    return [...this.props.flashcardIds];
  }

  public get commentIds(): string[] {
    return [...this.props.commentIds];
  }

  public get translations(): LessonTranslationVO[] {
    return [...this.props.translations];
  }

  public get videos(): VideoVO[] {
    return [...this.props.videos];
  }

  public get documents(): LessonDocumentVO[] {
    return [...this.props.documents];
  }

  public get assessments(): AssessmentData[] {
    return [...this.props.assessments];
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Mutators
  public updateImageUrl(imageUrl: string): void {
    this.props.imageUrl = imageUrl;
    this.touch();
  }

  public removeImage(): void {
    this.props.imageUrl = undefined;
    this.touch();
  }

  public updateVideo(video: VideoVO | undefined): void {
    this.props.video = video;
    this.touch();
  }

  public addFlashcard(flashcardId: string): void {
    this.props.flashcardIds.push(flashcardId);
    this.touch();
  }

  public removeFlashcard(flashcardId: string): void {
    this.props.flashcardIds = this.props.flashcardIds.filter(
      (id) => id !== flashcardId,
    );
    this.touch();
  }

  public updateCommentIds(commentIds: string[]): void {
    this.props.commentIds = commentIds;
    this.touch();
  }

  public updateTranslations(translations: LessonTranslationVO[]): void {
    this.props.translations = translations;
    this.touch();
  }

  public updateVideos(videos: VideoVO[]): void {
    this.props.videos = videos;
    this.touch();
  }

  public updateDocuments(documents: LessonDocumentVO[]): void {
    this.props.documents = documents;
    this.touch();
  }

  public updateAssessments(assessments: Assessment[]): void {
    this.props.assessments = assessments.map((a) => a.toResponseObject());
    this.touch();
  }

  public updateOrder(order: number): void {
    this.props.order = order;
    this.touch();
  }

  public updateFlashcardIds(flashcardIds: string[]): void {
    this.props.flashcardIds = flashcardIds;
    this.touch();
  }

  // Response Mapping
  public toResponseObject() {
    return {
      id: this.id.toString(),
      slug: this.slug,
      moduleId: this.moduleId,
      order: this.order,
      imageUrl: this.imageUrl,
      video: this.video,
      flashcardIds: this.flashcardIds,
      commentIds: this.commentIds,
      translations: this.translations,
      videos: this.videos,
      documents: this.documents,
      assessments: this.assessments,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Factory Methods
  public static create(
    props: Omit<
      LessonProps,
      'createdAt' | 'updatedAt' | 'videos' | 'documents' | 'assessments'
    > & {
      videos?: VideoVO[];
      documents?: LessonDocumentVO[];
      assessments?: AssessmentData[];
    },
    id?: UniqueEntityID,
  ): Lesson {
    const now = new Date();
    return new Lesson(
      {
        ...props,
        videos: props.videos || [],
        documents: props.documents || [],
        assessments: props.assessments || [],
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(props: LessonProps, id: UniqueEntityID): Lesson {
    return new Lesson(props, id);
  }
}
