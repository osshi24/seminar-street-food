import { ArrayMinSize, IsBoolean, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BoundaryCoordinateDto } from './update-boundary.dto';

export class CreateBoundaryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ValidateNested({ each: true })
  @ArrayMinSize(3)
  @Type(() => BoundaryCoordinateDto)
  coordinates: BoundaryCoordinateDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

