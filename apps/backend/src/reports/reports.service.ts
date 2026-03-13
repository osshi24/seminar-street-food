import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentReport, CommentReportStatus } from '../entities/comment-report.entity';
import { Review } from '../entities/review.entity';
import { ReportReason } from '../entities/report-reason.entity';
import { Store } from '../stores/entities/store.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { CreateReportDto } from './dto/create-report.dto';
import { NotificationRecipientType } from '../entities/notification.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(CommentReport)
    private readonly reportRepo: Repository<CommentReport>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(ReportReason)
    private readonly reasonRepo: Repository<ReportReason>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  async createReport(storeId: string, reviewId: string, reporterId: string, dto: CreateReportDto) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException({ code: 'STORE_NOT_FOUND', message: 'Store not found' });
    }
    if (store.ownerId !== reporterId) {
      throw new ForbiddenException({ code: 'STORE_NOT_OWNED', message: 'You do not own this store' });
    }

    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException({ code: 'REVIEW_NOT_FOUND', message: 'Review not found' });
    }
    if (review.storeId !== storeId) {
      throw new ForbiddenException({ code: 'REVIEW_NOT_IN_STORE', message: 'Review does not belong to this store' });
    }

    const reason = await this.reasonRepo.findOne({ where: { id: dto.reasonId } });
    if (!reason) {
      throw new BadRequestException({ code: 'INVALID_REASON_ID', message: 'Invalid report reason' });
    }

    try {
      const report = await this.reportRepo.save(
        this.reportRepo.create({
          reviewId,
          reporterId,
          reasonId: dto.reasonId,
          status: CommentReportStatus.PENDING,
        }),
      );

      await this.notificationsService.create({
        recipientType: NotificationRecipientType.ADMIN,
        recipientId: 'system',
        eventType: 'COMMENT_REPORT_SUBMITTED',
        title: 'Có bình luận mới bị báo cáo',
        body: `Store Owner đã báo cáo bình luận với lý do: ${reason.labelVi}`,
      });

      await this.mailService.enqueueEmail({
        to: 'admin@phoamthuc.vn',
        subject: 'Bình luận mới bị báo cáo',
        template: 'new-comment-report',
        context: { reportId: report.id, reviewId, reasonLabel: reason.labelVi },
      });

      return {
        id: report.id,
        reviewId: report.reviewId,
        reporterId: report.reporterId,
        reasonId: report.reasonId,
        status: report.status,
        createdAt: report.createdAt,
      };
    } catch (err: any) {
      if (err?.code === '23505') {
        throw new ConflictException({ code: 'REPORT_ALREADY_EXISTS', message: 'You have already reported this review' });
      }
      throw err;
    }
  }
}
