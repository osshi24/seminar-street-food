import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { MenuItem } from './menu-item.entity';

/**
 * Pre-generated translations for menu item content (name, description).
 * One row per menu item + language combination.
 */
@Entity('menu_item_translations')
@Unique(['menuItemId', 'languageCode'])
export class MenuItemTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'menu_item_id' })
  menuItemId: string;

  @Column({ name: 'language_code', length: 10 })
  languageCode: string;

  @Column({ name: 'translated_name', length: 500, nullable: true })
  translatedName: string | null;

  @Column({ name: 'translated_description', type: 'text', nullable: true })
  translatedDescription: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => MenuItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_item_id' })
  menuItem: MenuItem;
}
