import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { StoreOwnerJwtGuard } from '../auth/guards/store-owner-jwt.guard';

@Controller('stores/:storeId/reviews/:reviewId/report')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(StoreOwnerJwtGuard)
  @HttpCode(HttpStatus.CREATED)
  createReport(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() dto: CreateReportDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.reportsService.createReport(storeId, reviewId, user.id, dto);
  }
}
