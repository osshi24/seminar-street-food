import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Store } from '../stores/entities/store.entity';
import { CustomerGoogleAccount } from './customer-google-account.entity';
import { CommentReport } from './comment-report.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => CustomerGoogleAccount)
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerGoogleAccount;

  @Column({ type: 'smallint' })
  stars: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  content: string | null;

  @Column({ name: 'is_hidden', default: false })
  isHidden: boolean;

  @Column({ name: 'hidden_at', nullable: true, type: 'timestamptz' })
  hiddenAt: Date | null;

  @Column({ name: 'hidden_by', nullable: true, type: 'uuid' })
  hiddenBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => CommentReport, (report) => report.review)
  reports: CommentReport[];
}
