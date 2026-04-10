import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { StoreOwnerJwtGuard } from '../auth/guards/store-owner-jwt.guard';
import { SubmitLocationDto } from './dto/submit-location.dto';
import { StoreOwnerAccount } from '../entities/store-owner-account.entity';

interface StoreOwnerRequest {
  user: StoreOwnerAccount;
}

@Controller('store-owner/stores/:storeId/location')
@UseGuards(StoreOwnerJwtGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  async getMyLocation(
    @Request() req: StoreOwnerRequest,
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.locationService.getMyLocation(req.user.id, storeId);
  }

  @Post()
  async submitLocation(
    @Request() req: StoreOwnerRequest,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: SubmitLocationDto,
  ) {
    return this.locationService.submitLocation(req.user.id, storeId, dto);
  }

  @Delete('pending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokePending(
    @Request() req: StoreOwnerRequest,
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    await this.locationService.revokePending(req.user.id, storeId);
  }
}
