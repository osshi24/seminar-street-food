import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { AdminCatalogStoresService } from './admin-catalog-stores.service';
import { ListAdminStoresQueryDto } from './dto/list-admin-stores-query.dto';
import { DeleteStoreBodyDto } from './dto/delete-store-body.dto';

@Controller('admin/stores')
@UseGuards(AdminJwtGuard)
export class AdminCatalogStoresController {
  constructor(private readonly adminCatalogStoresService: AdminCatalogStoresService) {}

  @Get()
  async findAll(@Query() query: ListAdminStoresQueryDto) {
    return this.adminCatalogStoresService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminCatalogStoresService.findOne(id);
  }

  @Patch(':id/activate')
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminCatalogStoresService.activate(id);
  }

  @Patch(':id/deactivate')
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminCatalogStoresService.deactivate(id);
  }

  @Get(':id/delete-impact')
  async getDeleteImpact(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminCatalogStoresService.getDeleteImpact(id);
  }

  @Patch(':id/approve-deletion')
  @HttpCode(HttpStatus.NO_CONTENT)
  async approveDeletion(@Param('id', ParseUUIDPipe) id: string) {
    await this.adminCatalogStoresService.approveDeletion(id);
  }

  @Patch(':id/reject-deletion')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectDeletion(@Param('id', ParseUUIDPipe) id: string) {
    await this.adminCatalogStoresService.rejectDeletion(id);
  }

  @Delete(':id')
  @Throttle({ global: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: DeleteStoreBodyDto,
  ) {
    await this.adminCatalogStoresService.remove(id, Boolean(body?.confirmed));
  }
}

