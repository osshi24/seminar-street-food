import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Store, StoreStatus } from './entities/store.entity';
import { StoreContentDraft, DraftStatus } from './entities/store-content-draft.entity';
import { MenuItem } from './entities/menu-item.entity';
import { StoreImage } from './entities/store-image.entity';
import { AdminAccount } from '../entities/admin-account.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRecipientType } from '../entities/notification.entity';
import { StorageService } from '../storage/storage.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreInfoDto } from './dto/update-store-info.dto';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-item.dto';
import { v4 as uuidv4 } from 'uuid';

const MAX_STORES_PER_OWNER = 3;

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

  // ─── Ownership helpers ────────────────────────────────────────

  /** List all stores for an owner with summary stats */
  async getMyStores(ownerId: string) {
    const stores = await this.storeRepo.find({
      where: { ownerId },
      order: { createdAt: 'ASC' },
    });

    return Promise.all(stores.map(async (store) => {
      const [menuItemCount, imageCount] = await Promise.all([
        this.menuItemRepo.count({ where: { storeId: store.id } }),
        this.storeImageRepo.count({ where: { storeId: store.id } }),
      ]);
      return {
        ...store,
        menuItemCount,
        imageCount,
        hasCommentary: !!store.activeCommentaryId,
      };
    }));
  }

  /** Fetch one store and verify ownership. Throws 404/403. */
  private async resolveOwnedStore(ownerId: string, storeId: string): Promise<Store> {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');
    if (store.ownerId !== ownerId) throw new ForbiddenException('Access denied');
    return store;
  }

  // ─── Create store ─────────────────────────────────────────────

  async createStore(ownerId: string, dto: CreateStoreDto): Promise<Store> {
    const count = await this.storeRepo.count({ where: { ownerId } });
    if (count >= MAX_STORES_PER_OWNER) {
      throw new ConflictException({ code: 'STORE_LIMIT_EXCEEDED', message: `Maximum ${MAX_STORES_PER_OWNER} stores per owner` });
    }

    const store = this.storeRepo.create({
      ownerId,
      name: dto.name,
      description: dto.description ?? null,
      status: StoreStatus.INACTIVE,
    });
    return this.storeRepo.save(store);
  }

  /** Delete a store (only if inactive and owner has > 1 store) */
  async deleteStore(ownerId: string, storeId: string): Promise<void> {
    const store = await this.resolveOwnedStore(ownerId, storeId);

    const count = await this.storeRepo.count({ where: { ownerId } });
    if (count <= 1) {
      throw new ConflictException({ code: 'LAST_STORE', message: 'Không thể xóa gian hàng duy nhất' });
    }
    if (store.status === StoreStatus.ACTIVE) {
      throw new ConflictException({ code: 'STORE_ACTIVE', message: 'Không thể xóa gian hàng đang hoạt động. Vui lòng liên hệ Admin.' });
    }

    // Delete related data
    await this.storeImageRepo.delete({ storeId });
    await this.menuItemRepo.delete({ storeId });
    await this.draftRepo.delete({ storeId });
    await this.storeRepo.delete({ id: storeId });
  }

  /** Quick rename (no draft needed) for inactive stores */
  async renameStore(ownerId: string, storeId: string, name: string): Promise<Store> {
    const store = await this.resolveOwnedStore(ownerId, storeId);
    store.name = name;
    return this.storeRepo.save(store);
  }

  // ─── Store detail ─────────────────────────────────────────────

  async getMyStore(ownerId: string, storeId: string) {
    const store = await this.resolveOwnedStore(ownerId, storeId);

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

  async updateStoreInfo(ownerId: string, storeId: string, dto: UpdateStoreInfoDto): Promise<Store> {
    const store = await this.resolveOwnedStore(ownerId, storeId);

    if (dto.phone !== undefined) store.phone = dto.phone || null;
    if (dto.address !== undefined) store.address = dto.address || null;
    if (dto.openingHours !== undefined) store.openingHours = dto.openingHours || null;
    if (dto.socialLinks !== undefined) store.socialLinks = dto.socialLinks ?? null;

    return this.storeRepo.save(store);
  }

  // ─── Drafts ───────────────────────────────────────────────────

  async saveDraft(ownerId: string, storeId: string, dto: UpdateStoreDto): Promise<StoreContentDraft> {
    const store = await this.resolveOwnedStore(ownerId, storeId);

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
    const store = await this.resolveOwnedStore(ownerId, storeId);

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
    const store = await this.resolveOwnedStore(ownerId, storeId);

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
    const store = await this.resolveOwnedStore(ownerId, storeId);

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

  // ─── Menu items ───────────────────────────────────────────────

  async getMenuItems(ownerId: string, storeId: string): Promise<MenuItem[]> {
    await this.resolveOwnedStore(ownerId, storeId);
    return this.menuItemRepo.find({ where: { storeId } });
  }

  async addMenuItem(ownerId: string, storeId: string, dto: CreateMenuItemDto): Promise<MenuItem> {
    const store = await this.resolveOwnedStore(ownerId, storeId);

    const pending = await this.draftRepo.findOne({
      where: { storeId: store.id, status: DraftStatus.PENDING },
    });
    if (pending) {
      throw new ConflictException({ code: 'DRAFT_PENDING', message: 'Cannot edit while draft is pending' });
    }

    const item = this.menuItemRepo.create({
      storeId: store.id,
      name: dto.name,
      description: dto.description ?? null,
      price: dto.price,
      isInDraft: true,
    });
    return this.menuItemRepo.save(item);
  }

  async updateMenuItem(ownerId: string, storeId: string, itemId: string, dto: UpdateMenuItemDto): Promise<MenuItem> {
    const store = await this.resolveOwnedStore(ownerId, storeId);

    const item = await this.menuItemRepo.findOne({
      where: { id: itemId },
      relations: ['tags'],
    });
    if (!item) throw new NotFoundException('Menu item not found');
    if (item.storeId !== store.id) throw new ForbiddenException('Access denied');

    const { tagIds, ...rest } = dto;
    Object.assign(item, { ...rest, isInDraft: true });

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

  async removeMenuItem(ownerId: string, storeId: string, itemId: string): Promise<void> {
    const store = await this.resolveOwnedStore(ownerId, storeId);

    const item = await this.menuItemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Menu item not found');
    if (item.storeId !== store.id) throw new ForbiddenException('Access denied');

    if (item.isInDraft) {
      await this.menuItemRepo.delete({ id: itemId });
    } else {
      item.isInDraft = true;
      await this.menuItemRepo.save(item);
    }
  }

  // ─── Images ───────────────────────────────────────────────────

  async generateImageUploadUrl(ownerId: string, storeId: string, contentType: string): Promise<{ presignedUrl: string; s3Key: string; imageId: string }> {
    const store = await this.resolveOwnedStore(ownerId, storeId);

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

  async confirmImageUpload(ownerId: string, storeId: string, imageId: string): Promise<StoreImage> {
    const store = await this.resolveOwnedStore(ownerId, storeId);

    const image = await this.storeImageRepo.findOne({ where: { id: imageId } });
    if (!image || image.storeId !== store.id) throw new NotFoundException('Image not found');

    image.isInDraft = false;
    return this.storeImageRepo.save(image);
  }

  async deleteImage(ownerId: string, storeId: string, imageId: string): Promise<void> {
    const store = await this.resolveOwnedStore(ownerId, storeId);

    const image = await this.storeImageRepo.findOne({ where: { id: imageId } });
    if (!image) throw new NotFoundException('Image not found');
    if (image.storeId !== store.id) throw new ForbiddenException('Access denied');

    await this.storageService.deleteObject(image.s3Key);
    await this.storeImageRepo.delete({ id: imageId });
  }
}
