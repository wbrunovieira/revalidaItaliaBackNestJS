// src/domain/course-catalog/enterprise/entities/lesson.entity.ts
import { Entity } from "@/core/entity";
import { UniqueEntityID } from "@/core/unique-entity-id";

export interface LessonTranslationVO {
  locale: "pt" | "it" | "es";
  title: string;
  description?: string;
}

export interface LessonProps {
  moduleId: string;
  videoId?: string;
  flashcardIds: string[];
  quizIds: string[];
  commentIds: string[];
  translations: LessonTranslationVO[];
  createdAt: Date;
  updatedAt: Date;
}

export class Lesson extends Entity<LessonProps> {
  private touch() {
    this.props.updatedAt = new Date();
  }


  public get moduleId(): string {
    return this.props.moduleId;
  }

  public get videoId(): string | undefined {
    return this.props.videoId;
  }

  public get flashcardIds(): string[] {
    return this.props.flashcardIds;
  }

  public get quizIds(): string[] {
    return this.props.quizIds;
  }

  public get commentIds(): string[] {
    return this.props.commentIds;
  }

  public get translations(): LessonTranslationVO[] {
    return this.props.translations;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateVideo(videoId: string) {
    this.props.videoId = videoId;
    this.touch();
  }

  public addFlashcard(flashcardId: string) {
    this.props.flashcardIds.push(flashcardId);
    this.touch();
  }



  public toResponseObject(): {
    id: string;
    moduleId: string;
    videoId?: string;
    flashcardIds: string[];
    quizIds: string[];
    commentIds: string[];
    translations: LessonTranslationVO[];
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.toString(),            
      moduleId: this.moduleId,
      videoId: this.videoId,
      flashcardIds: this.flashcardIds,
      quizIds: this.quizIds,
      commentIds: this.commentIds,
      translations: this.translations,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public static create(
    props: Omit<LessonProps, "createdAt" | "updatedAt">,
    id?: UniqueEntityID
  ): Lesson {
    const now = new Date();
    return new Lesson(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id
    );
  }

  public static reconstruct(
    props: LessonProps,
    id: UniqueEntityID
  ): Lesson {
    return new Lesson(props, id);
  }
}