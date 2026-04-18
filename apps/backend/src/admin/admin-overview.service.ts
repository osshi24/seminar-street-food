import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store, StoreStatus } from '../stores/entities/store.entity';
import { StoreOwnerAccount, StoreOwnerStatus } from '../entities/store-owner-account.entity';
import { StoreContentDraft, DraftStatus } from '../stores/entities/store-content-draft.entity';
import { LocationPin, LocationPinStatus } from '../location/entities/location-pin.entity';
import { CommentReport, CommentReportStatus } from '../entities/comment-report.entity';
import { Review } from '../entities/review.entity';
import { PreferenceTag } from '../tags/entities/preference-tag.entity';
import {
  AdminAnnouncement,
  AdminAnnouncementStatus,
} from './entities/admin-announcement.entity';

@Injectable()
export class AdminOverviewService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(StoreOwnerAccount)
    private readonly storeOwnerRepo: Repository<StoreOwnerAccount>,
    @InjectRepository(StoreContentDraft)
    private readonly draftRepo: Repository<StoreContentDraft>,
    @InjectRepository(LocationPin)
    private readonly pinRepo: Repository<LocationPin>,
    @InjectRepository(CommentReport)
    private readonly reportRepo: Repository<CommentReport>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(PreferenceTag)
    private readonly tagRepo: Repository<PreferenceTag>,
    @InjectRepository(AdminAnnouncement)
    private readonly announcementRepo: Repository<AdminAnnouncement>,
  ) {}

  async getOverview() {
    const [
      storesTotal,
      storesActive,
      storesInactive,
      ownersTotal,
      ownersPending,
      ownersActive,
      ownersInactive,
      ownersRejected,
      draftsPending,
      pinsPending,
      pinsApproved,
      reportsTotal,
      reportsPending,
      reportsResolved,
      reviewsTotal,
      reviewsHidden,
      tagsTotal,
      announcementsDraft,
      announcementsSent,
      recentDraftsRaw,
      recentReportsRaw,
      recentReviews,
    ] = await Promise.all([
      this.storeRepo.count(),
      this.storeRepo.count({ where: { status: StoreStatus.ACTIVE } }),
      this.storeRepo.count({ where: { status: StoreStatus.INACTIVE } }),
      this.storeOwnerRepo.count(),
      this.storeOwnerRepo.count({ where: { status: StoreOwnerStatus.PENDING } }),
      this.storeOwnerRepo.count({ where: { status: StoreOwnerStatus.ACTIVE } }),
      this.storeOwnerRepo.count({ where: { status: StoreOwnerStatus.INACTIVE } }),
      this.storeOwnerRepo.count({ where: { status: StoreOwnerStatus.REJECTED } }),
      this.draftRepo.count({ where: { status: DraftStatus.PENDING } }),
      this.pinRepo.count({ where: { status: LocationPinStatus.PENDING } }),
      this.pinRepo.count({ where: { status: LocationPinStatus.APPROVED } }),
      this.reportRepo.count(),
      this.reportRepo.count({ where: { status: CommentReportStatus.PENDING } }),
      this.reportRepo.count({ where: { status: CommentReportStatus.RESOLVED } }),
      this.reviewRepo.count(),
      this.reviewRepo.count({ where: { isHidden: true } }),
      this.tagRepo.count(),
      this.announcementRepo.count({ where: { status: AdminAnnouncementStatus.DRAFT } }),
      this.announcementRepo.count({ where: { status: AdminAnnouncementStatus.SENT } }),
      this.draftRepo.find({
        where: { status: DraftStatus.PENDING },
        relations: ['store'],
        order: { submittedAt: 'DESC' },
        take: 4,
      }),
      this.reportRepo.find({
        where: { status: CommentReportStatus.PENDING },
        relations: ['reason', 'review', 'review.store', 'review.customer', 'reporter'],
        order: { createdAt: 'DESC' },
        take: 4,
      }),
      this.reviewRepo.find({
        relations: ['store', 'customer'],
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    const reviewIds = recentReviews.map((review) => review.id);
    const reportCountMap: Record<string, number> = {};

    if (reviewIds.length > 0) {
      const rows = await this.reportRepo
        .createQueryBuilder('report')
        .select('report.review_id', 'reviewId')
        .addSelect('COUNT(*)', 'count')
        .where('report.review_id IN (:...reviewIds)', { reviewIds })
        .groupBy('report.review_id')
        .getRawMany<{ reviewId: string; count: string }>();

      for (const row of rows) {
        reportCountMap[row.reviewId] = parseInt(row.count, 10);
      }
    }

    return {
      metrics: {
        stores: {
          total: storesTotal,
          active: storesActive,
          inactive: storesInactive,
        },
        storeOwners: {
          total: ownersTotal,
          pending: ownersPending,
          active: ownersActive,
          inactive: ownersInactive,
          rejected: ownersRejected,
        },
        drafts: {
          pending: draftsPending,
        },
        locationPins: {
          pending: pinsPending,
          approved: pinsApproved,
        },
        reports: {
          total: reportsTotal,
          pending: reportsPending,
          resolved: reportsResolved,
        },
        reviews: {
          total: reviewsTotal,
          hidden: reviewsHidden,
          visible: Math.max(reviewsTotal - reviewsHidden, 0),
        },
        tags: {
          total: tagsTotal,
        },
        announcements: {
          draft: announcementsDraft,
          sent: announcementsSent,
        },
      },
      recentDrafts: recentDraftsRaw.map((draft) => ({
        id: draft.id,
        submittedAt: draft.submittedAt,
        store: draft.store
          ? {
              id: draft.store.id,
              name: draft.store.name,
            }
          : null,
        proposedName: draft.name,
      })),
      recentReports: recentReportsRaw.map((report) => ({
        id: report.id,
        createdAt: report.createdAt,
        reason: report.reason
          ? {
              id: report.reason.id,
              labelVi: report.reason.labelVi,
            }
          : null,
        reporter: report.reporter
          ? {
              id: report.reporter.id,
              fullName: report.reporter.fullName,
            }
          : null,
        review: report.review
          ? {
              id: report.review.id,
              content: report.review.content,
              stars: report.review.stars,
              customerName: report.review.customer?.displayName ?? null,
              storeName: report.review.store?.name ?? null,
            }
          : null,
      })),
      recentReviews: recentReviews.map((review) => ({
        id: review.id,
        createdAt: review.createdAt,
        stars: review.stars,
        content: review.content,
        isHidden: review.isHidden,
        reportCount: reportCountMap[review.id] ?? 0,
        customer: review.customer
          ? {
              displayName: review.customer.displayName,
              avatarUrl: review.customer.avatarUrl,
            }
          : null,
        store: review.store
          ? {
              id: review.store.id,
              name: review.store.name,
            }
          : null,
      })),
    };
  }
}
