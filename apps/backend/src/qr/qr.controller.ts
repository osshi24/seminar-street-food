import {
  Controller,
  Post,
  Get,
  Param,
  Request,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { QrService } from './qr.service';
import { StoreOwnerJwtGuard } from '../auth/guards/store-owner-jwt.guard';
import { StoreOwnerAccount } from '../entities/store-owner-account.entity';

@Controller('store-owner/stores/:storeId/qr')
@UseGuards(StoreOwnerJwtGuard)
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createQr(
    @Param('storeId') storeId: string,
    @Request() req: { user: StoreOwnerAccount },
  ) {
    const ownerId = req.user.id;
    return this.qrService.createQr(storeId, ownerId);
  }

  @Get('png')
  async downloadPng(
    @Param('storeId') storeId: string,
    @Request() req: { user: StoreOwnerAccount },
    @Res() res: Response,
  ) {
    const ownerId = req.user.id;
    const buffer = await this.qrService.getActivePng(storeId, ownerId);
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="qr-store-${storeId}.png"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('pdf')
  async downloadPdf(
    @Param('storeId') storeId: string,
    @Request() req: { user: StoreOwnerAccount },
    @Res() res: Response,
  ) {
    const ownerId = req.user.id;
    const buffer = await this.qrService.getActivePdf(storeId, ownerId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="qr-store-${storeId}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
