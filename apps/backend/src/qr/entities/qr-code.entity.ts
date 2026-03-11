import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { StoreOwnerAccount } from '../../entities/store-owner-account.entity';

@Entity('qr_codes')
@Index('uq_one_active_qr_per_store', ['storeId'], {
  unique: true,
  where: '"is_active" = TRUE',
})
export class QrCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ type: 'uuid', unique: true, default: () => 'gen_random_uuid()' })
  token: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => StoreOwnerAccount)
  @JoinColumn({ name: 'created_by' })
  creator: StoreOwnerAccount;
}
