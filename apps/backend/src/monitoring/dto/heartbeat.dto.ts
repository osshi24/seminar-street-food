import { IsString, Length, Matches } from 'class-validator';

export class HeartbeatDto {
  @IsString()
  @Length(8, 64)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'visitorId must contain only alphanumeric, dash, or underscore',
  })
  visitorId: string;
}
