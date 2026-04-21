import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Review } from '../entities/review.entity';
import { Store } from '../stores/entities/store.entity';
import { CommentReport } from '../entities/comment-report.entity';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { ListAdminReviewsQueryDto, ReviewVisibilityFilter } from './dto/list-admin-reviews-query.dto';
import { AuditLogService } from '../monitoring/audit-log.service';
import { AdminAccount } from '../entities/admin-account.entity';

@Controller('admin/reviews')
@UseGuards(AdminJwtGuard)
export class AdminReviewsController {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(CommentReport)
    private readonly reportRepo: Repository<CommentReport>,
    private readonly dataSource: DataSource,
    private readonly auditLog: AuditLogService,
  ) {}

  private actor(req: Request) {
    const admin = req.user as AdminAccount;
    return {
      actorId: admin?.id ?? null,
      actorRole: 'admin' as const,
      actorName: admin?.fullName ?? admin?.email ?? null,
      ip: req.ip ?? null,
    };
  }

  @Get()
  async listReviews(@Query() query: ListAdminReviewsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.reviewRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.customer', 'c')
      .leftJoinAndSelect('r.store', 's')
      .orderBy('r.created_at', 'DESC');

    if (query.storeId) {
      qb.andWhere('r.store_id = :storeId', { storeId: query.storeId });
    }
    if (query.status === ReviewVisibilityFilter.VISIBLE) {
      qb.andWhere('r.is_hidden = false');
    } else if (query.status === ReviewVisibilityFilter.HIDDEN) {
      qb.andWhere('r.is_hidden = true');
    }
    if (query.keyword) {
      qb.andWhere('r.content ILIKE :keyword', { keyword: `%${query.keyword}%` });
    }

    const [reviews, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

    // Get report counts per review
    const reviewIds = reviews.map((r) => r.id);
    const reportCounts: Record<string, number> = {};
    if (reviewIds.length > 0) {
      const counts = await this.reportRepo
        .createQueryBuilder('cr')
        .select('cr.review_id', 'reviewId')
        .addSelect('COUNT(*)', 'count')
        .where('cr.review_id IN (:...reviewIds)', { reviewIds })
        .groupBy('cr.review_id')
        .getRawMany<{ reviewId: string; count: string }>();
      for (const c of counts) {
        reportCounts[c.reviewId] = parseInt(c.count, 10);
      }
    }

    return {
      data: reviews.map((r) => ({
        id: r.id,
        stars: r.stars,
        content: r.content,
        isHidden: r.isHidden,
        hiddenAt: r.hiddenAt,
        createdAt: r.createdAt,
        reportCount: reportCounts[r.id] ?? 0,
        customer: r.customer ? { displayName: r.customer.displayName, avatarUrl: r.customer.avatarUrl } : null,
        store: r.store ? { id: r.store.id, name: r.store.name } : null,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Patch(':id/hide')
  async hideReview(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const adminId = (req.user as { id: string }).id;
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException({ code: 'REVIEW_NOT_FOUND', message: 'Review not found' });
    if (review.isHidden) throw new ConflictException({ code: 'REVIEW_ALREADY_HIDDEN', message: 'Review is already hidden' });

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Review, id, { isHidden: true, hiddenAt: new Date(), hiddenBy: adminId });
      await this.recalcRating(manager, review.storeId);
    });

    await this.auditLog.record({
      ...this.actor(req),
      action: 'review.hide',
      resourceType: 'review',
      resourceId: id,
      metadata: { storeId: review.storeId, stars: review.stars },
    });

    return { message: 'Review hidden' };
  }

  @Patch(':id/unhide')
  async unhideReview(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException({ code: 'REVIEW_NOT_FOUND', message: 'Review not found' });
    if (!review.isHidden) throw new ConflictException({ code: 'REVIEW_NOT_HIDDEN', message: 'Review is not hidden' });

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Review, id, { isHidden: false, hiddenAt: null, hiddenBy: null });
      await this.recalcRating(manager, review.storeId);
    });

    await this.auditLog.record({
      ...this.actor(req),
      action: 'review.unhide',
      resourceType: 'review',
      resourceId: id,
      metadata: { storeId: review.storeId },
    });

    return { message: 'Review unhidden' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReview(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException({ code: 'REVIEW_NOT_FOUND', message: 'Review not found' });

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Review, id);
      await this.recalcRating(manager, review.storeId);
    });

    await this.auditLog.record({
      ...this.actor(req),
      action: 'review.delete',
      resourceType: 'review',
      resourceId: id,
      metadata: { storeId: review.storeId, stars: review.stars },
    });
  }

  private async recalcRating(manager: any, storeId: string) {
    const raw = await manager
      .createQueryBuilder(Review, 'r')
      .select('AVG(r.stars)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.store_id = :storeId', { storeId })
      .andWhere('r.is_hidden = false')
      .getRawOne() as { avg: string; count: string };
    const { avg, count } = raw;

    await manager
      .createQueryBuilder()
      .update(Store)
      .set({
        avgRating: parseFloat(parseFloat(avg ?? '0').toFixed(2)),
        reviewCount: parseInt(count ?? '0', 10),
      })
      .where('id = :storeId', { storeId })
      .execute();
  }
}
