import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Review } from './review.entity';
import { StoreOwnerAccount } from './store-owner-account.entity';
import { ReportReason } from './report-reason.entity';

export enum CommentReportStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('comment_reports')
export class CommentReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'review_id' })
  reviewId: string;

  @ManyToOne(() => Review, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review;

  @Column({ name: 'reporter_id' })
  reporterId: string;

  @ManyToOne(() => StoreOwnerAccount)
  @JoinColumn({ name: 'reporter_id' })
  reporter: StoreOwnerAccount;

  @Column({ name: 'reason_id' })
  reasonId: number;

  @ManyToOne(() => ReportReason)
  @JoinColumn({ name: 'reason_id' })
  reason: ReportReason;

  @Column({
    type: 'enum',
    enum: CommentReportStatus,
    default: CommentReportStatus.PENDING,
  })
  status: CommentReportStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'resolved_at', nullable: true, type: 'timestamptz' })
  resolvedAt: Date | null;

  @Column({ name: 'resolved_by', nullable: true, type: 'uuid' })
  resolvedBy: string | null;
}
