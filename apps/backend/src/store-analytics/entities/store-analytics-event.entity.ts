import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type AnalyticsEventType = 'qr_scan' | 'store_visit';

@Entity('store_analytics_events')
@Index(['storeId', 'createdAt'])
export class StoreAnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  eventType: AnalyticsEventType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
