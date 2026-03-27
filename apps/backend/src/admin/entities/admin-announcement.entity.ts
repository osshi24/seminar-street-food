import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminAccount } from '../../entities/admin-account.entity';

export enum AdminAnnouncementRecipientMode {
  SINGLE_STORE = 'single_store',
  MULTI_STORE = 'multi_store',
  ALL_STORES = 'all_stores',
}

export enum AdminAnnouncementStatus {
  DRAFT = 'draft',
  SENT = 'sent',
}

@Entity('admin_announcements')
export class AdminAnnouncement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'admin_id' })
  adminId: string;

  @ManyToOne(() => AdminAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'admin_id' })
  admin: AdminAccount;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({
    name: 'recipient_mode',
    type: 'enum',
    enum: AdminAnnouncementRecipientMode,
    enumName: 'admin_announcement_recipient_mode',
  })
  recipientMode: AdminAnnouncementRecipientMode;

  @Column({
    name: 'store_ids',
    type: 'uuid',
    array: true,
    nullable: true,
  })
  storeIds: string[] | null;

  @Column({
    type: 'enum',
    enum: AdminAnnouncementStatus,
    enumName: 'admin_announcement_status',
    default: AdminAnnouncementStatus.DRAFT,
  })
  status: AdminAnnouncementStatus;

  @Column({ name: 'recipient_count', type: 'int', default: 0 })
  recipientCount: number;

  @Column({ name: 'failed_email_details', type: 'jsonb', nullable: true })
  failedEmailDetails: unknown | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;
}

