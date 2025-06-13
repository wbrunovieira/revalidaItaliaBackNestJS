// src/infra/course-catalog/dtos/get-track.dto.ts
import { IsUUID } from 'class-validator';

export class GetTrackDto {
  @IsUUID()
  id: string;
}