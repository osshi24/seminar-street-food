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

  async findAll(): Promise<TagWithUsage[]> {
    const rows = await this.dataSource.query<
      Array<{
        id: number;
        name_vi: string;
        name_en: string;
        group_type: string;
        created_at: string;
        updated_at: string;
        usage_count: string;
      }>
    >(
      `SELECT pt.*, COUNT(mit.menu_item_id)::int AS usage_count
       FROM preference_tags pt
       LEFT JOIN menu_item_tags mit ON pt.id = mit.tag_id
       GROUP BY pt.id
       ORDER BY pt.group_type ASC, pt.id ASC`,
    );

    return rows.map((r) => ({
      id: r.id,
      nameVi: r.name_vi,
      nameEn: r.name_en,
      groupType: r.group_type as PreferenceTag['groupType'],
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
      menuItems: [],
      usageCount: parseInt(String(r.usage_count), 10),
    }));
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
