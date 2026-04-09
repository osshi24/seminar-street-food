import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class GetRecommendationsDto {
  @Transform(({ value }: { value: string }) => {
    if (!value) return [];
    return String(value)
      .split(',')
      .map((v) => parseInt(v.trim(), 10));
  })
  @IsArray({ message: 'TAGS_REQUIRED' })
  @ArrayMinSize(1, { message: 'TAGS_REQUIRED' })
  @ArrayMaxSize(5, { message: 'TOO_MANY_TAGS' })
  @IsInt({ each: true, message: 'INVALID_TAG_IDS' })
  @IsPositive({ each: true, message: 'INVALID_TAG_IDS' })
  tags: number[];

  @IsOptional()
  @Transform(({ value }: { value: string }) => (value ? parseInt(value, 10) : 1))
  @IsInt({ message: 'INVALID_PAGE' })
  @Min(1, { message: 'INVALID_PAGE' })
  page: number = 1;
}
