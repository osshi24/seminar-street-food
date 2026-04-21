import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreOwnerAccount, StoreOwnerStatus } from '../entities/store-owner-account.entity';
import { Store } from '../stores/entities/store.entity';
import { Notification, NotificationRecipientType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { ListStoreOwnersQueryDto } from './dto/list-store-owners-query.dto';

@Injectable()
export class StoreOwnersService {
  private readonly logger = new Logger(StoreOwnersService.name);

  constructor(
    @InjectRepository(StoreOwnerAccount)
    private readonly storeOwnerRepo: Repository<StoreOwnerAccount>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  async findAll(query: ListStoreOwnersQueryDto) {
    const { status, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

    const qb = this.storeOwnerRepo
      .createQueryBuilder('soa')
      .leftJoinAndSelect('soa.stores', 'store');

    if (status) {
      qb.andWhere('soa.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(soa.fullName ILIKE :search OR soa.email ILIKE :search OR store.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const columnMap: Record<string, string> = {
      createdAt: 'soa.createdAt',
      fullName: 'soa.fullName',
      email: 'soa.email',
      status: 'soa.status',
    };
    const orderColumn = columnMap[sortBy] || 'soa.createdAt';
    qb.orderBy(orderColumn, sortOrder);

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<StoreOwnerAccount> {
    const account = await this.storeOwnerRepo.findOne({
      where: { id },
      relations: ['stores'],
    });
    if (!account) {
      throw new NotFoundException('Store owner not found');
    }
    return account;
  }

  async approve(id: string): Promise<StoreOwnerAccount> {
    const account = await this.findOne(id);

    if (account.status !== StoreOwnerStatus.PENDING) {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'Account is not in pending status' });
    }

    account.status = StoreOwnerStatus.ACTIVE;
    const saved = await this.storeOwnerRepo.save(account);

    await this.notificationsService.create({
      recipientType: NotificationRecipientType.STORE_OWNER,
      recipientId: id,
      eventType: 'ACCOUNT_APPROVED',
      title: 'Tài khoản Store Owner đã được phê duyệt',
      body: 'Chúc mừng! Tài khoản của bạn đã được Admin phê duyệt. Bạn có thể đăng nhập ngay bây giờ.',
    });

    await this.mailService.enqueueEmail({
      to: account.email,
      subject: 'Tài khoản Store Owner đã được phê duyệt',
      template: 'account-approved',
      context: { fullName: account.fullName },
    });

    this.logger.log(`Store Owner approved: ${account.email}`);
    return saved;
  }

  async reject(id: string, reason: string): Promise<StoreOwnerAccount> {
    const account = await this.findOne(id);

    if (account.status !== StoreOwnerStatus.PENDING) {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'Account is not in pending status' });
    }

    account.status = StoreOwnerStatus.REJECTED;
    const saved = await this.storeOwnerRepo.save(account);

    await this.notificationsService.create({
      recipientType: NotificationRecipientType.STORE_OWNER,
      recipientId: id,
      eventType: 'ACCOUNT_REJECTED',
      title: 'Tài khoản Store Owner bị từ chối',
      body: `Lý do từ chối: ${reason}`,
    });

    await this.mailService.enqueueEmail({
      to: account.email,
      subject: 'Tài khoản Store Owner bị từ chối',
      template: 'account-rejected',
      context: { fullName: account.fullName, reason },
    });

    this.logger.log(`Store Owner rejected: ${account.email}`);
    return saved;
  }

  async deactivate(id: string, confirmed: boolean): Promise<{ hasPendingContent?: boolean } | StoreOwnerAccount> {
    const account = await this.findOne(id);

    if (account.status !== StoreOwnerStatus.ACTIVE) {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'Account is not active' });
    }

    // MVP placeholder — pending content check will be implemented in spec 002
    const hasPendingContent = false;

    if (hasPendingContent && !confirmed) {
      return { hasPendingContent: true };
    }

    account.status = StoreOwnerStatus.INACTIVE;
    const saved = await this.storeOwnerRepo.save(account);

    await this.notificationsService.create({
      recipientType: NotificationRecipientType.STORE_OWNER,
      recipientId: id,
      eventType: 'ACCOUNT_DEACTIVATED',
      title: 'Tài khoản Store Owner bị vô hiệu hóa',
      body: 'Tài khoản của bạn đã bị Admin vô hiệu hóa. Vui lòng liên hệ Admin để biết thêm chi tiết.',
    });

    await this.mailService.enqueueEmail({
      to: account.email,
      subject: 'Tài khoản Store Owner bị vô hiệu hóa',
      template: 'account-deactivated',
      context: { fullName: account.fullName },
    });

    this.logger.log(`Store Owner deactivated: ${account.email}`);
    return saved;
  }

  async reactivate(id: string): Promise<StoreOwnerAccount> {
    const account = await this.findOne(id);

    if (account.status !== StoreOwnerStatus.INACTIVE) {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'Account is not inactive' });
    }

    account.status = StoreOwnerStatus.ACTIVE;
    const saved = await this.storeOwnerRepo.save(account);

    await this.notificationsService.create({
      recipientType: NotificationRecipientType.STORE_OWNER,
      recipientId: id,
      eventType: 'ACCOUNT_REACTIVATED',
      title: 'Tài khoản Store Owner đã được kích hoạt lại',
      body: 'Tài khoản của bạn đã được Admin kích hoạt lại. Bạn có thể đăng nhập ngay bây giờ.',
    });

    await this.mailService.enqueueEmail({
      to: account.email,
      subject: 'Tài khoản Store Owner đã được kích hoạt lại',
      template: 'account-reactivated',
      context: { fullName: account.fullName },
    });

    this.logger.log(`Store Owner reactivated: ${account.email}`);
    return saved;
  }
}
