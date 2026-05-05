import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
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

  @Get('boundary')
  async getBoundary() {
    return this.locationService.getActiveBoundary();
  }

  @Get('all')
  async getAllStoresLocation(@Request() req: StoreOwnerRequest) {
    return this.locationService.getAllStoresLocation(req.user.id);
  }

  @Get()
  async getMyLocation(
    @Request() req: StoreOwnerRequest,
    @Query('storeId') storeId?: string,
  ) {
    return this.locationService.getMyLocation(req.user.id, storeId);
  }

  @Post()
  async submitLocation(
    @Request() req: StoreOwnerRequest,
    @Body() dto: SubmitLocationDto,
    @Query('storeId') storeId?: string,
  ) {
    return this.locationService.submitLocation(req.user.id, dto, storeId);
  }

  @Delete('pending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokePending(
    @Request() req: StoreOwnerRequest,
    @Query('storeId') storeId?: string,
  ) {
    await this.locationService.revokePending(req.user.id, storeId);
  }
}
