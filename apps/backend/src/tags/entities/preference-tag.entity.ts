import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { MenuItem } from '../../stores/entities/menu-item.entity';

export type TagGroupType = 'dish_type' | 'flavor' | 'allergen';

@Entity('preference_tags')
export class PreferenceTag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name_vi', length: 100 })
  nameVi: string;

  @Column({ name: 'name_en', length: 100 })
  nameEn: string;

  @Column({ name: 'group_type', length: 50 })
  groupType: TagGroupType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToMany(() => MenuItem, (menuItem) => menuItem.tags)
  menuItems: MenuItem[];
}
