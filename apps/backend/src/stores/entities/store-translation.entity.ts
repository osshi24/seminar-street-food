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
import { Store } from './store.entity';

/**
 * Pre-generated translations for store content (name, description).
 * One row per store + language combination.
 */
@Entity('store_translations')
@Unique(['storeId', 'languageCode'])
export class StoreTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id' })
  storeId: string;

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

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;
}
