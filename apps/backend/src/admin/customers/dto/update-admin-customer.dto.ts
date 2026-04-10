import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAdminCustomerDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;
}

