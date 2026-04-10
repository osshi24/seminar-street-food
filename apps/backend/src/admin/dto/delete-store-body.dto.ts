import { IsBoolean, IsOptional } from 'class-validator';

export class DeleteStoreBodyDto {
  @IsOptional()
  @IsBoolean()
  confirmed?: boolean;
}

