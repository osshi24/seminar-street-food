import { IsIn, IsString, MaxLength } from 'class-validator';
import type { TagGroupType } from '../../../tags/entities/preference-tag.entity';

export class CreateTagDto {
  @IsString()
  @MaxLength(100)
  nameVi: string;

  @IsString()
  @MaxLength(100)
  nameEn: string;

  @IsIn(['dish_type', 'flavor', 'allergen'])
  groupType: TagGroupType;
}
