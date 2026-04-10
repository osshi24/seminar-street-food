import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { StoreOwnerJwtGuard } from '../auth/guards/store-owner-jwt.guard';
import { SubmitLocationDto } from './dto/submit-location.dto';
import { StoreOwnerAccount } from '../entities/store-owner-account.entity';

interface StoreOwnerRequest {
  user: StoreOwnerAccount;
}

@Controller('store-owner/location')
@UseGuards(StoreOwnerJwtGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  async getMyLocation(@Request() req: StoreOwnerRequest) {
    return this.locationService.getMyLocation(req.user.id);
  }

  @Post()
  async submitLocation(
    @Request() req: StoreOwnerRequest,
    @Body() dto: SubmitLocationDto,
  ) {
    return this.locationService.submitLocation(req.user.id, dto);
  }

  @Delete('pending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokePending(@Request() req: StoreOwnerRequest) {
    await this.locationService.revokePending(req.user.id);
  }

  @Get('boundaries')
  async listActiveBoundaries() {
    return this.locationService.listActiveBoundaries();
  }
}
