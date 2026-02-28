import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Store, StoreStatus } from '../stores/entities/store.entity';
import { StoreContentDraft, DraftStatus } from '../stores/entities/store-content-draft.entity';
import { MenuItem } from '../stores/entities/menu-item.entity';
import { StoreImage } from '../stores/entities/store-image.entity';
import { Commentary, CommentaryPipelineStatus } from '../commentary/entities/commentary.entity';
import { CommentaryTranslation } from '../commentary/entities/commentary-translation.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRecipientType } from '../entities/notification.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { COMMENTARY_QUEUE } from '../commentary/commentary.constants';

@Injectable()
export class AdminStoresService {
  private readonly logger = new Logger(AdminStoresService.name);

  constructor(
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(StoreContentDraft)
    private readonly draftRepo: Repository<StoreContentDraft>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,
    @InjectRepository(StoreImage)
    private readonly storeImageRepo: Repository<StoreImage>,
    @InjectRepository(Commentary)
    private readonly commentaryRepo: Repository<Commentary>,
    @InjectRepository(CommentaryTranslation)
    private readonly translationRepo: Repository<CommentaryTranslation>,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
    @InjectQueue(COMMENTARY_QUEUE) private readonly commentaryQueue: Queue,
  ) {}

  async listPendingDrafts(page = 1, limit = 20) {
    const [data, total] = await this.draftRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.store', 'store')
      .where('d.status = :status', { status: DraftStatus.PENDING })
      .orderBy('d.submittedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async getDraftDetail(draftId: string) {
    const draft = await this.draftRepo.findOne({
      where: { id: draftId },
      relations: ['store'],
    });
    if (!draft) throw new NotFoundException('Draft not found');

    const currentMenuItems = await this.menuItemRepo.find({
      where: { storeId: draft.storeId, isInDraft: false },
    });
    const draftMenuItems = await this.menuItemRepo.find({
      where: { storeId: draft.storeId, isInDraft: true },
    });
    const currentImages = await this.storeImageRepo.find({
      where: { storeId: draft.storeId, isInDraft: false },
      order: { orderIndex: 'ASC' },
    });
    const draftImages = await this.storeImageRepo.find({
      where: { storeId: draft.storeId, isInDraft: true },
    });

    return {
      draft,
      current: {
        name: draft.store.name,
        description: draft.store.description,
        menuItems: currentMenuItems,
        images: currentImages,
      },
      proposed: {
        name: draft.name,
        description: draft.description,
        menuItems: draftMenuItems.map((item) => ({
          ...item,
          action: 'added' as const,
        })),
        images: draftImages.map((img) => ({
          ...img,
          action: 'added' as const,
        })),
      },
    };
  }

  async approveDraft(adminId: string, draftId: string): Promise<void> {
    const draft = await this.draftRepo.findOne({
      where: { id: draftId },
      relations: ['store'],
    });
    if (!draft) throw new NotFoundException('Draft not found');
    if (draft.status !== DraftStatus.PENDING) {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'Draft is not pending' });
    }

    let commentaryId: string | null = null;

    // Transaction
    await this.dataSource.transaction(async (manager) => {
      // Update draft status
      await manager.update(StoreContentDraft, { id: draftId }, {
        status: DraftStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      });

      // Update store info + activate
      await manager.update(Store, { id: draft.storeId }, {
        name: draft.name,
        description: draft.description,
        status: StoreStatus.ACTIVE,
      });

      // Commit menu items: remove is_in_draft items, delete ones not in draft
      await manager.update(MenuItem, { storeId: draft.storeId, isInDraft: true }, { isInDraft: false });

      // Commit images
      await manager.update(StoreImage, { storeId: draft.storeId, isInDraft: true }, { isInDraft: false });

      // Create commentary record (source_text = description)
      const sourceText = draft.description || draft.name;
      const commentary = manager.create(Commentary, {
        storeId: draft.storeId,
        sourceText,
        pipelineStatus: CommentaryPipelineStatus.PENDING,
      });
      const savedCommentary = await manager.save(Commentary, commentary);
      commentaryId = savedCommentary.id;

      // Update store active_commentary_id
      await manager.update(Store, { id: draft.storeId }, {
        activeCommentaryId: commentaryId,
      });
    });

    // After COMMIT: enqueue BullMQ job
    if (commentaryId) {
      try {
        await this.commentaryQueue.add('process', { commentaryId, storeId: draft.storeId });
      } catch (err) {
        this.logger.error(`Failed to enqueue commentary job for ${commentaryId}: ${(err as Error).message}`);
      }

      // Send notification
      try {
        await this.notificationsService.create({
          recipientType: NotificationRecipientType.STORE_OWNER,
          recipientId: draft.store.ownerId,
          eventType: 'STORE_DRAFT_APPROVED',
          title: 'Bản nháp gian hàng đã được duyệt',
          body: `Gian hàng "${draft.name}" đã được Admin phê duyệt.`,
        });
      } catch (err) {
        this.logger.error(`Failed to send notification: ${(err as Error).message}`);
      }
    }
  }

  /** Re-queue all commentaries so Gemini re-translates them from scratch */
  async reprocessAllCommentaries(): Promise<{ queued: number }> {
    const commentaries = await this.commentaryRepo.find();
    let queued = 0;

    for (const commentary of commentaries) {
      // Delete all non-vi translations (vi = source text, keep it)
      await this.translationRepo.delete({
        commentaryId: commentary.id,
      });

      // Re-save Vietnamese source text
      await this.translationRepo.upsert(
        {
          commentaryId: commentary.id,
          languageCode: 'vi',
          translatedText: commentary.sourceText,
          audioUrl: null,
          audioS3Key: null,
        },
        ['commentaryId', 'languageCode'],
      );

      // Reset pipeline status → PENDING
      await this.commentaryRepo.update({ id: commentary.id }, {
        pipelineStatus: CommentaryPipelineStatus.PENDING,
      });

      // Find the store that owns this commentary
      const store = await this.storeRepo.findOne({
        where: { activeCommentaryId: commentary.id },
      });

      // Enqueue job
      await this.commentaryQueue.add('process', {
        commentaryId: commentary.id,
        storeId: store?.id ?? commentary.storeId,
      });
      queued++;
    }

    this.logger.log(`Reprocess: queued ${queued} commentary jobs`);
    return { queued };
  }

  async rejectDraft(adminId: string, draftId: string, reason: string): Promise<void> {
    const draft = await this.draftRepo.findOne({
      where: { id: draftId },
      relations: ['store'],
    });
    if (!draft) throw new NotFoundException('Draft not found');
    if (draft.status !== DraftStatus.PENDING) {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'Draft is not pending' });
    }

    await this.draftRepo.update({ id: draftId }, {
      status: DraftStatus.REJECTED,
      rejectionReason: reason,
      reviewedAt: new Date(),
      reviewedBy: adminId,
    });

    await this.notificationsService.create({
      recipientType: NotificationRecipientType.STORE_OWNER,
      recipientId: draft.store.ownerId,
      eventType: 'STORE_DRAFT_REJECTED',
      title: 'Bản nháp gian hàng bị từ chối',
      body: `Lý do: ${reason}`,
    });
  }
}
