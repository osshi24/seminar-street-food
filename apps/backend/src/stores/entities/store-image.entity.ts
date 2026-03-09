import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Store } from './store.entity';

@Entity('store_images')
export class StoreImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ name: 's3_key', type: 'text' })
  s3Key: string;

  @Column({ name: 'order_index', type: 'smallint', default: 0 })
  orderIndex: number;

  @Column({ name: 'is_in_draft', default: false })
  isInDraft: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Store, (store) => store.images)
  @JoinColumn({ name: 'store_id' })
  store: Store;
}
