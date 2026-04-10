import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { TagGroupType } from '../../../tags/entities/preference-tag.entity';

export class ListAdminTagsQueryDto {
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
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(['dish_type', 'flavor', 'allergen'])
  groupType?: TagGroupType;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  inUse?: boolean;
}

