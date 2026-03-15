import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreferenceTag, TagGroupType } from './entities/preference-tag.entity';

const GROUP_ORDER: TagGroupType[] = ['dish_type', 'flavor', 'allergen'];
const GROUP_LABELS: Record<TagGroupType, string> = {
  dish_type: 'Loại món ăn',
  flavor: 'Khẩu vị',
  allergen: 'Dị ứng thực phẩm',
};

export interface TagItem {
  id: number;
  nameVi: string;
  nameEn: string;
}

export interface TagGroup {
  groupType: TagGroupType;
  label: string;
  tags: TagItem[];
}

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(PreferenceTag)
    private readonly tagRepository: Repository<PreferenceTag>,
  ) {}

  async findGrouped(): Promise<TagGroup[]> {
    const tags = await this.tagRepository.find({
      order: { groupType: 'ASC', id: 'ASC' },
    });

    const map = new Map<TagGroupType, TagItem[]>();
    for (const g of GROUP_ORDER) map.set(g, []);

    for (const tag of tags) {
      const group = map.get(tag.groupType);
      if (group) {
        group.push({ id: tag.id, nameVi: tag.nameVi, nameEn: tag.nameEn });
      }
    }

    return GROUP_ORDER.map((g) => ({
      groupType: g,
      label: GROUP_LABELS[g],
      tags: map.get(g) ?? [],
    }));
  }
}
