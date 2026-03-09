import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateStoreDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
