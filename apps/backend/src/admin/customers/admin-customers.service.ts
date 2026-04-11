import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { CustomerGoogleAccount } from '../../entities/customer-google-account.entity';
import { Review } from '../../entities/review.entity';
import { ListAdminCustomersQueryDto } from './dto/list-admin-customers-query.dto';
import { CreateAdminCustomerDto } from './dto/create-admin-customer.dto';
import { UpdateAdminCustomerDto } from './dto/update-admin-customer.dto';

export interface AdminCustomerRow {
  id: string;
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
  reviewCount: number;
}

@Injectable()
export class AdminCustomersService {
  constructor(
    @InjectRepository(CustomerGoogleAccount)
    private readonly customerRepo: Repository<CustomerGoogleAccount>,
    private readonly dataSource: DataSource,
  ) {}

  async list(query: ListAdminCustomersQueryDto): Promise<{
    data: AdminCustomerRow[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const keyword = query.keyword?.trim();

    const whereParts: string[] = [];
    const params: any[] = [];

    if (query.id) {
      params.push(query.id);
      whereParts.push(`c.id = $${params.length}`);
    }

    if (keyword) {
      params.push(`%${keyword}%`);
      const p = params.length;
      whereParts.push(`(c.email ILIKE $${p} OR c.display_name ILIKE $${p})`);
    }

    if (typeof query.hasAvatar === 'boolean') {
      whereParts.push(
        query.hasAvatar
          ? `(c.avatar_url IS NOT NULL AND c.avatar_url <> '')`
          : `(c.avatar_url IS NULL OR c.avatar_url = '')`,
      );
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const countRows = await this.dataSource.query<Array<{ total: string }>>(
      `
      SELECT COUNT(*)::int AS total
      FROM customer_google_accounts c
      ${whereSql}
      `,
      params,
    );
    const total = parseInt(String(countRows?.[0]?.total ?? '0'), 10);

    const listParams = [...params, limit, offset];
    const rows = await this.dataSource.query<
      Array<{
        id: string;
        google_id: string;
        email: string;
        display_name: string;
        avatar_url: string | null;
        created_at: string;
        review_count: number;
      }>
    >(
      `
      SELECT
        c.id,
        c.google_id,
        c.email,
        c.display_name,
        c.avatar_url,
        c.created_at,
        COUNT(r.id)::int AS review_count
      FROM customer_google_accounts c
      LEFT JOIN reviews r ON r.customer_id = c.id
      ${whereSql}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT $${listParams.length - 1} OFFSET $${listParams.length}
      `,
      listParams,
    );

    return {
      data: rows.map((r) => ({
        id: r.id,
        googleId: r.google_id,
        email: r.email,
        displayName: r.display_name,
        avatarUrl: r.avatar_url,
        createdAt: new Date(r.created_at),
        reviewCount: Number(r.review_count ?? 0),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<AdminCustomerRow> {
    const rows = await this.dataSource.query<
      Array<{
        id: string;
        google_id: string;
        email: string;
        display_name: string;
        avatar_url: string | null;
        created_at: string;
        review_count: number;
      }>
    >(
      `
      SELECT
        c.id,
        c.google_id,
        c.email,
        c.display_name,
        c.avatar_url,
        c.created_at,
        COUNT(r.id)::int AS review_count
      FROM customer_google_accounts c
      LEFT JOIN reviews r ON r.customer_id = c.id
      WHERE c.id = $1
      GROUP BY c.id
      `,
      [id],
    );
    const r = rows?.[0];
    if (!r) throw new NotFoundException({ code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' });
    return {
      id: r.id,
      googleId: r.google_id,
      email: r.email,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      createdAt: new Date(r.created_at),
      reviewCount: Number(r.review_count ?? 0),
    };
  }

  async create(dto: CreateAdminCustomerDto): Promise<CustomerGoogleAccount> {
    const existing = await this.customerRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException({ code: 'EMAIL_ALREADY_EXISTS', message: 'Email already exists' });
    }

    const googleId = `manual:${randomUUID()}`;
    const entity = this.customerRepo.create({
      googleId,
      email: dto.email,
      displayName: dto.displayName,
      avatarUrl: dto.avatarUrl ?? null,
      avatarKey: null,
    });
    return this.customerRepo.save(entity);
  }

  async update(id: string, dto: UpdateAdminCustomerDto): Promise<CustomerGoogleAccount> {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException({ code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' });

    if (dto.email && dto.email !== customer.email) {
      const existing = await this.customerRepo.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException({ code: 'EMAIL_ALREADY_EXISTS', message: 'Email already exists' });
    }

    Object.assign(customer, dto);
    return this.customerRepo.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException({ code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' });

    const [{ count }] = await this.dataSource.query<[{ count: string }]>(
      `SELECT COUNT(*)::int AS count FROM reviews WHERE customer_id = $1`,
      [id],
    );
    const reviewCount = parseInt(String(count ?? '0'), 10);
    if (reviewCount > 0) {
      throw new ConflictException({
        code: 'CUSTOMER_HAS_REVIEWS',
        message: `Customer này có ${reviewCount} đánh giá. Không thể xóa.`,
        count: reviewCount,
      });
    }

    await this.customerRepo.remove(customer);
  }

  async setAvatarFields(id: string, avatarUrl: string | null, avatarKey: string | null) {
    await this.customerRepo.update(id, { avatarUrl, avatarKey });
  }

  async getAvatarKey(id: string): Promise<string | null> {
    const customer = await this.customerRepo.findOne({ where: { id }, select: ['id', 'avatarKey'] as any });
    if (!customer) throw new NotFoundException({ code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' });
    return customer.avatarKey ?? null;
  }
}

