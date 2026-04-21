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

@Controller('store-owner')
@UseGuards(StoreOwnerJwtGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('stores')
  async getMyStores(@Request() req: { user: StoreOwnerAccount }) {
    return this.storesService.getMyStores(req.user.id);
  }

  @Post('stores')
  async createStore(
    @Request() req: { user: StoreOwnerAccount },
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.createStore(req.user.id, dto);
  }

  @Get('stores/:id')
  async getStoreById(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) storeId: string,
  ) {
    return this.storesService.getStoreById(req.user.id, storeId);
  }

  @Get('store')
  async getMyStore(@Request() req: { user: StoreOwnerAccount }) {
    return this.storesService.getMyStore(req.user.id);
  }

  @Patch('store/info')
  async updateStoreInfo(
    @Request() req: { user: StoreOwnerAccount },
    @Body() dto: UpdateStoreInfoDto,
  ) {
    return this.storesService.updateStoreInfo(req.user.id, dto);
  }

  @Patch('stores/:id/info')
  async updateStoreInfoById(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) storeId: string,
    @Body() dto: UpdateStoreInfoDto,
  ) {
    return this.storesService.updateStoreInfo(req.user.id, dto, storeId);
  }

  @Put('stores/:id/draft')
  async saveDraftById(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) storeId: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.saveDraft(req.user.id, dto, storeId);
  }

  @Post('stores/:id/draft/submit')
  @HttpCode(HttpStatus.OK)
  async submitDraftById(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) storeId: string,
  ) {
    return this.storesService.submitDraft(req.user.id, storeId);
  }

  @Delete('stores/:id/draft')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeDraftById(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) storeId: string,
  ) {
    await this.storesService.revokeDraft(req.user.id, storeId);
  }

  @Get('stores/:id/draft')
  async getDraftById(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) storeId: string,
  ) {
    return this.storesService.getMyDraft(req.user.id, storeId);
  }

  // Per-store image management
  @Post('stores/:id/images')
  async generateImageUploadUrlById(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) storeId: string,
    @Body() body: { contentType: string },
  ) {
    return this.storesService.generateImageUploadUrl(req.user.id, body.contentType, storeId);
  }

  @Patch('stores/:id/images/:imageId/confirm')
  async confirmImageUploadById(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) storeId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.storesService.confirmImageUpload(req.user.id, imageId, storeId);
  }

  @Delete('stores/:id/images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImageById(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) storeId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    await this.storesService.deleteImage(req.user.id, imageId, storeId);
  }

  @Put('store')
  async saveDraft(@Request() req: { user: StoreOwnerAccount }, @Body() dto: UpdateStoreDto) {
    return this.storesService.saveDraft(req.user.id, dto);
  }

  @Post('store/submit')
  @HttpCode(HttpStatus.OK)
  async submitDraft(@Request() req: { user: StoreOwnerAccount }) {
    return this.storesService.submitDraft(req.user.id);
  }

  @Delete('store/draft')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeDraft(@Request() req: { user: StoreOwnerAccount }) {
    await this.storesService.revokeDraft(req.user.id);
  }

  @Get('store/draft')
  async getMyDraft(@Request() req: { user: StoreOwnerAccount }) {
    return this.storesService.getMyDraft(req.user.id);
  }

  // Menu items
  @Get('store/menu-items')
  async getMenuItems(@Request() req: { user: StoreOwnerAccount }) {
    return this.storesService.getMenuItems(req.user.id);
  }

  @Post('store/menu-items')
  async addMenuItem(
    @Request() req: { user: StoreOwnerAccount },
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.storesService.addMenuItem(req.user.id, dto);
  }

  @Put('store/menu-items/:id')
  async updateMenuItem(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.storesService.updateMenuItem(req.user.id, id, dto);
  }

  @Delete('store/menu-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMenuItem(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.storesService.removeMenuItem(req.user.id, id);
  }

  // Menu item image (single)
  @Post('store/menu-items/:id/image')
  async generateMenuItemImageUploadUrl(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { contentType: string },
  ) {
    return this.storesService.generateMenuItemImageUploadUrl(
      req.user.id,
      id,
      body.contentType,
    );
  }

  @Delete('store/menu-items/:id/image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMenuItemImage(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.storesService.deleteMenuItemImage(req.user.id, id);
  }

  // Images
  @Post('store/images')
  async generateImageUploadUrl(
    @Request() req: { user: StoreOwnerAccount },
    @Body() body: { contentType: string },
  ) {
    return this.storesService.generateImageUploadUrl(req.user.id, body.contentType);
  }

  @Patch('store/images/:id/confirm')
  async confirmImageUpload(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.storesService.confirmImageUpload(req.user.id, id);
  }

  @Delete('store/images/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImage(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.storesService.deleteImage(req.user.id, id);
  }
}
