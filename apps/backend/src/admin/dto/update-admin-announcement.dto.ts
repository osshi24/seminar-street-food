import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { AdminAnnouncementRecipientMode } from '../entities/admin-announcement.entity';

export class UpdateAdminAnnouncementDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  body?: string;

  @IsOptional()
  @IsEnum(AdminAnnouncementRecipientMode)
  recipientMode?: AdminAnnouncementRecipientMode;

  @IsOptional()
  @ValidateIf((o: UpdateAdminAnnouncementDto) => o.recipientMode !== AdminAnnouncementRecipientMode.ALL_STORES)
  @IsArray()
  @Type(() => String)
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  storeIds?: string[];
}

