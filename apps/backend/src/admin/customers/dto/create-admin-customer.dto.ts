import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAdminCustomerDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MaxLength(255)
  displayName: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string | null;
}

