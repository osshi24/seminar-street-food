import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StoreStatus } from '../../stores/entities/store.entity';

export class ListAdminStoresQueryDto {
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
  @IsEnum(StoreStatus)
  status?: StoreStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

