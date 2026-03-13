import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { StoreOwnersService } from './store-owners.service';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { ListStoreOwnersQueryDto } from './dto/list-store-owners-query.dto';
import { RejectStoreOwnerDto } from './dto/reject-store-owner.dto';

@Controller('admin/store-owners')
@UseGuards(AdminJwtGuard)
export class StoreOwnersController {
  constructor(private readonly storeOwnersService: StoreOwnersService) {}

  @Get()
  async findAll(@Query() query: ListStoreOwnersQueryDto) {
    return this.storeOwnersService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeOwnersService.findOne(id);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeOwnersService.approve(id);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectStoreOwnerDto,
  ) {
    return this.storeOwnersService.reject(id, dto.reason);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('confirmed') confirmed?: string,
  ) {
    return this.storeOwnersService.deactivate(id, confirmed === 'true');
  }

  @Patch(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  async reactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeOwnersService.reactivate(id);
  }
}
