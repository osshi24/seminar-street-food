import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReviewVisibilityFilter {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
}

export class ListAdminReviewsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsUUID()
  storeId?: string;

  @IsOptional()
  @IsEnum(ReviewVisibilityFilter)
  status?: ReviewVisibilityFilter;

  @IsOptional()
  @IsString()
  keyword?: string;
}
