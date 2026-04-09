import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { MapService } from './map.service';

@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('pins')
  async getPublicPins() {
    return this.mapService.getPublicPins();
  }

  @Get('pins/:storeId')
  async getStorePinDetail(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.mapService.getStorePinDetail(storeId);
  }
}
