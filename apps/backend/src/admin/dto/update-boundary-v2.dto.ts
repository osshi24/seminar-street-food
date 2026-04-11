import { ArrayMinSize, IsBoolean, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BoundaryCoordinateDto } from './update-boundary.dto';

export class UpdateBoundaryV2Dto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @ArrayMinSize(3)
  @Type(() => BoundaryCoordinateDto)
  coordinates?: BoundaryCoordinateDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

