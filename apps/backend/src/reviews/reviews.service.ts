import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Review } from '../entities/review.entity';
import { Store, StoreStatus } from '../stores/entities/store.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    private readonly dataSource: DataSource,
  ) {}

  async listPublicReviews(storeId: string, query: ListReviewsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException({ code: 'STORE_NOT_FOUND', message: 'Store not found' });
    }

    const qb = this.reviewRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.customer', 'c')
      .where('r.storeId = :storeId', { storeId })
      .andWhere('r.isHidden = false');

    if (query.stars) {
      qb.andWhere('r.stars = :stars', { stars: query.stars });
    }

    qb.orderBy('r.createdAt', query.sort === 'asc' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [reviews, total] = await qb.getManyAndCount();

    return {
      data: reviews.map((r) => ({
        id: r.id,
        stars: r.stars,
        content: r.content,
        createdAt: r.createdAt,
        customer: {
          displayName: r.customer?.displayName ?? 'Unknown',
          avatarUrl: r.customer?.avatarUrl ?? null,
        },
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        avgRating: Number(store.avgRating),
        reviewCount: store.reviewCount,
      },
    };
  }

  async submitReview(storeId: string, customerId: string, dto: CreateReviewDto) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException({ code: 'STORE_NOT_FOUND', message: 'Store not found' });
    }
    if (store.status !== StoreStatus.ACTIVE) {
      throw new NotFoundException({ code: 'STORE_NOT_FOUND', message: 'Store not found' });
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const review = manager.create(Review, {
          storeId,
          customerId,
          stars: dto.stars,
          content: dto.content ?? null,
        });
        const saved = await manager.save(Review, review);

        const raw = await manager
          .createQueryBuilder(Review, 'r')
          .select('AVG(r.stars)', 'avg')
          .addSelect('COUNT(*)', 'count')
          .where('r.storeId = :storeId', { storeId })
          .andWhere('r.isHidden = false')
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

        return {
          id: saved.id,
          storeId: saved.storeId,
          customerId: saved.customerId,
          stars: saved.stars,
          content: saved.content,
          createdAt: saved.createdAt,
        };
      });
    } catch (err: any) {
      if (err?.code === '23505') {
        throw new ConflictException({ code: 'REVIEW_ALREADY_EXISTS', message: 'You have already reviewed this store' });
      }
      throw err;
    }
  }
}
