import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { CommentaryTranslation } from './commentary-translation.entity';

export enum CommentaryPipelineStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('commentaries')
export class Commentary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @Column({ name: 'source_text', length: 1000 })
  sourceText: string;

  @Column({
    name: 'pipeline_status',
    type: 'enum',
    enum: CommentaryPipelineStatus,
    default: CommentaryPipelineStatus.PENDING,
  })
  pipelineStatus: CommentaryPipelineStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Store, (store) => store.commentaries)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @OneToMany(() => CommentaryTranslation, (t) => t.commentary)
  translations: CommentaryTranslation[];
}
