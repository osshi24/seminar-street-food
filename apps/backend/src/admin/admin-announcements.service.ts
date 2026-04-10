import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  AdminAnnouncement,
  AdminAnnouncementRecipientMode,
  AdminAnnouncementStatus,
} from './entities/admin-announcement.entity';
import { CreateAdminAnnouncementDto } from './dto/create-admin-announcement.dto';
import { UpdateAdminAnnouncementDto } from './dto/update-admin-announcement.dto';
import { Store } from '../stores/entities/store.entity';
import { StoreOwnerAccount } from '../entities/store-owner-account.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRecipientType } from '../entities/notification.entity';
import { MailService } from '../mail/mail.service';

const ADMIN_ANNOUNCEMENT_EVENT_TYPE = 'ADMIN_ANNOUNCEMENT';

@Injectable()
export class AdminAnnouncementsService {
  private readonly logger = new Logger(AdminAnnouncementsService.name);

  constructor(
    @InjectRepository(AdminAnnouncement)
    private readonly announcementRepo: Repository<AdminAnnouncement>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(StoreOwnerAccount)
    private readonly ownerRepo: Repository<StoreOwnerAccount>,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateAdminAnnouncementDto, adminId: string) {
    this.validateRecipient(dto.recipientMode, dto.storeIds);

    let announcement = await this.announcementRepo.save(
      this.announcementRepo.create({
        adminId,
        title: dto.title,
        body: dto.body,
        recipientMode: dto.recipientMode,
        storeIds: dto.recipientMode === AdminAnnouncementRecipientMode.ALL_STORES ? null : dto.storeIds ?? null,
        status: AdminAnnouncementStatus.DRAFT,
        sentAt: null,
      }),
    );

    if (dto.action === 'send') {
      announcement = await this.sendAnnouncement(announcement.id, adminId);
    }

    return announcement;
  }

  async updateDraft(id: string, dto: UpdateAdminAnnouncementDto, adminId: string) {
    const announcement = await this.announcementRepo.findOne({ where: { id } });
    if (!announcement) {
      throw new NotFoundException({ code: 'ANNOUNCEMENT_NOT_FOUND', message: 'Announcement not found' });
    }
    if (announcement.adminId !== adminId) {
      throw new NotFoundException({ code: 'ANNOUNCEMENT_NOT_FOUND', message: 'Announcement not found' });
    }
    if (announcement.status !== AdminAnnouncementStatus.DRAFT) {
      throw new ConflictException({
        code: 'ANNOUNCEMENT_ALREADY_SENT',
        message: 'Announcement already sent',
      });
    }

    const recipientMode = dto.recipientMode ?? announcement.recipientMode;
    const storeIds = dto.storeIds ?? announcement.storeIds ?? undefined;
    this.validateRecipient(recipientMode, storeIds);

    Object.assign(announcement, {
      title: dto.title ?? announcement.title,
      body: dto.body ?? announcement.body,
      recipientMode,
      storeIds: recipientMode === AdminAnnouncementRecipientMode.ALL_STORES ? null : storeIds ?? null,
    });

    return this.announcementRepo.save(announcement);
  }

  async sendAnnouncement(id: string, adminId: string) {
    const announcement = await this.announcementRepo.findOne({ where: { id } });
    if (!announcement) {
      throw new NotFoundException({ code: 'ANNOUNCEMENT_NOT_FOUND', message: 'Announcement not found' });
    }
    if (announcement.adminId !== adminId) {
      throw new NotFoundException({ code: 'ANNOUNCEMENT_NOT_FOUND', message: 'Announcement not found' });
    }
    if (announcement.status === AdminAnnouncementStatus.SENT) {
      throw new ConflictException({
        code: 'ANNOUNCEMENT_ALREADY_SENT',
        message: 'Announcement already sent',
      });
    }

    this.validateRecipient(announcement.recipientMode, announcement.storeIds ?? undefined);

    const owners = await this.resolveRecipients(announcement.recipientMode, announcement.storeIds ?? undefined);
    this.logger.log(
      `Sending announcement ${announcement.id} to ${owners.length} owners (mode=${announcement.recipientMode})`,
    );

    const failedEmailDetails: Array<{ email: string; error: string }> = [];
    for (const owner of owners) {
      await this.notificationsService.create({
        recipientType: NotificationRecipientType.STORE_OWNER,
        recipientId: owner.id,
        eventType: ADMIN_ANNOUNCEMENT_EVENT_TYPE,
        title: announcement.title,
        body: announcement.body,
      });

      try {
        await this.mailService.enqueueEmail({
          to: owner.email,
          subject: announcement.title,
          template: 'admin-announcement',
          context: { title: announcement.title, body: announcement.body },
        });
      } catch (err) {
        failedEmailDetails.push({
          email: owner.email,
          error: (err as Error)?.message ?? 'Unknown error',
        });
      }
    }

    announcement.status = AdminAnnouncementStatus.SENT;
    announcement.sentAt = new Date();
    announcement.recipientCount = owners.length;
    announcement.failedEmailDetails = failedEmailDetails.length ? failedEmailDetails : null;
    await this.announcementRepo.save(announcement);

    if (failedEmailDetails.length) {
      this.logger.warn(
        `Announcement ${announcement.id} had ${failedEmailDetails.length} email failures (see failedEmailDetails)`,
      );
    }
    return announcement;
  }

  async list(page = 1, limit = 20) {
    const [items, total] = await this.announcementRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  private validateRecipient(mode: AdminAnnouncementRecipientMode, storeIds?: string[]) {
    if (mode === AdminAnnouncementRecipientMode.ALL_STORES) return;
    if (!storeIds?.length) {
      throw new BadRequestException({
        code: 'STORE_IDS_REQUIRED',
        message: 'storeIds is required for selected recipientMode',
      });
    }
  }

  private async resolveRecipients(mode: AdminAnnouncementRecipientMode, storeIds?: string[]) {
    let stores: Store[];
    if (mode === AdminAnnouncementRecipientMode.ALL_STORES) {
      stores = await this.storeRepo.find({ select: { ownerId: true } as any });
    } else {
      stores = await this.storeRepo.find({
        where: { id: In(storeIds ?? []) },
        select: { id: true, ownerId: true } as any,
      });
    }

    const ownerIds = Array.from(new Set(stores.map((s) => s.ownerId).filter(Boolean)));
    if (!ownerIds.length) return [];

    return this.ownerRepo.find({
      where: { id: In(ownerIds) },
      select: { id: true, email: true, fullName: true } as any,
    });
  }
}

