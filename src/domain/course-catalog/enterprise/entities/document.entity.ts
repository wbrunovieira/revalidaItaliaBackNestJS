// src/domain/course-catalog/enterprise/entities/document.entity.ts
import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

export interface DocumentProps {
  url: string;
  filename: string;
  title: string;
  fileSize: number;
  mimeType: string; // "application/pdf", "application/msword", etc
  isDownloadable: boolean;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Document extends Entity<DocumentProps> {
  private touch() {
    this.props.updatedAt = new Date();
  }

  public get url(): string {
    return this.props.url;
  }

  public get filename(): string {
    return this.props.filename;
  }

  public get title(): string {
    return this.props.title;
  }

  public get fileSize(): number {
    return this.props.fileSize;
  }

  public get mimeType(): string {
    return this.props.mimeType;
  }

  public get isDownloadable(): boolean {
    return this.props.isDownloadable;
  }

  public get downloadCount(): number {
    return this.props.downloadCount;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateDetails(updates: {
    title?: string;
    filename?: string;
    url?: string;
    fileSize?: number;
    mimeType?: string;
  }) {
    if (updates.title) {
      this.props.title = updates.title;
      this.touch();
    }
    if (updates.filename) {
      this.props.filename = updates.filename;
      this.touch();
    }
    if (updates.url) {
      this.props.url = updates.url;
      this.touch();
    }
    if (typeof updates.fileSize === 'number') {
      this.props.fileSize = updates.fileSize;
      this.touch();
    }
    if (updates.mimeType) {
      this.props.mimeType = updates.mimeType;
      this.touch();
    }
  }

  public enableDownload() {
    if (!this.props.isDownloadable) {
      this.props.isDownloadable = true;
      this.touch();
    }
  }

  public disableDownload() {
    if (this.props.isDownloadable) {
      this.props.isDownloadable = false;
      this.touch();
    }
  }

  public incrementDownloadCount() {
    this.props.downloadCount += 1;
    this.touch();
  }

  public isPdf(): boolean {
    return this.props.mimeType === 'application/pdf';
  }

  public isWord(): boolean {
    return [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ].includes(this.props.mimeType);
  }

  public getFileSizeInMB(): number {
    return Number((this.props.fileSize / (1024 * 1024)).toFixed(2));
  }

  public toResponseObject(): {
    id: string;
    url: string;
    filename: string;
    title: string;
    fileSize: number;
    fileSizeInMB: number;
    mimeType: string;
    isDownloadable: boolean;
    downloadCount: number;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id.toString(),
      url: this.props.url,
      filename: this.props.filename,
      title: this.props.title,
      fileSize: this.props.fileSize,
      fileSizeInMB: this.getFileSizeInMB(),
      mimeType: this.props.mimeType,
      isDownloadable: this.props.isDownloadable,
      downloadCount: this.props.downloadCount,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  public static create(
    props: Omit<DocumentProps, 'createdAt' | 'updatedAt' | 'downloadCount'> & {
      downloadCount?: number;
    },
    id?: UniqueEntityID,
  ): Document {
    const now = new Date();
    return new Document(
      {
        url: props.url,
        filename: props.filename,
        title: props.title,
        fileSize: props.fileSize,
        mimeType: props.mimeType,
        isDownloadable: props.isDownloadable,
        downloadCount: props.downloadCount ?? 0,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(
    props: DocumentProps,
    id: UniqueEntityID,
  ): Document {
    return new Document(props, id);
  }
}
