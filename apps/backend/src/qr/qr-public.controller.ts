import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { QrService } from './qr.service';

@Controller('qr')
export class QrPublicController {
  constructor(private readonly qrService: QrService) {}

  @Get(':token')
  async resolveQr(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const result = await this.qrService.resolveToken(token);
    if (result === 'unavailable') {
      return res.redirect(302, '/store-unavailable');
    }
    return res.redirect(302, `/stores/${result}`);
  }
}
