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
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreInfoDto } from './dto/update-store-info.dto';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-item.dto';

@Controller('store-owner/stores')
@UseGuards(StoreOwnerJwtGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  // ─── Store list & create ──────────────────────────────────────

  @Get()
  async getMyStores(@Request() req: { user: StoreOwnerAccount }) {
    return this.storesService.getMyStores(req.user.id);
  }

  @Post()
  async createStore(
    @Request() req: { user: StoreOwnerAccount },
    @Body() dto: CreateStoreDto,
  ) {
    return this.storesService.createStore(req.user.id, dto);
  }

  @Delete(':storeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStore(
    @Request() req: { user: StoreOwnerAccount },
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    await this.storesService.deleteStore(req.user.id, storeId);
  }

  @Patch(':storeId/rename')
  async renameStore(
    @Request() req: { user: StoreOwnerAccount },
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() body: { name: string },
  ) {
    return this.storesService.renameStore(req.user.id, storeId, body.name);
  }

  // ─── Store detail & info ──────────────────────────────────────

  @Get(':storeId')
  async getMyStore(
    @Request() req: { user: StoreOwnerAccount },
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.storesService.getMyStore(req.user.id, storeId);
  }

  @Patch(':storeId/info')
  async updateStoreInfo(
    @Request() req: { user: StoreOwnerAccount },
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: UpdateStoreInfoDto,
  ) {
    return this.storesService.updateStoreInfo(req.user.id, storeId, dto);
  }

  // ─── Drafts ───────────────────────────────────────────────────

  @Put(':storeId')
  async saveDraft(
    @Request() req: { user: StoreOwnerAccount },
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.saveDraft(req.user.id, storeId, dto);
  }

  @Post(':storeId/submit')
  @HttpCode(HttpStatus.OK)
  async submitDraft(
    @Request() req: { user: StoreOwnerAccount },
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.storesService.submitDraft(req.user.id, storeId);
  }

  @Delete(':storeId/draft')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeDraft(
    @Request() req: { user: StoreOwnerAccount },
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    await this.storesService.revokeDraft(req.user.id, storeId);
  }

  @Get(':storeId/draft')
  async getMyDraft(
    @Request() req: { user: StoreOwnerAccount },
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.storesService.getMyDraft(req.user.id, storeId);
  }

  // ─── Menu items ───────────────────────────────────────────────

  @Get(':storeId/menu-items')
  async getMenuItems(
    @Request() req: { user: StoreOwnerAccount },
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.storesService.getMenuItems(req.user.id, storeId);
  }

  @Post(':storeId/menu-items')
  async addMenuItem(
    @Request() req: { user: StoreOwnerAccount },
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.storesService.addMenuItem(req.user.id, storeId, dto);
  }

  @Put(':storeId/menu-items/:id')
  async updateMenuItem(
    @Request() req: { user: StoreOwnerAccount },
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.storesService.updateMenuItem(req.user.id, storeId, id, dto);
  }

  @Delete(':storeId/menu-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMenuItem(
    @Request() req: { user: StoreOwnerAccount },
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.storesService.removeMenuItem(req.user.id, storeId, id);
  }

  // ─── Images ───────────────────────────────────────────────────

  @Post(':storeId/images')
  async generateImageUploadUrl(
    @Request() req: { user: StoreOwnerAccount },
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() body: { contentType: string },
  ) {
    return this.storesService.generateImageUploadUrl(req.user.id, storeId, body.contentType);
  }

  @Patch(':storeId/images/:id/confirm')
  async confirmImageUpload(
    @Request() req: { user: StoreOwnerAccount },
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.storesService.confirmImageUpload(req.user.id, storeId, id);
  }

  @Delete(':storeId/images/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImage(
    @Request() req: { user: StoreOwnerAccount },
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.storesService.deleteImage(req.user.id, storeId, id);
  }
}
