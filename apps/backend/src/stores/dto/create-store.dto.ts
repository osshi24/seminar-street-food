import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
