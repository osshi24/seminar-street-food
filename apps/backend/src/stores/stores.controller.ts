import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoreOwnerJwtGuard } from '../auth/guards/store-owner-jwt.guard';
import { StoreOwnerAccount } from '../entities/store-owner-account.entity';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreInfoDto } from './dto/update-store-info.dto';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-item.dto';

@Controller('store-owner/store')
@UseGuards(StoreOwnerJwtGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  async getMyStore(@Request() req: { user: StoreOwnerAccount }) {
    return this.storesService.getMyStore(req.user.id);
  }

  @Patch('info')
  async updateStoreInfo(
    @Request() req: { user: StoreOwnerAccount },
    @Body() dto: UpdateStoreInfoDto,
  ) {
    return this.storesService.updateStoreInfo(req.user.id, dto);
  }

  @Put()
  async saveDraft(@Request() req: { user: StoreOwnerAccount }, @Body() dto: UpdateStoreDto) {
    return this.storesService.saveDraft(req.user.id, dto);
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submitDraft(@Request() req: { user: StoreOwnerAccount }) {
    return this.storesService.submitDraft(req.user.id);
  }

  @Delete('draft')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeDraft(@Request() req: { user: StoreOwnerAccount }) {
    await this.storesService.revokeDraft(req.user.id);
  }

  @Get('draft')
  async getMyDraft(@Request() req: { user: StoreOwnerAccount }) {
    return this.storesService.getMyDraft(req.user.id);
  }

  // Menu items
  @Get('menu-items')
  async getMenuItems(@Request() req: { user: StoreOwnerAccount }) {
    return this.storesService.getMenuItems(req.user.id);
  }

  @Post('menu-items')
  async addMenuItem(
    @Request() req: { user: StoreOwnerAccount },
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.storesService.addMenuItem(req.user.id, dto);
  }

  @Put('menu-items/:id')
  async updateMenuItem(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.storesService.updateMenuItem(req.user.id, id, dto);
  }

  @Delete('menu-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMenuItem(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.storesService.removeMenuItem(req.user.id, id);
  }

  // Images
  @Post('images')
  async generateImageUploadUrl(
    @Request() req: { user: StoreOwnerAccount },
    @Body() body: { contentType: string },
  ) {
    return this.storesService.generateImageUploadUrl(req.user.id, body.contentType);
  }

  @Patch('images/:id/confirm')
  async confirmImageUpload(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.storesService.confirmImageUpload(req.user.id, id);
  }

  @Delete('images/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImage(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.storesService.deleteImage(req.user.id, id);
  }
}
