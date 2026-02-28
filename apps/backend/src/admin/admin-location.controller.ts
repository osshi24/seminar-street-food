import {
  Controller,
  Get,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminLocationService } from './admin-location.service';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { ApproveLocationDto } from './dto/approve-location.dto';
import { RejectLocationDto } from './dto/reject-location.dto';
import { UpdateBoundaryDto } from './dto/update-boundary.dto';
import { AdminAccount } from '../entities/admin-account.entity';

interface AdminRequest {
  user: AdminAccount;
}

@Controller('admin')
@UseGuards(AdminJwtGuard)
export class AdminLocationController {
  constructor(private readonly adminLocationService: AdminLocationService) {}

  @Get('location-pins')
  async listPins(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminLocationService.listPins(
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('location-pins/:id')
  async getPinDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminLocationService.getPinDetail(id);
  }

  @Patch('location-pins/:id/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  async approvePin(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AdminRequest,
    @Body() dto: ApproveLocationDto,
  ) {
    await this.adminLocationService.approvePin(id, req.user.id, dto);
  }

  @Patch('location-pins/:id/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectPin(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AdminRequest,
    @Body() dto: RejectLocationDto,
  ) {
    await this.adminLocationService.rejectPin(id, req.user.id, dto);
  }

  @Delete('location-pins/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePin(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AdminRequest,
  ) {
    await this.adminLocationService.deletePin(id, req.user.id);
  }

  @Get('boundaries')
  async getBoundary() {
    return this.adminLocationService.getBoundary();
  }

  @Put('boundaries')
  async updateBoundary(
    @Request() req: AdminRequest,
    @Body() dto: UpdateBoundaryDto,
  ) {
    return this.adminLocationService.updateBoundary(req.user.id, dto);
  }
}
