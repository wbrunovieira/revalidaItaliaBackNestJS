import { IsString, MinLength, MaxLength, IsOptional, Matches, IsNotEmpty } from 'class-validator';

export class CreateFlashcardTagDto {
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty after trimming' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(200, { message: 'Name cannot exceed 200 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Slug must be at least 3 characters long' })
  @MaxLength(50, { message: 'Slug cannot exceed 50 characters' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;
}