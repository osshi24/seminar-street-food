import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationRecipientType } from '../entities/notification.entity';

interface CreateNotificationDto {
  recipientType: NotificationRecipientType;
  recipientId: string;
  eventType: string;
  title: string;
  body?: string;
}

interface NotificationsQuery {
  isRead?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepo.create({
      recipientType: dto.recipientType,
      recipientId: dto.recipientId,
      eventType: dto.eventType,
      title: dto.title,
      body: dto.body ?? null,
    });
    return this.notificationRepo.save(notification);
  }

  async findAllForRecipient(
    recipientType: NotificationRecipientType,
    recipientId: string,
    query: NotificationsQuery = {},
  ): Promise<{ data: Notification[]; total: number }> {
    const { isRead, page = 1, limit = 20 } = query;
    const qb = this.notificationRepo
      .createQueryBuilder('n')
      .where('n.recipient_type = :recipientType', { recipientType })
      .andWhere('n.recipient_id = :recipientId', { recipientId })
      .orderBy('n.created_at', 'DESC');

    if (isRead !== undefined) {
      qb.andWhere('n.is_read = :isRead', { isRead });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async markAsRead(
    id: string,
    recipientType: NotificationRecipientType,
    recipientId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id, recipientType, recipientId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }
}
