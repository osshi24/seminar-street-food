import { IsOptional, IsString, MaxLength, ValidateNested, ArrayMinSize, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class BoundaryCoordinateDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class UpdateBoundaryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ValidateNested({ each: true })
  @ArrayMinSize(3)
  @Type(() => BoundaryCoordinateDto)
  coordinates: BoundaryCoordinateDto[];
}
