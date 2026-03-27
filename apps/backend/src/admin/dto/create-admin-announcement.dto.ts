import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { AdminAnnouncementRecipientMode } from '../entities/admin-announcement.entity';

export type AdminAnnouncementAction = 'save_draft' | 'send';

export class CreateAdminAnnouncementDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @IsString()
  @MinLength(1)
  body: string;

  @IsEnum(AdminAnnouncementRecipientMode)
  recipientMode: AdminAnnouncementRecipientMode;

  @ValidateIf((o: CreateAdminAnnouncementDto) => o.recipientMode !== AdminAnnouncementRecipientMode.ALL_STORES)
  @IsArray()
  @Type(() => String)
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  storeIds?: string[];

  @IsIn(['save_draft', 'send'])
  action: AdminAnnouncementAction;
}

