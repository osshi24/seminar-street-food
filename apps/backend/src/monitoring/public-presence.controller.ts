import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { HeartbeatDto } from './dto/heartbeat.dto';

@Controller('public/presence')
export class PublicPresenceController {
  constructor(private readonly presence: PresenceService) {}

  @Post('heartbeat')
  @HttpCode(HttpStatus.NO_CONTENT)
  heartbeat(@Body() body: HeartbeatDto): void {
    this.presence.pingPublic(body.visitorId);
  }
}
