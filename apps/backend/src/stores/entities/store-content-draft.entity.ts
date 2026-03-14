import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Store } from './store.entity';

export enum DraftStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('store_content_drafts')
export class StoreContentDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 1000, nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: DraftStatus,
    default: DraftStatus.PENDING,
  })
  status: DraftStatus;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt: Date;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: string | null;

  @ManyToOne(() => Store, (store) => store.drafts)
  @JoinColumn({ name: 'store_id' })
  store: Store;
}
