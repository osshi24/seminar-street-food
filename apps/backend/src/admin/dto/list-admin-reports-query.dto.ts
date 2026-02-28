import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CommentReportStatus } from '../../entities/comment-report.entity';

export class ListAdminReportsQueryDto {
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
  @IsEnum(CommentReportStatus)
  status?: CommentReportStatus;

  @IsOptional()
  @IsUUID()
  storeId?: string;
}
