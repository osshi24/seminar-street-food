import { IsInt, IsPositive } from 'class-validator';

export class CreateReportDto {
  @IsInt()
  @IsPositive()
  reasonId: number;
}
