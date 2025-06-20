// src/domain/course-catalog/enterprise/value-objects/file-metadata.vo.ts
export class FileMetadataVO {
  constructor(
    public readonly filename: string,
    public readonly fileSize: number,
    public readonly mimeType: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.filename || this.filename.trim().length === 0) {
      throw new Error('Filename cannot be empty');
    }

    if (this.fileSize <= 0) {
      throw new Error('File size must be positive');
    }

    if (!this.mimeType || this.mimeType.trim().length === 0) {
      throw new Error('MIME type cannot be empty');
    }

    // Validate filename has extension
    if (!this.filename.includes('.')) {
      throw new Error('Filename must include extension');
    }
  }

  static create(props: {
    filename: string;
    fileSize: number;
    mimeType: string;
  }): FileMetadataVO {
    return new FileMetadataVO(props.filename, props.fileSize, props.mimeType);
  }

  getExtension(): string {
    return this.filename.split('.').pop()?.toLowerCase() || '';
  }

  getFileSizeInMB(): number {
    return Number((this.fileSize / (1024 * 1024)).toFixed(2));
  }

  getFileSizeInKB(): number {
    return Number((this.fileSize / 1024).toFixed(2));
  }

  isPdf(): boolean {
    return this.mimeType === 'application/pdf';
  }

  isWord(): boolean {
    return [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ].includes(this.mimeType);
  }

  isExcel(): boolean {
    return [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ].includes(this.mimeType);
  }

  isPowerPoint(): boolean {
    return [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ].includes(this.mimeType);
  }

  isText(): boolean {
    return ['text/plain', 'text/csv'].includes(this.mimeType);
  }

  getFileTypeDescription(): string {
    if (this.isPdf()) return 'PDF Document';
    if (this.isWord()) return 'Word Document';
    if (this.isExcel()) return 'Excel Spreadsheet';
    if (this.isPowerPoint()) return 'PowerPoint Presentation';
    if (this.isText()) return 'Text Document';
    return 'Document';
  }

  equals(other: FileMetadataVO): boolean {
    return (
      this.filename === other.filename &&
      this.fileSize === other.fileSize &&
      this.mimeType === other.mimeType
    );
  }
}
