import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PreferenceTag } from '../../tags/entities/preference-tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ListAdminTagsQueryDto } from './dto/list-admin-tags-query.dto';

export interface TagWithUsage extends PreferenceTag {
  usageCount: number;
}

@Injectable()
export class AdminTagsService {
  constructor(
    @InjectRepository(PreferenceTag)
    private readonly tagRepository: Repository<PreferenceTag>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: ListAdminTagsQueryDto): Promise<{
    data: TagWithUsage[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const keyword = query.keyword?.trim();
    const groupType = query.groupType;
    const inUse = query.inUse;

    const whereParts: string[] = [];
    const params: any[] = [];

    if (keyword) {
      params.push(`%${keyword}%`);
      const p = params.length;
      whereParts.push(`(tu.name_vi ILIKE $${p} OR tu.name_en ILIKE $${p})`);
    }
    if (groupType) {
      params.push(groupType);
      const p = params.length;
      whereParts.push(`tu.group_type = $${p}`);
    }
    if (typeof inUse === 'boolean') {
      whereParts.push(inUse ? `tu.usage_count > 0` : `tu.usage_count = 0`);
    }

    const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countRows = await this.dataSource.query<Array<{ total: string }>>(
      `
      WITH tag_usage AS (
        SELECT pt.id, pt.name_vi, pt.name_en, pt.group_type, pt.created_at, pt.updated_at,
               COUNT(mit.menu_item_id)::int AS usage_count
        FROM preference_tags pt
        LEFT JOIN menu_item_tags mit ON pt.id = mit.tag_id
        GROUP BY pt.id
      )
      SELECT COUNT(*)::int AS total
      FROM tag_usage tu
      ${whereSql}
      `,
      params,
    );

    const total = parseInt(String(countRows?.[0]?.total ?? '0'), 10);

    const listParams = [...params, limit, offset];
    const rows = await this.dataSource.query<
      Array<{
        id: number;
        name_vi: string;
        name_en: string;
        group_type: string;
        created_at: string;
        updated_at: string;
        usage_count: number;
      }>
    >(
      `
      WITH tag_usage AS (
        SELECT pt.id, pt.name_vi, pt.name_en, pt.group_type, pt.created_at, pt.updated_at,
               COUNT(mit.menu_item_id)::int AS usage_count
        FROM preference_tags pt
        LEFT JOIN menu_item_tags mit ON pt.id = mit.tag_id
        GROUP BY pt.id
      )
      SELECT tu.*
      FROM tag_usage tu
      ${whereSql}
      ORDER BY tu.group_type ASC, tu.id ASC
      LIMIT $${listParams.length - 1} OFFSET $${listParams.length}
      `,
      listParams,
    );

    return {
      data: rows.map((r) => ({
        id: r.id,
        nameVi: r.name_vi,
        nameEn: r.name_en,
        groupType: r.group_type as PreferenceTag['groupType'],
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
        menuItems: [],
        usageCount: Number(r.usage_count ?? 0),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(dto: CreateTagDto): Promise<PreferenceTag> {
    const tag = this.tagRepository.create(dto);
    return this.tagRepository.save(tag);
  }

  async update(id: number, dto: UpdateTagDto): Promise<PreferenceTag> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) throw new NotFoundException('Nhãn không tồn tại.');
    Object.assign(tag, dto);
    return this.tagRepository.save(tag);
  }

  async remove(id: number): Promise<void> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) throw new NotFoundException('Nhãn không tồn tại.');

    const [{ count }] = await this.dataSource.query<[{ count: string }]>(
      `SELECT COUNT(*)::int AS count FROM menu_item_tags WHERE tag_id = $1`,
      [id],
    );
    const usageCount = parseInt(count, 10);

    if (usageCount > 0) {
      throw new ConflictException({
        code: 'TAG_IN_USE',
        message: `Nhãn này đang được dùng bởi ${usageCount} món ăn. Hãy gỡ nhãn khỏi tất cả món ăn trước khi xóa.`,
        count: usageCount,
      });
    }

    await this.tagRepository.remove(tag);
  }
}
