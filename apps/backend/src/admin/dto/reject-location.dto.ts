import { IsNotEmpty, MaxLength } from 'class-validator';

export class RejectLocationDto {
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
