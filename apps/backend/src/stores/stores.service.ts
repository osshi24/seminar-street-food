import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Store, StoreStatus, StoreApprovalStatus } from './entities/store.entity';
import { StoreContentDraft, DraftStatus } from './entities/store-content-draft.entity';
import { MenuItem } from './entities/menu-item.entity';
import { StoreImage } from './entities/store-image.entity';
import { AdminAccount } from '../entities/admin-account.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRecipientType } from '../entities/notification.entity';
import { StorageService } from '../storage/storage.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreInfoDto } from './dto/update-store-info.dto';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-item.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StoresService {
  private readonly logger = new Logger(StoresService.name);

  constructor(
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(StoreContentDraft)
    private readonly draftRepo: Repository<StoreContentDraft>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,
    @InjectRepository(StoreImage)
    private readonly storeImageRepo: Repository<StoreImage>,
    @InjectRepository(AdminAccount)
    private readonly adminRepo: Repository<AdminAccount>,
    private readonly notificationsService: NotificationsService,
    private readonly storageService: StorageService,
    private readonly dataSource: DataSource,
  ) {}

  async getMyStores(ownerId: string) {
    const stores = await this.storeRepo.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      stores.map(async (store) => {
        const firstImage = await this.storeImageRepo.findOne({
          where: { storeId: store.id, isInDraft: false },
          order: { orderIndex: 'ASC', createdAt: 'DESC' },
        });
        return { ...store, thumbnailUrl: firstImage?.url ?? null };
      }),
    );
  }

  async getStoreById(ownerId: string, storeId: string) {
    const store = await this.storeRepo.findOne({
      where: { id: storeId, ownerId },
    });
    if (!store) throw new NotFoundException('Store not found');

    const menuItems = await this.menuItemRepo.find({
      where: { storeId: store.id, isInDraft: false },
    });
    const images = await this.storeImageRepo.find({
      where: { storeId: store.id },
      order: { orderIndex: 'ASC', createdAt: 'DESC' },
    });
    const pendingDraft = await this.draftRepo.findOne({
      where: { storeId: store.id, status: DraftStatus.PENDING },
    });

    return {
      ...store,
      menuItems,
      images,
      hasPendingDraft: !!pendingDraft,
    };
  }

  async createStore(ownerId: string, dto: UpdateStoreDto) {
    const existingCount = await this.storeRepo.count({
      where: { ownerId },
    });
    if (existingCount >= 3) {
      throw new BadRequestException({ code: 'STORE_LIMIT_EXCEEDED', message: 'Maximum 3 stores per owner' });
    }

    const store = this.storeRepo.create({
      ownerId,
      name: dto.name,
      description: dto.description ?? null,
      status: StoreStatus.INACTIVE,
      approvalStatus: StoreApprovalStatus.PENDING,
    });
    return this.storeRepo.save(store);
  }

  async requestDeletion(ownerId: string, storeId: string): Promise<void> {
    const store = await this.storeRepo.findOne({ where: { id: storeId, ownerId } });
    if (!store) throw new NotFoundException('Store not found');
    if (store.deletionRequestedAt) {
      throw new ConflictException({ code: 'DELETION_ALREADY_REQUESTED', message: 'Deletion already requested' });
    }
    store.deletionRequestedAt = new Date();
    await this.storeRepo.save(store);
  }

  async revokeDeletionRequest(ownerId: string, storeId: string): Promise<void> {
    const store = await this.storeRepo.findOne({ where: { id: storeId, ownerId } });
    if (!store) throw new NotFoundException('Store not found');
    store.deletionRequestedAt = null;
    await this.storeRepo.save(store);
  }

  async updateStoreInfo(ownerId: string, dto: UpdateStoreInfoDto, storeId: string): Promise<Store> {
    const store = await this.storeRepo.findOne({ where: { id: storeId, ownerId } });
    if (!store) throw new NotFoundException('Store not found');

    if (dto.phone !== undefined) store.phone = dto.phone || null;
    if (dto.address !== undefined) store.address = dto.address || null;
    if (dto.openingHours !== undefined) store.openingHours = dto.openingHours || null;
    if (dto.socialLinks !== undefined) store.socialLinks = dto.socialLinks ?? null;

    return this.storeRepo.save(store);
  }

  async toggleStoreStatus(ownerId: string, storeId: string, active: boolean): Promise<Store> {
    const store = await this.storeRepo.findOne({ where: { id: storeId, ownerId } });
    if (!store) throw new NotFoundException('Store not found');
    if (store.approvalStatus !== StoreApprovalStatus.APPROVED) {
      throw new UnprocessableEntityException({
        code: 'STORE_NOT_APPROVED',
        message: 'Store must be approved before changing its visibility',
      });
    }
    store.status = active ? StoreStatus.ACTIVE : StoreStatus.INACTIVE;
    return this.storeRepo.save(store);
  }

  private async findStoreOrThrow(ownerId: string, storeId: string): Promise<Store> {
    const store = await this.storeRepo.findOne({ where: { id: storeId, ownerId } });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async saveDraft(ownerId: string, dto: UpdateStoreDto, storeId: string): Promise<StoreContentDraft> {
    const store = await this.findStoreOrThrow(ownerId, storeId);

    const existing = await this.draftRepo.findOne({
      where: { storeId: store.id, status: DraftStatus.PENDING },
    });
    if (existing) {
      throw new ConflictException({ code: 'DRAFT_PENDING', message: 'A pending draft already exists' });
    }

    const draft = this.draftRepo.create({
      storeId: store.id,
      name: dto.name,
      description: dto.description ?? null,
      status: DraftStatus.PENDING,
    });
    return this.draftRepo.save(draft);
  }

  async submitDraft(ownerId: string, storeId: string): Promise<StoreContentDraft> {
    const store = await this.findStoreOrThrow(ownerId, storeId);

    const draft = await this.draftRepo.findOne({
      where: { storeId: store.id, status: DraftStatus.PENDING },
    });
    if (!draft) throw new NotFoundException('No pending draft found');

    const admins = await this.adminRepo.find();
    for (const admin of admins) {
      await this.notificationsService.create({
        recipientType: NotificationRecipientType.ADMIN,
        recipientId: admin.id,
        eventType: 'STORE_DRAFT_SUBMITTED',
        title: 'Bản nháp gian hàng mới cần duyệt',
        body: `Gian hàng "${store.name}" đã gửi bản nháp mới.`,
      });
    }

    return draft;
  }

  async revokeDraft(ownerId: string, storeId: string): Promise<void> {
    const store = await this.findStoreOrThrow(ownerId, storeId);

    await this.dataSource.transaction(async (manager) => {
      const draft = await manager.findOne(StoreContentDraft, {
        where: { storeId: store.id, status: DraftStatus.PENDING },
        lock: { mode: 'pessimistic_write' },
      });
      if (!draft) throw new NotFoundException('No pending draft found');
      if (draft.status === DraftStatus.APPROVED) {
        throw new ConflictException('Draft has been approved. Cannot revoke.');
      }

      await manager.delete(StoreContentDraft, { id: draft.id });
      await manager.update(MenuItem, { storeId: store.id, isInDraft: true }, { isInDraft: false });
    });
  }

  async getMyDraft(ownerId: string, storeId: string): Promise<StoreContentDraft> {
    const store = await this.findStoreOrThrow(ownerId, storeId);

    const draft = await this.draftRepo.findOne({
      where: [
        { storeId: store.id, status: DraftStatus.PENDING },
        { storeId: store.id, status: DraftStatus.REJECTED },
      ],
      order: { submittedAt: 'DESC' },
    });
    if (!draft) throw new NotFoundException('No draft found');
    return draft;
  }

  async getMenuItems(ownerId: string, storeId: string): Promise<MenuItem[]> {
    const store = await this.findStoreOrThrow(ownerId, storeId);
    return this.menuItemRepo.find({ where: { storeId: store.id } });
  }

  async addMenuItem(ownerId: string, dto: CreateMenuItemDto, storeId: string): Promise<MenuItem> {
    const store = await this.findStoreOrThrow(ownerId, storeId);

    const item = this.menuItemRepo.create({
      storeId: store.id,
      name: dto.name,
      description: dto.description ?? null,
      price: dto.price,
      isInDraft: false,
    });
    return this.menuItemRepo.save(item);
  }

  async updateMenuItem(ownerId: string, itemId: string, dto: UpdateMenuItemDto, storeId: string): Promise<MenuItem> {
    const store = await this.findStoreOrThrow(ownerId, storeId);

    const item = await this.menuItemRepo.findOne({
      where: { id: itemId },
      relations: ['tags'],
    });
    if (!item) throw new NotFoundException('Menu item not found');
    if (item.storeId !== store.id) throw new ForbiddenException('Access denied');

    const { tagIds, ...rest } = dto;
    Object.assign(item, { ...rest });

    if (tagIds !== undefined) {
      await this.dataSource.query(
        `DELETE FROM menu_item_tags WHERE menu_item_id = $1`,
        [itemId],
      );
      if (tagIds.length > 0) {
        const values = tagIds.map((_, i) => `($1, $${i + 2})`).join(', ');
        await this.dataSource.query(
          `INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES ${values}`,
          [itemId, ...tagIds],
        );
      }
    }

    return this.menuItemRepo.save(item);
  }

  async removeMenuItem(ownerId: string, itemId: string, storeId: string): Promise<void> {
    const store = await this.findStoreOrThrow(ownerId, storeId);

    const item = await this.menuItemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Menu item not found');
    if (item.storeId !== store.id) throw new ForbiddenException('Access denied');

    if (item.imageS3Key) {
      try {
        await this.storageService.deleteObject(item.imageS3Key);
      } catch (err) {
        this.logger.warn(
          `Failed deleting menu item image for ${item.id}: ${(err as Error).message}`,
        );
      }
    }

    await this.menuItemRepo.delete({ id: itemId });
  }

  async generateMenuItemImageUploadUrl(
    ownerId: string,
    itemId: string,
    contentType: string,
    storeId: string,
  ): Promise<{ presignedUrl: string; imageUrl: string }> {
    const store = await this.findStoreOrThrow(ownerId, storeId);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(contentType)) {
      throw new UnprocessableEntityException({
        code: 'UNSUPPORTED_IMAGE_TYPE',
        message: 'Only JPG, PNG, WebP are supported',
      });
    }

    const item = await this.menuItemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Menu item not found');
    if (item.storeId !== store.id) throw new ForbiddenException('Access denied');

    if (item.imageS3Key) {
      try {
        await this.storageService.deleteObject(item.imageS3Key);
      } catch (err) {
        this.logger.warn(
          `Failed deleting old menu item image for ${item.id}: ${(err as Error).message}`,
        );
      }
    }

    const ext =
      contentType === 'image/png'
        ? 'png'
        : contentType === 'image/webp'
          ? 'webp'
          : 'jpg';
    const s3Key = `stores/${store.id}/menu-items/${item.id}/${uuidv4()}.${ext}`;
    const presignedUrl = await this.storageService.generatePresignedPutUrl(
      s3Key,
      contentType,
    );
    const imageUrl = this.storageService.getPublicUrl(s3Key);

    item.imageUrl = imageUrl;
    item.imageS3Key = s3Key;
    await this.menuItemRepo.save(item);

    return { presignedUrl, imageUrl };
  }

  async deleteMenuItemImage(ownerId: string, itemId: string, storeId: string): Promise<void> {
    const store = await this.findStoreOrThrow(ownerId, storeId);

    const item = await this.menuItemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Menu item not found');
    if (item.storeId !== store.id) throw new ForbiddenException('Access denied');

    if (item.imageS3Key) {
      await this.storageService.deleteObject(item.imageS3Key);
    }

    item.imageUrl = null;
    item.imageS3Key = null;
    await this.menuItemRepo.save(item);
  }

  async generateImageUploadUrl(ownerId: string, contentType: string, storeId: string): Promise<{ presignedUrl: string; s3Key: string; imageId: string }> {
    const store = await this.findStoreOrThrow(ownerId, storeId);

    const activeImages = await this.storeImageRepo.count({
      where: { storeId: store.id, isInDraft: false },
    });
    if (activeImages >= 10) {
      throw new UnprocessableEntityException({ code: 'IMAGE_LIMIT_EXCEEDED', message: 'Maximum 10 images per store' });
    }

    const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
    const s3Key = `stores/${store.id}/images/${uuidv4()}.${ext}`;
    const presignedUrl = await this.storageService.generatePresignedPutUrl(s3Key, contentType);
    const url = this.storageService.getPublicUrl(s3Key);

    const image = this.storeImageRepo.create({
      storeId: store.id,
      url,
      s3Key,
      isInDraft: true,
    });
    const saved = await this.storeImageRepo.save(image);

    return { presignedUrl, s3Key, imageId: saved.id };
  }

  async confirmImageUpload(ownerId: string, imageId: string, storeId: string): Promise<StoreImage> {
    const store = await this.findStoreOrThrow(ownerId, storeId);

    const image = await this.storeImageRepo.findOne({ where: { id: imageId } });
    if (!image || image.storeId !== store.id) throw new NotFoundException('Image not found');

    image.isInDraft = false;
    return this.storeImageRepo.save(image);
  }

  async deleteImage(ownerId: string, imageId: string, storeId: string): Promise<void> {
    const store = await this.findStoreOrThrow(ownerId, storeId);

    const image = await this.storeImageRepo.findOne({ where: { id: imageId } });
    if (!image) throw new NotFoundException('Image not found');
    if (image.storeId !== store.id) throw new ForbiddenException('Access denied');

    await this.storageService.deleteObject(image.s3Key);
    await this.storeImageRepo.delete({ id: imageId });
  }
}
