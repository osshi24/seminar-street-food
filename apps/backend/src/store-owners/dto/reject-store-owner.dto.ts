import { IsString, MinLength } from 'class-validator';

export class RejectStoreOwnerDto {
  @IsString()
  @MinLength(10)
  reason: string;
}
