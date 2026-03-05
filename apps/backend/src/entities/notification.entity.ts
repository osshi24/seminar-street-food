import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum NotificationRecipientType {
  STORE_OWNER = 'store_owner',
  ADMIN = 'admin',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'recipient_type',
    type: 'enum',
    enum: NotificationRecipientType,
  })
  recipientType: NotificationRecipientType;

  @Column({ name: 'recipient_id' })
  recipientId: string;

  @Column({ name: 'event_type', length: 100 })
  eventType: string;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
