import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';

export enum StoreOwnerStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REJECTED = 'rejected',
}

@Entity('store_owner_accounts')
export class StoreOwnerAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: StoreOwnerStatus,
    default: StoreOwnerStatus.PENDING,
  })
  status: StoreOwnerStatus;

  @Column({ name: 'registration_reason', type: 'text', nullable: true })
  registrationReason: string | null;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'lockout_until', type: 'timestamptz', nullable: true })
  lockoutUntil: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne('Store', 'owner')
  store: unknown;
}
