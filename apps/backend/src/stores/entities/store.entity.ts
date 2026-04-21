import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StoreContentDraft } from './store-content-draft.entity';
import { MenuItem } from './menu-item.entity';
import { StoreImage } from './store-image.entity';
import { Commentary } from '../../commentary/entities/commentary.entity';
import { StoreOwnerAccount } from '../../entities/store-owner-account.entity';

export enum StoreStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum StoreApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 1000, nullable: true })
  description: string | null;

  @Column({ length: 20, nullable: true })
  phone: string | null;

  @Column({ length: 500, nullable: true })
  address: string | null;

  @Column({ name: 'opening_hours', length: 255, nullable: true })
  openingHours: string | null;

  @Column({ name: 'social_links', type: 'jsonb', nullable: true })
  socialLinks: { facebook?: string; instagram?: string; tiktok?: string } | null;

  @Column({
    type: 'enum',
    enum: StoreStatus,
    default: StoreStatus.INACTIVE,
  })
  status: StoreStatus;

  @Column({
    name: 'approval_status',
    type: 'enum',
    enum: StoreApprovalStatus,
    default: StoreApprovalStatus.PENDING,
  })
  approvalStatus: StoreApprovalStatus;

  @Column({ name: 'active_commentary_id', nullable: true })
  activeCommentaryId: string | null;

  @Column({ name: 'avg_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  avgRating: number;

  @Column({ name: 'review_count', type: 'int', default: 0 })
  reviewCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => StoreContentDraft, (draft) => draft.store)
  drafts: StoreContentDraft[];

  @OneToMany(() => MenuItem, (item) => item.store)
  menuItems: MenuItem[];

  @OneToMany(() => StoreImage, (image) => image.store)
  images: StoreImage[];

  @OneToMany(() => Commentary, (c) => c.store)
  commentaries: Commentary[];

  @ManyToOne(() => Commentary, { nullable: true, eager: false })
  @JoinColumn({ name: 'active_commentary_id' })
  activeCommentary: Commentary | null;

  @ManyToOne(() => StoreOwnerAccount, (account) => account.stores, { nullable: true, eager: false })
  @JoinColumn({ name: 'owner_id' })
  owner: StoreOwnerAccount | null;
}
