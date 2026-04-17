import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { Store } from './store.entity';
import { PreferenceTag } from '../../tags/entities/preference-tag.entity';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 0 })
  price: number;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'image_s3_key', type: 'text', nullable: true })
  imageS3Key: string | null;

  @Column({ name: 'is_in_draft', default: false })
  isInDraft: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Store, (store) => store.menuItems)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToMany(() => PreferenceTag, (tag) => tag.menuItems)
  @JoinTable({
    name: 'menu_item_tags',
    joinColumn: { name: 'menu_item_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: PreferenceTag[];
}
