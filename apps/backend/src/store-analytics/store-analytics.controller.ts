import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Request, UseGuards } from '@nestjs/common';
import { StoreAnalyticsService } from './store-analytics.service';
import { StoreOwnerJwtGuard } from '../auth/guards/store-owner-jwt.guard';
import { StoreOwnerAccount } from '../entities/store-owner-account.entity';

@Controller()
export class StoreAnalyticsController {
  constructor(private readonly analyticsService: StoreAnalyticsService) {}

  @Post('public/analytics/track')
  @HttpCode(HttpStatus.OK)
  async track(@Body() body: { storeId?: string; eventType?: string }) {
    if (body.storeId && body.eventType === 'store_visit') {
      this.analyticsService.track(body.storeId, 'store_visit');
    }
    return { ok: true };
  }

  @Get('store-owner/stores/:storeId/analytics')
  @UseGuards(StoreOwnerJwtGuard)
  async getAnalytics(
    @Param('storeId') storeId: string,
    @Request() req: { user: StoreOwnerAccount },
  ) {
    return this.analyticsService.getAnalytics(storeId, req.user.id);
  }
}
