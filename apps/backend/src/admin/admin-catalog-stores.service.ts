import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store, StoreStatus } from '../stores/entities/store.entity';
import { StoreOwnerAccount } from '../entities/store-owner-account.entity';
import { Review } from '../entities/review.entity';
import { CommentReport } from '../entities/comment-report.entity';
import { StoreContentDraft, DraftStatus } from '../stores/entities/store-content-draft.entity';
import { LocationPin } from '../location/entities/location-pin.entity';
import { ListAdminStoresQueryDto } from './dto/list-admin-stores-query.dto';

@Injectable()
export class AdminCatalogStoresService {
  constructor(
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
    @InjectRepository(StoreOwnerAccount)
    private readonly ownerRepo: Repository<StoreOwnerAccount>,
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
    @InjectRepository(CommentReport) private readonly reportRepo: Repository<CommentReport>,
    @InjectRepository(StoreContentDraft)
    private readonly draftRepo: Repository<StoreContentDraft>,
    @InjectRepository(LocationPin) private readonly pinRepo: Repository<LocationPin>,
  ) {}

  async findAll(query: ListAdminStoresQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.storeRepo.createQueryBuilder('store');
    qb.leftJoin(StoreOwnerAccount, 'owner', 'owner.id = store.owner_id');

    if (query.status) {
      qb.andWhere('store.status = :status', { status: query.status });
    }

    if (query.search?.trim()) {
      const s = `%${query.search.trim()}%`;
      qb.andWhere('(store.name ILIKE :s OR owner.email ILIKE :s OR owner.full_name ILIKE :s)', { s });
    }

    qb.orderBy('store.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    qb.select([
      'store.id AS id',
      'store.name AS name',
      'store.status AS status',
      'store.created_at AS "createdAt"',
      'owner.id AS "ownerId"',
      'owner.email AS "ownerEmail"',
      'owner.full_name AS "ownerFullName"',
    ]);

    const [itemsRaw, total] = await Promise.all([qb.getRawMany(), qb.getCount()]);

    const items = itemsRaw.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      owner: {
        id: r.ownerId,
        email: r.ownerEmail,
        fullName: r.ownerFullName,
      },
      createdAt: r.createdAt,
    }));

    return { items, total, page, limit };
  }

  async activate(storeId: string) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException({ code: 'STORE_NOT_FOUND', message: 'Store not found' });
    if (store.status === StoreStatus.ACTIVE) return { id: store.id, status: store.status };
    store.status = StoreStatus.ACTIVE;
    await this.storeRepo.save(store);
    return { id: store.id, status: store.status };
  }

  async deactivate(storeId: string) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException({ code: 'STORE_NOT_FOUND', message: 'Store not found' });
    if (store.status === StoreStatus.INACTIVE) return { id: store.id, status: store.status };
    store.status = StoreStatus.INACTIVE;
    await this.storeRepo.save(store);
    return { id: store.id, status: store.status };
  }

  async getDeleteImpact(storeId: string) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException({ code: 'STORE_NOT_FOUND', message: 'Store not found' });

    const [reviewCount, locationPinCount, pendingDraft] = await Promise.all([
      this.reviewRepo.count({ where: { storeId } }),
      this.pinRepo.count({ where: { storeId } }),
      this.draftRepo.findOne({
        where: { storeId, status: DraftStatus.PENDING },
        select: { id: true },
      }),
    ]);

    const reportCount = await this.reportRepo
      .createQueryBuilder('cr')
      .innerJoin(Review, 'r', 'r.id = cr.review_id')
      .where('r.store_id = :storeId', { storeId })
      .getCount();

    const hasRelatedData =
      reviewCount > 0 || reportCount > 0 || locationPinCount > 0 || Boolean(pendingDraft);

    return {
      storeId,
      reviewCount,
      reportCount,
      pendingDraft: Boolean(pendingDraft),
      locationPinCount,
      hasRelatedData,
    };
  }

  async remove(storeId: string, confirmed: boolean) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException({ code: 'STORE_NOT_FOUND', message: 'Store not found' });

    const impact = await this.getDeleteImpact(storeId);
    if (impact.hasRelatedData && !confirmed) {
      throw new ConflictException({
        code: 'STORE_DELETE_REQUIRES_CONFIRMATION',
        message: 'Gian hàng còn dữ liệu liên quan. Xác nhận xóa toàn bộ?',
        details: impact,
      });
    }

    await this.storeRepo.remove(store);
  }
}

