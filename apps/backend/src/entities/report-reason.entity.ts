import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('report_reasons')
export class ReportReason {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'label_vi', length: 100 })
  labelVi: string;

  @Column({ name: 'label_en', length: 100 })
  labelEn: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
