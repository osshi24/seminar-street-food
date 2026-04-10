import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PublicStoresService } from './public-stores.service';

@Controller('stores')
export class PublicStoresController {
  constructor(private readonly publicStoresService: PublicStoresService) {}

  @Get()
  async listStores(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('lang') lang?: string,
  ) {
    return this.publicStoresService.listStores(q, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, lang || 'vi');
  }

  @Get(':id')
  async getStoreDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('lang') lang?: string,
  ) {
    return this.publicStoresService.getStoreDetail(id, lang || 'vi');
  }

  @Get(':id/commentary')
  async getCommentary(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('lang') lang?: string,
    @Req() req?: Request,
  ) {
    const acceptLanguage = req?.headers['accept-language']?.split(',')[0]?.split(';')[0]?.trim();
    const language = lang || acceptLanguage || 'vi';
    return this.publicStoresService.getCommentary(id, language);
  }
}
