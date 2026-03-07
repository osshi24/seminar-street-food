import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { QrService } from './qr.service';
import { StoreOwnerJwtGuard } from '../auth/guards/store-owner-jwt.guard';

interface AuthRequest extends Request {
  user: { sub: string };
}

@Controller('store-owner/stores/:storeId/qr')
@UseGuards(StoreOwnerJwtGuard)
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createQr(
    @Param('storeId') storeId: string,
    @Req() req: AuthRequest,
  ) {
    const ownerId = req.user.sub;
    return this.qrService.createQr(storeId, ownerId);
  }

  @Get('png')
  async downloadPng(
    @Param('storeId') storeId: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    const ownerId = req.user.sub;
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
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    const ownerId = req.user.sub;
    const buffer = await this.qrService.getActivePdf(storeId, ownerId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="qr-store-${storeId}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
